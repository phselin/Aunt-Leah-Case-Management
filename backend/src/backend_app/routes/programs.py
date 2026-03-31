from flask import Blueprint, jsonify, request
from flask_jwt_extended import current_user, jwt_required
from pymongo import ReturnDocument

from backend_app.db import db
from backend_app.routes.routes_utils import get_program_names, get_programs_structure, is_admin

programs_bp = Blueprint("programs", __name__)


@programs_bp.get("/programs/names")
@jwt_required()
def program_names_route():
    return get_program_names()


@programs_bp.get("/programs/structure")
@jwt_required()
def programs_structure():
    return jsonify(get_programs_structure()), 200


# trying golang error handling in python for fun :)
# validation should be much stronger but this is ok for now
def validate_program_milestones(programMilestone):
    keys = set()
    sanitized = {}
    for k, val in programMilestone.items():
        k = k.lower()
        if k in keys:
            return None, f"Duplicate milestone category {k}"
        keys.add(k)
        if not isinstance(val, list):
            return None, f"Invalid format {val} is not a list"
        val = [v.lower() for v in val]
        if len(set(val)) != len(val):
            return None, "Duplicate milestones"
        sanitized[k] = val
    return sanitized, None


@programs_bp.post("/programs")
@jwt_required()
def add_program():
    body = request.get_json(silent=True) or {}
    if not current_user.get("role") != "super-admin":
        return jsonify({"detail": "Access denied"}), 403

    name = body.get("name")
    if not name:
        return jsonify({"detail": "Missing program name"}), 400

    name = name.title()

    if db.programs.find_one({"name": name}):
        return jsonify({"details": f"Prorgram {name} already exists"}), 409

    programMilestones = body.get("programMilestones")
    programMilestones, err = validate_program_milestones(programMilestones)
    if err:
        return jsonify({"detail": err}), 400

    res = db.programs.insert_one(
        {
            "name": name,
            "milestoneTree": programMilestones,
        }
    )
    res["_id"] = str(res.inserted_id)
    return jsonify(res), 201


@programs_bp.put("/programs")
@jwt_required()
def edit_program():
    body = request.get_json(silent=True) or {}
    if not current_user.get("role") != "super-admin":
        return jsonify({"detail": "Access denied"}), 403

    name = body.get("name")
    if not name:
        return jsonify({"detail": "Missing program name"}), 400

    name = name.title()

    programMilestones = body.get("programMilestones")
    programMilestones, err = validate_program_milestones(programMilestones)
    if err:
        return jsonify({"detail": err}), 400

    res = db.programs.find_one_and_update(
        {"name": name},
        {"programMilestones": programMilestones},
        return_document=ReturnDocument.AFTER,
    )

    if not res:
        return jsonify({"detail": f"Program {name} not found"}), 404

    res["_id"] = str(res["_id"])
    return jsonify(res), 200
