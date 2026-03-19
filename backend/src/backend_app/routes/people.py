from datetime import UTC, datetime
from io import BytesIO

import pandas
from bson import ObjectId
from bson.errors import InvalidId
from flask import Blueprint, jsonify, request, send_file
from flask_jwt_extended import current_user, jwt_required
from pydantic import ValidationError
from pymongo import ReturnDocument

from backend_app.auth_init import limiter
from backend_app.db import db
from backend_app.routes.routes_utils import get_programs_structure
from backend_app.schemas.person import Person

people_bp = Blueprint("people", __name__)


@people_bp.get("/people")
@jwt_required()
def get_people():
    person = request.args.get("person", "").strip()
    query = {}
    if person:
        p = person.replace(" ", "")
        query["$expr"] = {
            "$or": [
                {
                    "$regexMatch": {
                        "input": {"$concat": ["$firstname", "$lastname"]},
                        "regex": p,
                        "options": "i",
                    }
                },
                {
                    "$regexMatch": {
                        "input": {"$concat": ["$lastname", "$firstname"]},
                        "regex": p,
                        "options": "i",
                    }
                },
            ]
        }
    return jsonify(
        [{**p, "_id": str(p["_id"])} for p in list(db.people.find(query).sort("_id", -1).limit(30))]
    ), 200


@people_bp.get("/people/export")
@limiter.limit("5 per minute")
@jwt_required()
def export_people():
    try:
        data = list(db.people.find({}, {"_id": 0}))
        if not data:
            return jsonify({"detail": "No data"}), 404

        df = pandas.json_normalize(data)
        for col in df.columns:
            df[col] = df[col].apply(lambda x: ", ".join(map(str, x)) if isinstance(x, list) else x)

        file = BytesIO()
        df.to_excel(file, index=False, engine="openpyxl")
        file.seek(0)

        return send_file(file, as_attachment=True, download_name="clients.xlsx")

    except Exception:
        return jsonify({"detail": "Failed to export"}), 500


@people_bp.get("/people/<id>")
@jwt_required()
def get_person(id):
    try:
        oid = ObjectId(id)
    except InvalidId:
        return jsonify({"detail": "Invalid client ID format"}), 400

    person = db.people.find_one({"_id": oid})

    if not person:
        return jsonify({"detail": "Client not found"}), 404
    person["_id"] = str(person["_id"])
    return jsonify(person), 200


@people_bp.put("/people/<id>")
@jwt_required()
def update_person(id):
    try:
        oid = ObjectId(id)
    except InvalidId:
        return jsonify({"detail": "Invalid client ID format"}), 400

    body = request.get_json(silent=True) or {}

    try:
        person = Person.model_validate(
            body,
            context={
                "valid_programs_structure": get_programs_structure(),
            },
        )
    except ValidationError as e:
        return (
            jsonify(
                {
                    "detail": "Validation error",
                    "errors": {
                        str(err["loc"][0]): err["msg"].replace("Value error, ", "")
                        for err in e.errors()
                        if err.get("loc")
                    },
                }
            ),
            400,
        )

    person_json = person.model_dump(exclude_none=True, mode="json")
    query = {"$set": person_json}

    person_in_db = db.people.find_one({"_id": oid})
    if not person_in_db:
        return jsonify({"detail": "Client not found"}), 404

    remove_programs = set(person_in_db.get("status", {}).keys()) - set(person.programs)
    if remove_programs:
        query["$unset"] = {f"status.{p}": "" for p in remove_programs}

    res = db.people.find_one_and_update({"_id": oid}, query, return_document=ReturnDocument.AFTER)

    if not res:
        return jsonify({"detail": "Client not found"}), 404
    res["_id"] = str(res["_id"])
    return jsonify(res), 200


@people_bp.post("/people")
@jwt_required()
def create_person():
    body = request.get_json(silent=True) or {}

    try:
        person = Person.model_validate(
            body,
            context={
                "valid_programs_structure": get_programs_structure(),
            },
        )
    except ValidationError as e:
        return (
            jsonify(
                {
                    "detail": "Validation error",
                    "errors": {
                        str(err["loc"][0]): err["msg"].replace("Value error, ", "")
                        for err in e.errors()
                        if err.get("loc")
                    },
                }
            ),
            400,
        )

    person_json = person.model_dump(exclude_none=True, mode="json")
    res = db.people.insert_one(person_json)
    person_json["_id"] = str(res.inserted_id)
    return jsonify(person_json), 201


@people_bp.delete("/people/<id>")
@jwt_required()
def delete_person(id):
    try:
        oid = ObjectId(id)
    except InvalidId:
        return jsonify({"detail": "Invalid client ID format"}), 400

    db.people.delete_one({"_id": oid})
    return jsonify({"detail": "Client deleted successfully"}), 200


@people_bp.put("/people/<id>/milestones")
@jwt_required()
def update_milestones(id):
    try:
        oid = ObjectId(id)
    except InvalidId:
        return jsonify({"detail": "Invalid client ID format"}), 400

    body = request.get_json(silent=True) or {}

    program = body.get("program")
    type = body.get("type")
    status = body.get("status")

    if program is None or type is None or status is None:
        return jsonify({"detail": "Missing fields"}), 400

    valid_programs_structure = get_programs_structure()

    if program is None or program not in valid_programs_structure:
        return jsonify({"detail": f"Invalid program {program}"}), 400

    valid_milestone_trees = valid_programs_structure.get(program, {})
    if type not in valid_milestone_trees:
        return jsonify({"detail": f"Invalid milestoneTreeType '{type}' for {program}"}), 400

    valid_milestones = valid_milestone_trees.get(type, [])
    if status not in valid_milestones:
        return jsonify({"detail": f"Invalid status '{status}' for {program}/{type}"}), 400

    person = db.people.find_one({"_id": oid})
    if not person:
        return jsonify({"detail": "Client not found"}), 404

    if program not in person.get("programs", []):
        return jsonify({"detail": f"Client is not enrolled in {program}"}), 400

    status_update = {
        f"status.{program}.{type}": {
            "value": status,
            "updatedAt": datetime.now(UTC),
            "updatedBy": current_user["_id"],
        }
    }

    res = db.people.find_one_and_update(
        {"_id": oid},
        {"$set": status_update},
        return_document=ReturnDocument.AFTER,
    )

    res["_id"] = str(res["_id"])
    return jsonify(res), 200
