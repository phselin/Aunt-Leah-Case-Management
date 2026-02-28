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
from backend_app.routes.routes_utils import get_program_names
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
        person = Person.model_validate(body, context={"valid_programs": get_program_names()})
    except ValidationError as e:
        return (
            jsonify(
                {
                    "detail": "Validation error",
                    "errors": {
                        str(err["loc"][0]): err["msg"] for err in e.errors() if err.get("loc")
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
        person = Person.model_validate(body, context={"valid_programs": get_program_names()})
    except ValidationError as e:
        return (
            jsonify(
                {
                    "detail": "Validation error",
                    "errors": {
                        str(err["loc"][0]): err["msg"] for err in e.errors() if err.get("loc")
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
