from flask import Blueprint, jsonify, request
from flask_jwt_extended import current_user, jwt_required
from pymongo import ReturnDocument

from backend_app.db import db
from backend_app.routes.routes_utils import get_program_names, get_programs_structure

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
def validate_milestone_tree(milestone_tree):
    keys = set()
    sanitized = {}
    for k, val in milestone_tree.items():
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


@programs_bp.get("/programs")
@jwt_required()
def get_programs():
    if current_user.get("role") != "super-admin":
        return jsonify({"detail": "Access denied"}), 403

    return jsonify(
        [{**p, "_id": str(p["_id"])} for p in list(db.programs.find({}).sort("_id", -1))]
    ), 200


@programs_bp.post("/programs")
@jwt_required()
def add_program():
    body = request.get_json(silent=True) or {}
    if current_user.get("role") != "super-admin":
        return jsonify({"detail": "Access denied"}), 403

    name = body.get("name")
    if not name:
        return jsonify({"detail": "Missing program name"}), 400

    name = name.title()

    if db.programs.find_one({"name": name}):
        return jsonify({"detail": f"Prorgram {name} already exists"}), 409

    milestone_tree = body.get("milestoneTree")
    milestone_tree, err = validate_milestone_tree(milestone_tree)
    if err:
        return jsonify({"detail": err}), 400

    program = {"name": name, "milestoneTree": milestone_tree}

    description = body.get("description")
    if "description" in body and description:
        program["description"] = description

    res = db.programs.insert_one(program)
    program["_id"] = str(res.inserted_id)
    return jsonify(program), 201


@programs_bp.put("/programs")
@jwt_required()
def edit_program():
    body = request.get_json(silent=True) or {}
    if current_user.get("role") != "super-admin":
        return jsonify({"detail": "Access denied"}), 403

    name = body.get("name")
    if not name:
        return jsonify({"detail": "Missing program name"}), 400

    name = name.title()

    milestone_tree = body.get("milestoneTree")
    milestone_tree, err = validate_milestone_tree(milestone_tree)
    if err:
        return jsonify({"detail": err}), 400

    program_in_db = db.programs.find_one({"name": name})
    if not program_in_db:
        return jsonify({"detail": f"Program {name} not found"}), 404

    milestone_tree_in_db = program_in_db.get("milestoneTree") or {}
    old_categories = set(milestone_tree_in_db.keys())
    new_categories = set(milestone_tree.keys())
    deleted_categories = old_categories - new_categories

    if deleted_categories:
        db.people.update_many(
            {"programs": name},
            {"$unset": {f"programMilestones.{name}.{dc}": "" for dc in deleted_categories}},
        )

    for category in new_categories:
        removed = set(milestone_tree_in_db.get(category, [])) - set(
            milestone_tree.get(category, [])
        )
        if removed:
            field = f"programMilestones.{name}.{category}"
            db.people.update_many(
                {"programs": name, f"{field}.value": {"$in": list(removed)}},
                {"$unset": {field: ""}},
            )

    set_fields = {"milestoneTree": milestone_tree}

    description = body.get("description")
    if "description" in body:
        set_fields["description"] = description

    res = db.programs.find_one_and_update(
        {"name": name},
        {"$set": set_fields},
        return_document=ReturnDocument.AFTER,
    )

    res["_id"] = str(res["_id"])
    return jsonify(res), 200


@programs_bp.delete("/programs")
@jwt_required()
def delete_program():
    name = request.args.get("name", "").strip().title()
    if not name:
        return jsonify({"detail": "Missing name"}), 400

    if current_user.get("role") != "super-admin":
        return jsonify({"detail": "Access denied"}), 403

    res = db.programs.delete_one({"name": name})
    if res.deleted_count == 0:
        return jsonify({"detail": f"No such program {name}"}), 400
    db.casenotes.update_many({"program": name}, {"$unset": {"program": ""}})
    db.people.update_many(
        {"programs": name},
        {"$pull": {"programs": name}, "$unset": {f"programMilestones.{name}": ""}},
    )
    db.staff.update_many({"programs": name}, {"$pull": {"programs": name}})
    return jsonify({"detail": f"Successfully deleted program {name}"}), 200
