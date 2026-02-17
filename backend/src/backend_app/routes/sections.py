from bson import ObjectId
from bson.errors import InvalidId
from flask import Blueprint, jsonify, request

from backend_app.db import db
from backend_app.seed_db import GENERAL_MILESTONES

# Note: this blueprint currently groups multiple resource endpoints.
# It was originally used for quickly testing seed data.

sections_bp = Blueprint("sections", __name__)


# Better regex for comparison if name Melanie then Melania won't give a result
# TODO handle full name search MelanieBrooks won't return anything although Melanie Brooks exist
@sections_bp.get("/people")
def get_people():
    person = request.args.get("person")
    query = {}
    if person:
        query["$or"] = [
            {"firstname": {"$regex": person, "$options": "i"}},
            {"lastname": {"$regex": person, "$options": "i"}},
        ]
    return jsonify([{**p, "_id": str(p["_id"])} for p in list(db.people.find(query))])


@sections_bp.get("/programs")
def get_programs():
    programs = [{**program, "_id": str(program["_id"])} for program in db.programs.find({})]
    return jsonify(programs)


@sections_bp.get("/staff")
def get_staff():
    staff = [{**staffmem, "_id": str(staffmem["_id"])} for staffmem in db.staff.find({})]
    return jsonify(staff)


@sections_bp.get("/casenotes")
def get_casenotes():
    person = request.args.get("person")
    if not person:
        casenotes = [
            {
                **casenote,
                "_id": str(casenote["_id"]),
                "personid": str(casenote["personid"]),
                "goalid": str(casenote["goalid"]),
            }
            for casenote in db.casenotes.find({})
        ]
        return jsonify(casenotes)
    try:
        person_oid = ObjectId(person)
    except (InvalidId, TypeError):
        return jsonify({"detail": "Invalid Object ID"}), 400
    person_name = db.people.find_one({"_id": person_oid}, {"firstname": 1, "lastname": 1, "_id": 0})
    if not person_name:
        return jsonify({"detail": "User not found"}), 404
    casenotes = [
        {**casenote, "goalid": str(casenote["goalid"])}
        for casenote in db.casenotes.find({"personid": person_oid}, {"_id": 0, "personid": 0}).sort(
            "date", -1
        )
    ]
    return jsonify([person_name, *casenotes])


@sections_bp.get("/goals")
def get_goals():
    person = request.args.get("person")
    if not person:
        goals = [
            {**goal, "_id": str(goal["_id"]), "personid": str(goal["personid"])}
            for goal in db.goals.find({})
        ]
        return jsonify(goals)
    try:
        person_oid = ObjectId(person)
    except (InvalidId, TypeError):
        return jsonify({"detail": "Invalid Object ID"}), 400
    person_name = db.people.find_one({"_id": person_oid}, {"firstname": 1, "lastname": 1, "_id": 0})
    if not person_name:
        return jsonify({"detail": "User not found"}), 404
    goals = list(db.goals.find({"personid": person_oid}, {"_id": 0, "personid": 0}).sort("due", -1))
    return jsonify([person_name, *goals])


@sections_bp.get("/stats")
def get_stats():
    stats = {}
    for program, milestones in GENERAL_MILESTONES.items():
        stats[program] = {}
        stats[program]["general"] = {}
        for milestone in milestones:
            stats[program]["general"][milestone] = len(
                db.goals.distinct(
                    "personid",
                    {"status": milestone, "program": program},
                )
            )
    return jsonify(stats)
