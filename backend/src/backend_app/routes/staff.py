from bson import ObjectId
from bson.errors import InvalidId
from flask import jsonify, request
from flask.blueprints import Blueprint
from flask_jwt_extended import jwt_required
from flask_jwt_extended.utils import current_user
from pydantic import ValidationError
from pymongo import ReturnDocument

from backend_app.db import db
from backend_app.routes.routes_utils import get_formatted_error, get_programs_structure
from backend_app.schemas.staff import Staff

staff_bp = Blueprint("staff", __name__)


def sanitize_staff_mem(staff_mem):
    staff_mem["_id"] = str(staff_mem["_id"])
    staff_mem.pop("mfaSecret", None)
    if staff_mem.get("mfaEnabled"):
        staff_mem.pop("passwordHash", None)
    return staff_mem


@staff_bp.get("/staff")
@jwt_required()
def get_staff():
    if current_user.get("role") != "super-admin":
        return jsonify({"detail": "Access denied"}), 403

    staff = request.args.get("staff", "").strip()
    query = {"_id": {"$ne": current_user["_id"]}}
    if staff:
        s = staff.replace(" ", "")
        query["$expr"] = {
            "$or": [
                {
                    "$regexMatch": {
                        "input": {"$concat": ["$firstname", "$lastname"]},
                        "regex": s,
                        "options": "i",
                    }
                },
                {
                    "$regexMatch": {
                        "input": {"$concat": ["$lastname", "$firstname"]},
                        "regex": s,
                        "options": "i",
                    }
                },
            ]
        }
    return jsonify(
        [sanitize_staff_mem(s) for s in list(db.staff.find(query).sort("_id", -1).limit(10))]
    ), 200


@staff_bp.get("/staff/<id>")
@jwt_required()
def get_staff_mem(id):
    if current_user.get("role") != "super-admin":
        return jsonify({"detail": "Access denied"}), 403

    try:
        oid = ObjectId(id)
    except InvalidId:
        return jsonify({"detail": "Invalid staff id"}), 400

    staff_mem = db.staff.find_one({"_id": oid})

    if not staff_mem:
        return jsonify({"detail": "Staff member not found"}), 400

    return jsonify(sanitize_staff_mem(staff_mem)), 200


@staff_bp.post("/staff")
@jwt_required()
def insert_staff_mem():
    body = request.get_json(silent=True) or {}
    if current_user.get("role") != "super-admin":
        return jsonify({"detail": "Access denied"}), 403

    try:
        staff_mem = Staff.model_validate(
            body, context={"valid_programs_structure": get_programs_structure()}
        )
    except ValidationError as e:
        return jsonify({"detail": "Validation error", "errors": get_formatted_error(e)}), 400

    staff_mem_json = staff_mem.model_dump(exclude_none=True, mode="json")
    res = db.staff.insert_one(staff_mem_json)
    staff_mem_json["_id"] = str(res.inserted_id)
    return jsonify(sanitize_staff_mem(staff_mem_json)), 201


@staff_bp.put("/staff/<id>")
@jwt_required()
def update_staff_mem(id):
    body = request.get_json(silent=True) or {}

    if current_user.get("role") != "super-admin":
        return jsonify({"detail": "Access denied"}), 403

    try:
        oid = ObjectId(id)
    except InvalidId:
        return jsonify({"detail": "Invalid staff id"}), 400

    staff_mem_in_db = db.staff.find_one({"_id": oid})

    if not staff_mem_in_db:
        return jsonify({"detail": "Staff member not found"}), 400

    if staff_mem_in_db.get("role") == "super-admin" and str(staff_mem_in_db["_id"]) != str(
        current_user.get("_id")
    ):
        return jsonify({"detail": "Cannot edit another super-admin"}), 403

    try:
        staff_mem = Staff.model_validate(
            body, context={"validate_programs_structure": get_programs_structure()}
        )
    except ValidationError as e:
        return jsonify({"detail": "Validator error", "errors": get_formatted_error(e)}), 400

    staff_mem_json = staff_mem.model_dump(exclude_none=True, mode="json")

    res = db.staff.find_one_and_update(
        {"_id": oid}, {"$set": staff_mem_json}, return_document=ReturnDocument.AFTER
    )

    return jsonify(sanitize_staff_mem(res)), 200
