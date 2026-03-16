from bson import ObjectId
from bson.errors import InvalidId
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

from backend_app.db import db
from backend_app.routes.routes_utils import get_program_names

programs_bp = Blueprint("programs", __name__)


@programs_bp.get("/programs")
@jwt_required()
def get_programs():
    person = request.args.get("person")
    if not person:
        # Return list of available programs
        programs = [{**program, "_id": str(program["_id"])} for program in db.programs.find({})]
        return jsonify(programs)

    try:
        oid = ObjectId(person)
    except InvalidId:
        return jsonify({"detail": "Invalid client ID format"}), 400

    # goals = list(db.goals.find({"personid": oid}, {"_id": 0, "personid": 0}))
    # if not goals:
    #     return jsonify({"detail": "Client not found"}), 404

    # TODO make this better

    query = db.people.find_one({"_id": oid}, {"status": 1, "programs": 1, "_id": 0})
    status = query["status"]
    programs = query["programs"]
    result = []
    for program in programs:
        result.append(
            {
                "program": program,
                "status": {} if program not in status else status[program]["general"],
            }
        )
    return jsonify(result), 200


@programs_bp.get("/programNames")
@jwt_required()
def program_names_route():
    return get_program_names()


@programs_bp.post("/programs")
@jwt_required()
def add_program():
    body = request.get_json(silent=True) or {}
    # only super admin can add programs
    # commented out for now because we don't have a super admin role yet
    # if not g.user["role"] == "superadmin":
    #     return jsonify({"detail": "Unauthorized"}), 403
    res = db.programs.insert_one(
        {
            "name": body.get("name"),
            "milestoneTree": body.get("milestoneTree"),
        }
    )
    program = {
        "_id": str(res.inserted_id),
        "name": body.get("name"),
        "milestoneTree": body.get("milestoneTree"),
    }
    return jsonify(program), 201


@programs_bp.get("/programs/<name>/milestones")
@jwt_required()
def get_program_milestones(name):
    name = name.title()

    # A little quick sanitization JIC
    disallowed_symbols = [".", "/", "\\", "*", "[", "]", "(", ")", "{", "}"]
    if any(sym in name for sym in disallowed_symbols):
        return jsonify({"detail": "Program does not exist"}), 404

    program = db.programs.find_one({"name": name})

    if not program:
        return jsonify({"detail": "Program does not exist"}), 404

    milestones = program["milestoneTree"]
    print(milestones)
    return jsonify(milestones)
