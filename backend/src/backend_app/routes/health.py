from flask import Blueprint, jsonify

from backend_app.db import ping_mongo

health_bp = Blueprint("health", __name__)

@health_bp.get("/")
def health():
    return jsonify({"status": "ok", "framework": "flask"})
    
@health_bp.get("/db/ping")
def db_ping():
    return jsonify({"ok": ping_mongo()})