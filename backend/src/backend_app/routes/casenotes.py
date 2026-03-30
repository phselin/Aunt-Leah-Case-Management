from bson import ObjectId
from bson.errors import InvalidId
from flask import Blueprint, jsonify, request
from flask_jwt_extended import current_user, jwt_required
from pymongo import ReturnDocument

from backend_app.db import db
from backend_app.routes.routes_utils import (
    get_current_user_programs,
    get_formatted_error,
    get_programs_structure,
    is_admin,
    remove_empty,
)
from backend_app.schemas.casenotes import CaseNote

casenotes_bp = Blueprint("casenotes", __name__)


def casenote_to_string(casenote):
    return {
        **casenote,
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

    query = {"personid": person_oid}
    # comment this for less strict RBAC
    if not is_admin():
        current_user_programs = get_current_user_programs()
        query["programs"] = {"$in": current_user_programs}
        if not db.people.find_one({"_id": person_oid, "programs": {"$in": current_user_programs}}):
            return jsonify({"detail": "Access denied"}), 403

    if date:
        query["date"] = date
        casenotes = list(casenote_to_string(casenote) for casenote in db.casenotes.find(query))
    else:
        casenotes = list(
            casenote_to_string(casenote)
            for casenote in db.casenotes.find(query).sort("date", -1).limit(20)
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

    try:
        casenote = CaseNote.model_validate(
            body,
            context={
                "valid_programs_structure": get_programs_structure(),
            },
        )
    except Exception as e:
        return jsonify({"detail": "Validation error", "errors": get_formatted_error(e)}), 400

    casenote_json = casenote.model_dump(exclude_none=True, mode="json")
    if not is_admin():
        current_user_programs = get_current_user_programs()
        if (
            not db.people.find_one({"_id": person_oid, "programs": {"$in": current_user_programs}})
            or body.get("program") not in current_user_programs
        ):
            return jsonify({"detail": "Access denied"}), 403

    author = f"{current_user.get('firstname')} {current_user.get('lastname')}"
    casenote_json["author"] = author
    casenote_json["lastUpdatedBy"] = author

    res = db.casenotes.insert_one(casenote_json)
    casenote_json["_id"] = str(res.inserted_id)

    return jsonify(casenote_to_string(casenote_json)), 201


@casenotes_bp.put("/people/<id>/casenotes/<casenoteid>")
@jwt_required()
def edit_casenote(id, casenoteid):
    body = request.get_json(silent=True) or {}

    try:
        person_oid = ObjectId(id)
        casenote_oid = ObjectId(casenoteid)
    except InvalidId:
        return jsonify({"detail": "Invalid Object ID"}), 400

    try:
        casenote = CaseNote.model_validate(
            body, context={"valid_programs_structure": get_programs_structure()}
        )
    except Exception as e:
        return jsonify({"detail": "Validation error", "errors": get_formatted_error(e)}), 400

    if not is_admin():
        if not db.people.find_one(
            {"_id": person_oid, "programs": {"$in": get_current_user_programs()}}
        ):
            return jsonify({"detail": "Access denied"}), 403

    casenote_json_with_null = casenote.model_dump(mode="json")
    casenote_json = remove_empty(casenote.model_dump(exclude_none=True, mode="json"))
    casenote_json["lastUpdatedBy"] = (
        f"{current_user.get('firstname')} {current_user.get('lastname')}"
    )

    unset_fields = {field: "" for field in casenote_json_with_null if field not in casenote_json}

    query = {}
    if casenote_json:
        query["$set"] = casenote_json
    if unset_fields:
        query["$unset"] = unset_fields

    res = db.casenotes.find_one_and_update(
        {"_id": casenote_oid}, query, return_document=ReturnDocument.AFTER
    )

    if not res:
        return (jsonify({"detail": "Casenote not found"}),), 404

    return jsonify(casenote_to_string(res)), 200
