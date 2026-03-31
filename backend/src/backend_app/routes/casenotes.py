from datetime import date as date_type

from bson import ObjectId
from bson.errors import InvalidId
from flask import Blueprint, jsonify, request
from flask_jwt_extended import current_user, jwt_required
from pymongo import ReturnDocument

from backend_app.db import db
from backend_app.routes.routes_utils import (
    get_current_user_programs,
    get_programs_structure,
    is_admin,
)

casenotes_bp = Blueprint("casenotes", __name__)


def casenote_to_string(casenote):
    serialized = {}
    for key, value in casenote.items():
        serialized[key] = str(value) if isinstance(value, ObjectId) else value
    serialized["_id"] = str(casenote.get("_id", ""))
    serialized["personid"] = str(casenote.get("personid", ""))
    return serialized

@casenotes_bp.get("/people/<id>/casenotes/dates")
@jwt_required()
def get_casenote_dates(id):
    try:
        person_oid = ObjectId(id)
    except (InvalidId, TypeError):
        return jsonify({"detail": "Invalid Object ID"}), 400

    query = {"personid": person_oid}

    if not is_admin():
        current_user_programs = get_current_user_programs()
        query["program"] = {"$in": current_user_programs}
        if not db.people.find_one({"_id": person_oid, "programs": {"$in": current_user_programs}}):
            return jsonify({"detail": "Access denied"}), 403

    dates = sorted(db.casenotes.distinct("date", query), reverse=True)
    return jsonify(dates), 200


@casenotes_bp.get("/people/<id>/casenotes")
@jwt_required()
def get_casenotes(id):
    date = request.args.get("date")

    try:
        person_oid = ObjectId(id)
    except (InvalidId, TypeError):
        return jsonify({"detail": "Invalid Object ID"}), 400

    query = {"personid": person_oid}

    if not is_admin():
        current_user_programs = get_current_user_programs()
        query["program"] = {"$in": current_user_programs}
        if not db.people.find_one({"_id": person_oid, "programs": {"$in": current_user_programs}}):
            return jsonify({"detail": "Access denied"}), 403

    if date:
        query["date"] = date
        casenotes = list(casenote_to_string(cn) for cn in db.casenotes.find(query))
    else:
        casenotes = list(
            casenote_to_string(cn) for cn in db.casenotes.find(query).sort("date", -1).limit(20)
        )
    return jsonify(casenotes), 200


@casenotes_bp.post("/people/<id>/casenotes")
@jwt_required()
def save_casenote(id):
    body = request.get_json(silent=True) or {}

    try:
        person_oid = ObjectId(id)
    except InvalidId:
        return jsonify({"detail": "Invalid Object ID"}), 400

    content = body.get("content")
    date_str = body.get("date")

    if not content or not date_str:
        return jsonify({"detail": "Date and Content are required"}), 400

    try:
        date_val = date_type.fromisoformat(date_str)
    except (ValueError, TypeError):
        return jsonify({"detail": "Invalid date format"}), 400

    program = body.get("program")
    if program and program not in get_programs_structure():
        return jsonify({"detail": f"Program {program} doesn't exist"}), 400

    category = body.get("category")

    if not is_admin():
        current_user_programs = get_current_user_programs()
        if not db.people.find_one(
            {"_id": person_oid, "programs": {"$in": current_user_programs}}
        ) or (program and program not in current_user_programs):
            return jsonify({"detail": "Access denied"}), 403

    author = f"{current_user.get('firstname')} {current_user.get('lastname')}"

    casenote_doc = {
        "personid": person_oid,
        "date": date_val.isoformat(),
        "content": content,
        "author": author,
        "lastUpdatedBy": author,
    }
    if program:
        casenote_doc["program"] = program
    if category:
        casenote_doc["category"] = category

    res = db.casenotes.insert_one(casenote_doc)
    casenote_doc["_id"] = res.inserted_id

    return jsonify(casenote_to_string(casenote_doc)), 201


@casenotes_bp.put("/people/<id>/casenotes/<casenoteid>")
@jwt_required()
def edit_casenote(id, casenoteid):
    body = request.get_json(silent=True) or {}

    try:
        person_oid = ObjectId(id)
        casenote_oid = ObjectId(casenoteid)
    except InvalidId:
        return jsonify({"detail": "Invalid Object ID"}), 400

    program = body.get("program")

    if not is_admin():
        current_user_programs = get_current_user_programs()
        if not db.people.find_one(
            {"_id": person_oid, "programs": {"$in": current_user_programs}}
        ) or (program and program not in current_user_programs):
            return jsonify({"detail": "Access denied"}), 403

    update_fields = {}

    if program:
        update_fields["program"] = program

    content = body.get("content")
    if content:
        update_fields["content"] = content

    category = body.get("category")
    if category:
        update_fields["category"] = category

    update_fields["lastUpdatedBy"] = (
        f"{current_user.get('firstname')} {current_user.get('lastname')}"
    )

    query = {}

    unset_fields = {}
    if "category" in body and not category:
        unset_fields["category"] = ""
    if "program" in body and not program:
        unset_fields["program"] = ""

    if update_fields:
        query["$set"] = update_fields
    if unset_fields:
        query["$unset"] = unset_fields

    res = db.casenotes.find_one_and_update(
        {"_id": casenote_oid}, query, return_document=ReturnDocument.AFTER
    )

    if not res:
        return jsonify({"detail": "Casenote not found"}), 404

    return jsonify(casenote_to_string(res)), 200
