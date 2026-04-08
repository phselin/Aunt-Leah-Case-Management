from flask import Blueprint, jsonify, request
from flask_jwt_extended import current_user, jwt_required

from backend_app.db import db

audit_bp = Blueprint("audit", __name__)


@audit_bp.get("/audit")
@jwt_required()
def list_audit_events():
    """
    Retrieve a list of audit events.

    Returns:
        JSON response containing a list of audit events or
        403 if the user is not a super-admin.
    """
    request.get_json(silent=True)
    if current_user.get("role") != "super-admin":
        return jsonify({"detail": "Access denied"}), 403

    page = request.args.get("page", 1, type=int)
    page_size = 20
    skip = (page - 1) * page_size

    entries = db.audit.find({}).sort("timestamp", -1).skip(skip).limit(page_size)

    return jsonify(
        [
            {"id": str(entry["_id"]), **{k: v for k, v in entry.items() if k != "_id"}}
            for entry in entries
        ]
    ), 200
