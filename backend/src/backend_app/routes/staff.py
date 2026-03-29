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


@staff_bp.get("/staff")
@jwt_required()
def get_staff():
    if current_user.get("role") != "super-admin":
        return jsonify({"detail": "Access denied"}), 403

    staff = list(db.staff.find())
    for s in staff:
        s["_id"] = str(s["_id"])

    return jsonify(staff), 200


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

    staff_mem["_id"] = str(staff_mem["_id"])
    return jsonify(staff_mem), 200


@staff_bp.post("/staff/")
@jwt_required()
def insert_staff_mem(id):
    body = request.get_json(silent=True) or {}
    if current_user.get("role") != "super-admin":
        return jsonify({"detail": "Access denied"}), 403

    try:
        staff_mem = Staff.model_validate(
            body, context={"validate_programs_structure": get_programs_structure()}
        )
    except ValidationError as e:
        return jsonify({"detail": "Validation error", "errors": get_formatted_error(e)})

    staff_mem_json = staff_mem.model_dump(exclude_none=True, mode="json")
    res = staff_mem_json.insert_one(staff_mem_json)
    staff_mem_json = str(res.inserted_id)
    return jsonify(staff_mem_json), 201


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

    try:
        staff_mem = Staff.model_validate(
            body, context={"validate_programs_structure": get_programs_structure()}
        )
    except ValidationError as e:
        return jsonify({"detail": "Validator error", "errors": get_formatted_error(e)})

    staff_mem_json = staff_mem.model_dump(exclude_none=True, mode="json")

    res = db.staff.find_one_and_update(
        {"_id": oid}, {"$set": staff_mem_json}, return_document=ReturnDocument.AFTER
    )

    res["_id"] = str(res["_id"])
    return jsonify(res), 200
