from bson import ObjectId
from bson.errors import InvalidId
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

from backend_app.routes.routes_utils import get_program_names
from backend_app.db import db

programs_bp = Blueprint("programs", __name__)


@programs_bp.get("/programs")
@jwt_required()
def get_programs():
    programs = [{**program, "_id": str(program["_id"])} for program in db.programs.find({})]
    return jsonify(programs)


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
            "goalTypes": body.get("goalTypes"),
        }
    )
    program = {
        "_id": str(res.inserted_id),
        "name": body.get("name"),
        "goalTypes": body.get("goalTypes"),
    }
    return jsonify(program), 201


@programs_bp.get("/programs/<id>")
@jwt_required()
def fetch_client_programs(id):
    try:
        oid = ObjectId(id)
    except InvalidId:
        return jsonify({"detail": "Invalid client ID format"}), 400

    goals = list(
        db.goals.find({"personid": oid},
                      {"_id":0, "personid": 0}))
    if not goals:
        return jsonify({"detail": "Client not found"}), 404

    for i, goal in enumerate(goals):
        print("Goal: ", goal)
        for k, v in goal.items():
            if isinstance(v, ObjectId):
                print("ObjectId at", i, k, v)
    return jsonify(goals), 200