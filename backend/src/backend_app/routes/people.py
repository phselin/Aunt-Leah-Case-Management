from io import BytesIO

import pandas
from bson import ObjectId
from bson.errors import InvalidId
from flask import Blueprint, jsonify, request, send_file
from flask_jwt_extended import jwt_required
from pydantic import ValidationError
from pymongo import ReturnDocument

from backend_app.auth_init import limiter
from backend_app.db import db
from backend_app.routes.routes_utils import get_program_names, get_programs_structure
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

    person_json = person.model_dump(mode="json")
    res = db.people.find_one_and_replace(
        {"_id": oid}, person_json, return_document=ReturnDocument.AFTER
    )

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

    # Extract program names and milestones from request
    milestones_data = body.get("milestones", {})
    if not milestones_data:
        return jsonify({"detail": "No milestones data provided"}), 400

    program_names = list(milestones_data.keys())

    # Fetch programs from db whose names are in the request
    programs = list(db.programs.find({"name": {"$in": program_names}}))
    if not programs:
        return jsonify({"detail": "No matching programs found"}), 404
    print("programs: ", programs)

    # Fetch goals matching personid and programId
    goals = list(db.goals.find({"personid": oid, "program": {"$in": program_names}}))
    print("goals: ", goals)

    #TODO: Currently just accepts the user input as status. To the TA's, feel free to try and find a way to exploit this for XSS

    # Update goal statuses based on request data
    for program_name in program_names:
        for goal in goals:
            if goal["program"] == program_name:
                new_status = milestones_data[program_name]
                #TODO: check the goalType for program to ensure status exists
                db.goals.update_one(
                    {"_id": goal["_id"]},
                    {"$set": {"status": new_status}}
                )

    # Fetch and return updated person document
    person = db.people.find_one({"_id": oid})
    if not person:
        return jsonify({"detail": "Client not found"}), 404

    person["_id"] = str(person["_id"])
    return jsonify(person), 200
