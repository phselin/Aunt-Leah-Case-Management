from io import BytesIO

import pandas
from bson import ObjectId
from bson.errors import InvalidId
from flask import Blueprint, jsonify, request, send_file
from flask_jwt_extended import jwt_required

from backend_app.auth_init import limiter
from backend_app.db import db

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


# TODO in the future, we will have dynamic fields and using the current design
# of body.get(<field>, "") wll be very inefficint. need something else


@people_bp.put("/people/<id>")
@jwt_required()
def update_person(id):
    try:
        oid = ObjectId(id)
    except InvalidId:
        return jsonify({"detail": "Invalid client ID format"}), 400

    body = request.get_json(silent=True) or {}
    firstname = (body.get("firstname") or "").strip()
    lastname = (body.get("lastname") or "").strip()

    if not firstname or not lastname:
        return jsonify({"detail": "firstname or lastname are required"}), 400

    update_data = {
        "firstname": firstname,
        "lastname": lastname,
        "dob": body.get("dob", ""),
        "gender": body.get("gender", ""),
        "email": body.get("email", ""),
        "phone": body.get("phone", ""),
        "address": body.get("address", ""),
        "programs": body.get("programs", []),
        "referralDate": body.get("referralDate", ""),
    }

    res = db.people.update_one({"_id": oid}, {"$set": update_data})

    if res.matched_count == 0:
        return jsonify({"detail": "Client not found"}), 404

    return jsonify({"detail": "Client updated successfully"}), 200


@people_bp.post("/people")
@jwt_required()
def create_person():
    body = request.get_json(silent=True) or {}

    firstname = (body.get("firstname") or "").strip()
    lastname = (body.get("lastname") or "").strip()

    if not firstname or not lastname:
        return jsonify({"detail": "firstname or lastname are required"}), 400

    # TODO santize fields

    person = {
        "firstname": firstname,
        "lastname": lastname,
        "dob": body.get("dob", ""),
        "gender": body.get("gender", ""),
        "email": body.get("email", ""),
        "phone": body.get("phone", ""),
        "address": body.get("address", ""),
        "programs": body.get("programs", []),
        "referralDate": body.get("referralDate", ""),
    }

    res = db.people.insert_one(person)
    person["_id"] = str(res.inserted_id)
    return jsonify(person), 201


@people_bp.delete("/people/<id>")
@jwt_required()
def delete_person(id):
    try:
        oid = ObjectId(id)
    except InvalidId:
        return jsonify({"detail": "Invalid client ID format"}), 400

    db.people.delete_one({"_id": oid})
    return jsonify({"detail": "Client deleted successfully"}), 200
