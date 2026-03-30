from bson import ObjectId
from bson.errors import InvalidId
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

from backend_app.db import db
from backend_app.routes.routes_utils import get_current_user_programs, is_admin

casenotes_bp = Blueprint("casenotes", __name__)


@casenotes_bp.get("/people/<id>/casenotes")
@jwt_required()
def get_casenotes(id):
    try:
        person_oid = ObjectId(id)
    except (InvalidId, TypeError):
        return jsonify({"detail": "Invalid Object ID"}), 400

    # comment this for less strict RBAC
    if not is_admin():
        if not db.people.find_one(
            {"_id": person_oid, "programs": {"$in": get_current_user_programs()}}
        ):
            return jsonify({"detail": "Access denied"}), 403

    casenotes = list(
        {
            **casenote,
            "goalid": str(casenote.get("goalid", "")),
        }
        for casenote in db.casenotes.find({"personid": person_oid}, {"_id": 0, "personid": 0}).sort(
            "date", -1
        )
    )
    return jsonify(casenotes), 200


@casenotes_bp.post("/people/<id>/casenotes")
@jwt_required()
def save_casenote(id):
    body = request.get_json(silent=True) or {}
    date_str = body.get("date")
    content = body.get("content")

    if not id or not date_str:
        return jsonify({"detail": "Missing personid or date"}), 400

    try:
        person_oid = ObjectId(id)
    except InvalidId:
        return jsonify({"detail": "Invalid Object ID"}), 400

    if not is_admin():
        if not db.people.find_one(
            {"_id": person_oid, "programs": {"$in": get_current_user_programs()}}
        ):
            return jsonify({"detail": "Access denied"}), 403

    db.casenotes.update_one(
        {"personid": person_oid, "date": date_str}, {"$set": {"content": content}}, upsert=True
    )

    return jsonify({"detail": "Casenote saved successfully"}), 200
