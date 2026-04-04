from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, current_user

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
    body = request.get_json(silent=True) or {}
    if current_user.get("role") != "super-admin":
        return jsonify({"detail": "Access denied"}), 403

    return jsonify(
        [{"id": str(entry["_id"]), **{k: v for k, v in entry.items() if k != "_id"}} for entry in db.audit.find({})]
    ), 200

