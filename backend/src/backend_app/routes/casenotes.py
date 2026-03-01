from bson import ObjectId
from bson.errors import InvalidId
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

from backend_app.db import db

casenotes_bp = Blueprint("casenotes", __name__)


@casenotes_bp.get("/casenotes")
@jwt_required()
def get_casenotes():
    person = request.args.get("person")
    if not person:
        casenotes = [
            {
                **casenote,
                "_id": str(casenote["_id"]),
                "personid": str(casenote.get("personid", "")),
            }
            for casenote in db.casenotes.find({})
        ]
        return jsonify(casenotes)
    try:
        person_oid = ObjectId(person)
    except (InvalidId, TypeError):
        return jsonify({"detail": "Invalid Object ID"}), 400
    if not db.people.find_one({"_id": person_oid}):
        return jsonify({"detail": "User not found"}), 404
    casenotes = list(
        db.casenotes.find({"personid": person_oid}, {"_id": 0, "personid": 0}).sort("date", -1)
    )
    return jsonify(casenotes), 200


@casenotes_bp.post("/casenotes")
@jwt_required()
def save_casenote():
    body = request.get_json(silent=True) or {}
    personid = body.get("personid")
    date_str = body.get("date")
    content = body.get("content")

    if not personid or not date_str:
        return jsonify({"detail": "Missing personid or date"}), 400

    try:
        person_oid = ObjectId(personid)
    except InvalidId:
        return jsonify({"detail": "Invalid Object ID"}), 400

    db.casenotes.update_one(
        {"personid": person_oid, "date": date_str}, {"$set": {"content": content}}, upsert=True
    )

    return jsonify({"detail": "Casenote saved successfully"}), 200
