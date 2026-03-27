from datetime import UTC, datetime
from io import BytesIO

import pandas
from bson import ObjectId
from bson.errors import InvalidId
from flask import Blueprint, jsonify, request, send_file
from flask_jwt_extended import jwt_required
from pydantic import ValidationError
from pymongo import ReturnDocument

from backend_app import intake_form
from backend_app.auth_init import limiter
from backend_app.db import db
from backend_app.routes.routes_utils import (
    get_programs_structure,
    remove_empty,
)
from backend_app.schemas.person import Person

people_bp = Blueprint("people", __name__)


def _validation_errors_json(e: ValidationError):
    return e.errors(include_context=False, include_input=False, include_url=False)


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
                    "errors": _validation_errors_json(e),
                }
            ),
            400,
        )

    person_json_with_null = person.model_dump(mode="json")
    person_json = remove_empty(person.model_dump(exclude_none=True, mode="json"))

    unset_fields = {field: "" for field in person_json_with_null if field not in person_json}

    query = {}
    if person_json:
        query["$set"] = person_json
    if unset_fields:
        query["$unset"] = unset_fields

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
                    "errors": _validation_errors_json(e),
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
    milestone = body.get("milestone")

    if program is None or type is None or milestone is None:
        return jsonify({"detail": "Missing fields"}), 400

    valid_programs_structure = get_programs_structure()

    if program not in valid_programs_structure:
        return jsonify({"detail": f"Invalid program {program}"}), 400

    valid_milestone_trees = valid_programs_structure.get(program, {})
    if type not in valid_milestone_trees:
        return jsonify({"detail": f"Invalid milestoneTreeType '{type}' for {program}"}), 400

    valid_milestones = valid_milestone_trees.get(type, [])
    if milestone not in valid_milestones:
        return jsonify({"detail": f"Invalid milestone '{milestone}' for {program}/{type}"}), 400

    person = db.people.find_one({"_id": oid})
    if not person:
        return jsonify({"detail": "Client not found"}), 404

    if program not in person.get("programs", []):
        return jsonify({"detail": f"Client is not enrolled in {program}"}), 400

    milestone_in_db = person.get("programMilestones", {}).get(program, {}).get(type)

    milestone_payload = {
        "value": milestone,
        "lastUpdateDate": datetime.now(UTC),
        "startDate": (
            milestone_in_db["startDate"]
            if milestone_in_db and milestone_in_db.get("startDate")
            else datetime.now(UTC)
        ),
    }
    milestone_update = {
        f"programMilestones.{program}.{type}": milestone_payload,
        f"status.{program}.{type}": milestone_payload,
    }

    res = db.people.find_one_and_update(
        {"_id": oid},
        {"$set": milestone_update},
        return_document=ReturnDocument.AFTER,
    )

    res["_id"] = str(res["_id"])
    return jsonify(res), 200


@people_bp.get("/people/intake")
@jwt_required()
def get_intake_form():
    return jsonify(intake_form.form)
