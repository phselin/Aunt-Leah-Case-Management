from bson import ObjectId
from bson.errors import InvalidId
from flask import jsonify, request
from flask.blueprints import Blueprint
from flask_jwt_extended import jwt_required
from flask_jwt_extended.utils import current_user
from pydantic import ValidationError
from pymongo import ReturnDocument

from backend_app.audit_logging import audit_log
from backend_app.auth_init import bcrypt
from backend_app.db import db
from backend_app.routes.routes_utils import (
    get_formatted_error,
    get_programs_structure,
    remove_empty,
)
from backend_app.schemas.staff import Staff

staff_bp = Blueprint("staff", __name__)


def sanitize_staff_mem(staff_mem):
    staff_mem["_id"] = str(staff_mem["_id"])
    staff_mem.pop("mfaSecret", None)
    staff_mem.pop("passwordHash", None)
    return staff_mem


@staff_bp.get("/staff")
@jwt_required()
def get_staff():
    if current_user.get("role") != "super-admin":
        return jsonify({"detail": "Access denied"}), 403

    staff = request.args.get("staff", "").strip()
    query = {}
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
@audit_log(action="added a new staff member", audit_tools=True)
def insert_staff_mem(_audit_ctx):
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

    if db.staff.find_one({"email": staff_mem_json.get("email")}):
        return jsonify({"detail": "A staff member with this email already exists"}), 409

    staff_mem_json["mfaEnabled"] = False
    password = staff_mem_json.pop("password", None)
    if password:
        staff_mem_json["passwordHash"] = bcrypt.generate_password_hash(password).decode("utf-8")

    res = db.staff.insert_one(staff_mem_json)
    staff_mem_json["_id"] = str(res.inserted_id)

    _audit_ctx["action"] += f" \"{staff_mem_json['firstname']} {staff_mem_json['lastname']}\""

    _audit_ctx["details"] =  f"ID: {staff_mem_json['_id']}\n"
    _audit_ctx["details"] += f"Email: {staff_mem_json['email']}\n"
    _audit_ctx["details"] += f"Role:  {staff_mem_json['role']}\n"

    return jsonify(sanitize_staff_mem(staff_mem_json)), 201


@staff_bp.put("/staff/<id>")
@jwt_required()
@audit_log(action=lambda id, **_: f"updated staff member "
                                  f"{db.staff.find_one(ObjectId(id))['firstname']} "
                                  f"{db.staff.find_one(ObjectId(id))['lastname']}",
           audit_tools=True)
#TODO if time permits: add specific notes about what was updated to _audit_ctx["details"]
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
            body, context={"valid_programs_structure": get_programs_structure()}
        )
    except ValidationError as e:
        return jsonify({"detail": "Validator error", "errors": get_formatted_error(e)}), 400

    staff_mem_json_with_null = staff_mem.model_dump(mode="json")
    staff_mem_json = remove_empty(staff_mem.model_dump(exclude_none=True, mode="json"))

    if db.staff.find_one({"email": staff_mem_json.get("email"), "_id": {"$ne": oid}}):
        return jsonify({"detail": "A staff member with this email already exists"}), 409

    unset_fields = {field: "" for field in staff_mem_json_with_null if field not in staff_mem_json}

    password = staff_mem_json.pop("password", None)
    if password and (not staff_mem_in_db.get("mfaEnabled") or not staff_mem_json.get("mfaEnabled")):
        staff_mem_json["passwordHash"] = bcrypt.generate_password_hash(password).decode("utf-8")

    if staff_mem_in_db.get("mfaEnabled") and not staff_mem_json.get("mfaEnabled"):
        unset_fields["mfaSecret"] = ""

    query = {}
    if staff_mem_json:
        query["$set"] = staff_mem_json
    if unset_fields:
        query["$unset"] = unset_fields

    res = db.staff.find_one_and_update({"_id": oid}, query, return_document=ReturnDocument.AFTER)

    if not res:
        return jsonify({"detail": "Staff member not found"}), 404

    return jsonify(sanitize_staff_mem(res)), 200


@staff_bp.patch("/staff/<id>/active")
@jwt_required()
@audit_log(action= "", audit_tools=True)
def update_staff_active(id, _audit_ctx):
    if current_user.get("role") != "super-admin":
        return jsonify({"detail": "Access denied"}), 403

    try:
        oid = ObjectId(id)
    except InvalidId:
        return jsonify({"detail": "Invalid staff ID format"}), 400

    body = request.get_json(silent=True) or {}

    if "active" not in body or not isinstance(body["active"], bool):
        return jsonify({"detail": "Active should be boolean"}), 400

    person = db.staff.find_one({"_id": oid})
    res = db.staff.find_one_and_update(
        {"_id": oid},
        {"$set": {"active": body["active"]}},
        return_document=ReturnDocument.AFTER,
    )

    if not res:
        return jsonify({"detail": "Staff member not found"}), 404

    _audit_ctx["action"] = (f"activated staff member \"{person['firstname']} "
                            f"{person['lastname']}\"") if body["active"] \
        else f"deactivated staff member \"{person['firstname']} {person['lastname']}\""
    _audit_ctx["details"] = f"ID: {res['_id']}"

    res["_id"] = str(res["_id"])
    return jsonify(sanitize_staff_mem(res)), 200
