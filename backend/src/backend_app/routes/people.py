from datetime import datetime, timezone
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
    get_current_user_programs,
    get_formatted_error,
    get_program_filter,
    get_programs_structure,
    is_admin,
    remove_empty,
)
from backend_app.schemas.person import Person

people_bp = Blueprint("people", __name__)


@people_bp.get("/people/intake")
@jwt_required()
def get_intake_form():
    return jsonify(intake_form.form)


@people_bp.get("/people")
@jwt_required()
def get_people():
    person = request.args.get("person", "").strip()
    query = get_program_filter()  # comment this for less strict RBAC
    if not is_admin():
        query["active"] = True

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
    if not is_admin():
        return jsonify({"detail": "Access denied"}), 403
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

    # comment this for less strict RBAC but still check for active or not
    if not is_admin() and (
        (
            person.get("programs")
            and not any(p in person.get("programs", []) for p in get_current_user_programs())
        )
        or not person.get("active")
    ):
        return jsonify({"detail": "Access denied"}), 403

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

    person_in_db = db.people.find_one({"_id": oid})
    if not person_in_db:
        return jsonify({"detail": "Client not found"}), 404

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
                    "errors": get_formatted_error(e),
                }
            ),
            400,
        )

    person_json_with_null = person.model_dump(mode="json")
    person_json = remove_empty(person.model_dump(exclude_none=True, mode="json"))

    if not is_admin():
        # definitely a better way to do this
        current_user_programs = set(get_current_user_programs())
        db_milestone_programs = set(person_in_db.get("programMilestones", {}).keys())
        new_milestone_programs = set((person_json_with_null.get("programMilestones") or {}).keys())
        db_programs = set(person_in_db.get("programs", []))
        new_programs = set(person_json_with_null.get("programs", []))
        changed = new_programs != db_programs
        removed = db_programs - new_programs
        added = new_programs - db_programs
        changed_milestone_programs = new_milestone_programs != db_milestone_programs
        removed_milestone_programs = db_milestone_programs - new_milestone_programs
        added_milestone_programs = new_milestone_programs - db_milestone_programs
        if (
            (not db_programs and not (added <= current_user_programs))
            or (db_programs and not any(p in db_programs for p in current_user_programs))
            or person_in_db.get("active") != person_json_with_null.get("active")
            or (
                changed
                and not (removed <= current_user_programs and added <= current_user_programs)
            )
            or (
                changed_milestone_programs
                and not (
                    removed_milestone_programs <= current_user_programs
                    and added_milestone_programs <= current_user_programs
                )
            )
        ):
            return jsonify({"detail": "Access denied"}), 403

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
                    "errors": get_formatted_error(e),
                }
            ),
            400,
        )

    person_json = person.model_dump(exclude_none=True, mode="json")
    programMilestones = person_json.get("programMilestones")
    if not is_admin():
        current_user_programs = get_current_user_programs()

        if any(p not in current_user_programs for p in person_json.get("programs", [])) or (
            programMilestones and any(p not in current_user_programs for p in programMilestones)
        ):
            return jsonify({"detail": "Access denied"}), 403
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

    if not is_admin():
        return jsonify({"detail": "Access denied"}), 403

    res = db.people.delete_one({"_id": oid})
    if res.deleted_count == 0:
        return jsonify({"detail": "Client not found"}), 404
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

    if not is_admin() and program not in get_current_user_programs():
        return jsonify({"detail": "Access denied"}), 403

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

    milestone_update = {
        f"programMilestones.{program}.{type}": {
            "value": milestone,
            "lastUpdateDate": datetime.now(timezone.utc),
            "startDate": (
                milestone_in_db["startDate"]
                if milestone_in_db and milestone_in_db.get("startDate")
                else datetime.now(timezone.utc)
            ),
        }
    }

    res = db.people.find_one_and_update(
        {"_id": oid},
        {"$set": milestone_update},
        return_document=ReturnDocument.AFTER,
    )

    res["_id"] = str(res["_id"])
    return jsonify(res), 200


@people_bp.patch("/people/<id>/active")
@jwt_required()
def update_person_active(id):
    try:
        oid = ObjectId(id)
    except InvalidId:
        return jsonify({"detail": "Invalid client ID format"}), 400

    if not is_admin():
        return jsonify({"detail": "Access denied"}), 403

    body = request.get_json(silent=True) or {}

    if "active" not in body or not isinstance(body["active"], bool):
        return jsonify({"detail": "active should be boolean"}), 400

    res = db.people.find_one_and_update(
        {"_id": oid},
        {"$set": {"active": body["active"]}},
        return_document=ReturnDocument.AFTER,
    )

    if not res:
        return jsonify({"detail": "Client not found"}), 404

    res["_id"] = str(res["_id"])
    return jsonify(res), 200
