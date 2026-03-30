from bson import ObjectId
from bson.errors import InvalidId
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from pymongo import ReturnDocument

from backend_app.db import db
from backend_app.routes.routes_utils import get_current_user_programs, is_admin

casenotes_bp = Blueprint("casenotes", __name__)


def casenote_oid_to_string(casenote):
    return {
        **casenote,
        "goalid": str(casenote.get("goalid", "")),
        "_id": str(casenote.get("_id", "")),
        "personid": str(casenote.get("personid", "")),
    }


@casenotes_bp.get("/people/<id>/casenotes")
@jwt_required()
def get_casenotes(id):
    body = request.get_json(silent=True) or {}
    date = body.get("date")

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

    if date:
        casenotes = list(
            casenote_oid_to_string(casenote)
            for casenote in db.casenotes.find({"personid": person_oid, "date": date})
        )
    else:
        casenotes = list(
            casenote_oid_to_string(casenote)
            for casenote in db.casenotes.find({"personid": person_oid}).sort("date", -1).limit(20)
        )
    return jsonify(casenotes), 200


@casenotes_bp.post("/people/<id>/casenotes")
@jwt_required()
def save_casenote(id):
    body = request.get_json(silent=True) or {}
    date = body.get("date")
    content = body.get("content")
    category = body.get("category")

    if not id or not date:
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

    db.casenotes.insert_one(
        {
            "personid": person_oid,
            "date": date,
            "content": content,
            "category": category,
        }
    )

    return jsonify({"detail": "Casenote saved successfully"}), 201


@casenotes_bp.put("/people/<id>/casenotes/<casenoteid>")
@jwt_required()
def edit_casenote(id, casenoteid):
    body = request.get_json(silent=True) or {}
    content = body.get("content")
    category = body.get("category")

    if not id or not casenoteid:
        return jsonify({"detail": "Missing personid or casenoteid"}), 400

    try:
        person_oid = ObjectId(id)
        casenote_oid = ObjectId(casenoteid)
    except InvalidId:
        return jsonify({"detail": "Invalid Object ID"}), 400

    if not is_admin():
        if not db.people.find_one(
            {"_id": person_oid, "programs": {"$in": get_current_user_programs()}}
        ):
            return jsonify({"detail": "Access denied"}), 403

    res = db.casenotes.find_one_and_update(
        {"personid": person_oid, "_id": casenote_oid},
        {"$set": {"content": content, "category": category}},
        return_document=ReturnDocument.AFTER,
    )

    if not res:
        return (jsonify({"detail": "Casenote not found"}),), 404

    return jsonify(
        {"detail": "Casenote saved successfully", "casenote": casenote_oid_to_string(res)}
    ), 200
