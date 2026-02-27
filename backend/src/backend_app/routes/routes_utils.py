from backend_app.db import db


def get_program_names():
    try:
        return list(db.programs.distinct("name"))
    except Exception:
        return []
