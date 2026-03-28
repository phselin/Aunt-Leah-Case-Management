from flask_jwt_extended import current_user

from backend_app.db import db


def get_program_names():
    try:
        return list(db.programs.distinct("name"))
    except Exception:
        return []


def get_programs_structure():
    try:
        programs_structure = db.programs.find({}, {"name": 1, "milestoneTree": 1, "_id": 0})
        formatted_programs_structure = {}
        for program in programs_structure:
            formatted_programs_structure[program.get("name")] = program.get("milestoneTree", {})
        return formatted_programs_structure
    except Exception:
        return {}


def remove_empty(data):
    if isinstance(data, dict):
        cleaned = {k: remove_empty(v) for k, v in data.items()}
        cleaned = {k: v for k, v in cleaned.items() if v is not None}
        return cleaned or None
    if isinstance(data, list):
        cleaned = [remove_empty(item) for item in data if item is not None]
        return cleaned or None
    return data


def is_admin():
    return current_user.get("role") == "super-admin" or current_user.get("role") == "admin"


def get_current_user_programs():
    assert (
        not is_admin()
    )  # admins don't have program field (there is definitely a better way to do this)
    return current_user.get("programs", [])


def get_program_filter():
    if is_admin():
        return {}
    return {"$or": [{"programs": {"$in": get_current_user_programs()}}, {"programs": []}]}


def get_formatted_error(e):
    return (
        {
            str(err["loc"][0]): err["msg"].replace("Value error, ", "")
            for err in e.errors()
            if err.get("loc")
        },
    )
