from bson import ObjectId
from bson.errors import InvalidId
from flask import Blueprint, request, jsonify

from backend_app.seed_db import GENERAL_MILESTONES
from backend_app.db import db

# ideally we want seperate blueprints for casenotes, goals and users but since everything has one endpoint i am adding it all here
# the code is very unreadable because computation is done is a single line. there is also a lot of repetition. i was using it to simply test my seed

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
            {"lastname": {"$regex": person, "$options": "i"}}]
    return jsonify([{**p, "_id": str(p["_id"])} for p in list(db.people.find(query))])

@sections_bp.get("/programs")
def get_programs():
    return jsonify([{**program, "_id": str(program["_id"])} for program in list(db.programs.find({}))])

@sections_bp.get("/staff")
def get_staff():
    return jsonify([{**staffmem, "_id": str(staffmem["_id"])} for staffmem in list(db.staff.find({}))])

@sections_bp.get("/casenotes")
def get_casenotes():
    person = request.args.get("person")
    if not person:
        return jsonify([{**casenote, "_id": str(casenote["_id"]), "personid": str(casenote["personid"]), "goalid": str(casenote["goalid"])} for casenote in list(db.casenotes.find({}))])
    try:
        person_oid = ObjectId(person)
    except (InvalidId, TypeError):
        return jsonify({"detail": "Invalid Object ID"}), 400
    person_name = db.people.find_one({"_id": person_oid}, {"firstname": 1, "lastname": 1, "_id": 0})
    if not person_name:
        return jsonify({"detail": "User not found"}), 404
    return jsonify([person_name] + [{**casenote, "goalid": str(casenote["goalid"])} for casenote in list(db.casenotes.find({"personid": person_oid}, {"_id": 0, "personid": 0}).sort("date", -1))])

@sections_bp.get("/goals")
def get_goals():
    person = request.args.get("person")
    if not person:
        return jsonify([{**goal, "_id": str(goal["_id"]), "personid": str(goal["personid"])} for goal in list(db.goals.find({}))])
    try:
        person_oid = ObjectId(person)
    except (InvalidId, TypeError):
        return jsonify({"detail": "Invalid Object ID"}), 400
    person_name = db.people.find_one({"_id": person_oid}, {"firstname": 1, "lastname": 1, "_id": 0})
    if not person_name:
        return jsonify({"detail": "User not found"}), 404
    return jsonify([person_name] + list(db.goals.find({"personid": person_oid}, {"_id": 0, "personid": 0}).sort("due", -1)))

@sections_bp.get("/stats")
def get_stats():
    stats = {}
    for program, milestones in GENERAL_MILESTONES.items():
        stats[program] = {}
        stats[program]["general"] = {}
        for milestone in milestones:
            stats[program]["general"][milestone] = len(db.goals.distinct("personid", {"status": milestone, "program": program}))
    return jsonify(stats)
