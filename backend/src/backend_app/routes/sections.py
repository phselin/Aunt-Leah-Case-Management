from bson import ObjectId
from bson.errors import InvalidId
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

from backend_app.db import db

# ideally we want seperate blueprints for casenotes, goals and users but since everything has one
# endpoint i am adding it all here
# the code is very unreadable because computation is done is a single line. there is also a lot of
# repetition. i was using it to simply test my seed

sections_bp = Blueprint("sections", __name__)


@sections_bp.get("/clients")
@jwt_required()
def get_clients():
    import datetime
    import re
    import uuid
    from typing import Any

    def iso_datetime(value: Any) -> str:
        if isinstance(value, datetime.datetime):
            dt = value
        elif isinstance(value, ObjectId):
            dt = value.generation_time
        elif isinstance(value, str) and value:
            return value
        else:
            return ""

        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=datetime.UTC)
        return dt.astimezone(datetime.UTC).isoformat().replace("+00:00", "Z")

    def person_uuid(person: dict[str, Any]) -> str:
        raw = person.get("id") or person.get("uuid")
        if isinstance(raw, str):
            try:
                return str(uuid.UUID(raw))
            except ValueError:
                pass

        _id = person.get("_id")
        if _id is None:
            return str(uuid.uuid4())
        return str(uuid.uuid5(uuid.NAMESPACE_URL, f"mongo-person:{_id}"))

    def map_gender(value: Any) -> str:
        if not isinstance(value, str):
            return "Other"
        v = value.strip().lower()
        return {
            "male": "Male",
            "m": "Male",
            "female": "Female",
            "f": "Female",
            "transgender female": "Transgender Female",
            "trans female": "Transgender Female",
            "transgender male": "Transgender Male",
            "trans male": "Transgender Male",
            "two spirit": "Two Spirit",
            "2spirit": "Two Spirit",
            "two-spirit": "Two Spirit",
        }.get(v, "Other")

    def parse_address(value: Any) -> dict[str, str]:
        if isinstance(value, dict):
            return {
                "line1": str(value.get("line1") or ""),
                "line2": str(value.get("line2") or ""),
                "city": str(value.get("city") or ""),
                "province": str(value.get("province") or ""),
                "postalCode": str(value.get("postalCode") or value.get("postal_code") or ""),
            }

        if not isinstance(value, str):
            value = ""

        lines = [ln.strip() for ln in value.splitlines() if ln.strip()]
        line1 = lines[0] if lines else ""
        line2 = lines[1] if len(lines) >= 3 else ""
        city = province = postal = ""

        candidate = lines[1] if len(lines) >= 2 else ""
        m = re.match(
            r"^(?P<city>.*?),\s*(?P<prov>[A-Za-z]{2})\s*(?P<postal>[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d|\d{5}(?:-\d{4})?)?$",
            candidate,
        )
        if m:
            city = (m.group("city") or "").strip()
            province = (m.group("prov") or "").strip()
            postal = (m.group("postal") or "").strip()

        return {
            "line1": line1,
            "line2": line2,
            "city": city,
            "province": province,
            "postalCode": postal,
        }

    def contact_info(person: dict[str, Any]) -> dict[str, str]:
        ci = person.get("contactInfo")
        if isinstance(ci, dict):
            return {
                "phone": str(ci.get("phone") or ""),
                "altPhone": str(ci.get("altPhone") or ci.get("alt_phone") or ""),
                "email": str(ci.get("email") or ""),
            }
        return {
            "phone": str(person.get("phone") or ""),
            "altPhone": str(person.get("altPhone") or person.get("alt_phone") or ""),
            "email": str(person.get("email") or ""),
        }

    def referral_info(person: dict[str, Any]) -> dict[str, Any]:
        ri = person.get("referralInfo")
        if not isinstance(ri, dict):
            ri = {}

        referral_contacts = ri.get("referralContacts")
        if not isinstance(referral_contacts, list):
            referral_contacts = []

        outside_pros = ri.get("outsideProfessionals")
        if not isinstance(outside_pros, list):
            outside_pros = []

        presenting = ri.get("presentingIssues")
        if not isinstance(presenting, list):
            presenting = []

        def date_str(v: Any) -> str:
            if isinstance(v, datetime.datetime):
                return v.date().isoformat()
            if isinstance(v, str):
                return v
            return ""

        return {
            "legalStatus": str(ri.get("legalStatus") or ""),
            "referralSource": str(ri.get("referralSource") or ""),
            "referralDate": date_str(ri.get("referralDate")),
            "intakeDate": date_str(ri.get("intakeDate")),
            "assignedDate": date_str(ri.get("assignedDate")),
            "homeCommunity": str(ri.get("homeCommunity") or ""),
            "referralContacts": referral_contacts,
            "schoolOrWork": str(ri.get("schoolOrWork") or ""),
            "outsideProfessionals": outside_pros,
            "presentingIssues": presenting,
        }

    def person_to_client(person: dict[str, Any]) -> dict[str, Any]:
        _id = person.get("_id")
        first = str(person.get("firstname") or person.get("firstName") or "").strip()
        last = str(person.get("lastname") or person.get("lastName") or "").strip()
        name = " ".join([p for p in (first, last) if p]).strip() or str(person.get("name") or "")
        created_at = iso_datetime(person.get("createdAt") or _id)
        updated_at = iso_datetime(person.get("updatedAt") or person.get("modifiedAt") or _id)
        return {
            "id": person_uuid(person),
            "name": name,
            "dob": str(person.get("dob") or ""),
            "gender": map_gender(person.get("gender")),
            "address": parse_address(person.get("address")),
            "contactInfo": contact_info(person),
            "referralInfo": referral_info(person),
            "notes": person.get("notes") if isinstance(person.get("notes"), list) else [],
            "createdAt": created_at,
            "updatedAt": updated_at,
        }

    search = request.args.get("client") or request.args.get("q") or request.args.get("person")
    query: dict[str, Any] = {}
    if search:
        search = search.strip()
        parts = [p for p in re.split(r"\s+", search) if p]
        if len(parts) >= 2:
            query["$and"] = [
                {"firstname": {"$regex": re.escape(parts[0]), "$options": "i"}},
                {"lastname": {"$regex": re.escape(parts[-1]), "$options": "i"}},
            ]
        else:
            query["$or"] = [
                {"firstname": {"$regex": re.escape(search), "$options": "i"}},
                {"lastname": {"$regex": re.escape(search), "$options": "i"}},
            ]

    people = list(db.people.find(query))
    return jsonify([person_to_client(p) for p in people])


@sections_bp.get("/programs")
@jwt_required()
def get_programs():
    programs = [{**program, "_id": str(program["_id"])} for program in db.programs.find({})]
    return jsonify(programs)


@sections_bp.post("/programs")
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


@sections_bp.get("/staff")
@jwt_required()
def get_staff():
    staff = [{**staffmem, "_id": str(staffmem["_id"])} for staffmem in db.staff.find({})]
    return jsonify(staff)


@sections_bp.get("/goals")
@jwt_required()
def get_goals():
    person = request.args.get("person")
    if not person:
        goals = [
            {**goal, "_id": str(goal["_id"]), "personid": str(goal.get("personid", ""))}
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
@jwt_required()
def get_stats():
    stats = {}
    stats["clients"] = {"total": db.people.count_documents({})}
    for program in db.programs.find({}):
        program_name = program["name"]
        stats["clients"][program_name] = db.people.count_documents({"programs": program_name})
        stats[program_name] = {}
        # returning only general statistics for now
        for goal_type, milestones in program.get("goalTypes", {}).items():
            stats[program_name][goal_type] = []
            for milestone in milestones:
                stats[program_name][goal_type].append(
                    {
                        "milestone": milestone,
                        "value": len(
                            db.goals.distinct(
                                "personid",
                                {"status": milestone, "program": program_name, "type": goal_type},
                            )
                        ),
                    }
                )
    return jsonify(stats)
