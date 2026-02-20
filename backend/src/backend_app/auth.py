from bson import ObjectId
from bson.errors import InvalidId
from datetime import datetime, timedelta, timezone
from flask import Blueprint, jsonify, request
from flask_jwt_extended import (
    create_access_token,
    current_user,
    jwt_required,
    set_access_cookies,
    get_jwt_identity,
    get_jwt,
    unset_jwt_cookies,
)

from backend_app.auth_init import bcrypt, jwt, limiter
from backend_app.db import db

auth_bp = Blueprint("auth", __name__)

# TODO replace direct field access [] with .get()


@jwt.user_lookup_loader
def user_lookup(_jwt_header, jwt_data):
    identity = jwt_data["sub"]

    # TODO use redis to cache user so that we don't have to access database for every endpoint call
    # which is what it is doing right now

    try:
        oid = ObjectId(identity)
    except (InvalidId, TypeError):
        return None

    return db.staff.find_one({"_id": oid})


@auth_bp.post("/login")
@limiter.limit("5 per minute")
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"detail": "Missing email or password"}), 400

    user = db.staff.find_one({"email": email})
    if not user:
        return jsonify({"detail": "Invalid credentials"}), 401

    if "password_hash" not in user or not bcrypt.check_password_hash(
        user["password_hash"], password
    ):
        return jsonify({"detail": "Invalid credentials"}), 401

    access_token = create_access_token(identity=str(user["_id"]))

    resp = jsonify(
        {
            "detail": "Login successful",
            "user": {
                "email": user["email"],
                "role": user["role"],
                "id": str(user["_id"]),
                "firstname": user["firstname"],
                "lastname": user["lastname"],
            },
        }
    )

    set_access_cookies(resp, access_token)

    return resp


@auth_bp.post("/logout")
def logout():
    resp = jsonify({"detail": "Logout successful"})
    unset_jwt_cookies(resp)
    return resp


@auth_bp.get("/me")
@jwt_required()
def me():
    if not current_user:
        return jsonify({"detail": "User not found"}), 404

    return jsonify(
        {
            "user": {
                "email": current_user["email"],
                "role": current_user["role"],
                "id": str(current_user["_id"]),
                "firstname": current_user["firstname"],
                "lastname": current_user["lastname"],
            }
        }
    )

@auth_bp.after_app_request
def refresh_expiring_jwt(response):
    try:
        exp = get_jwt()["exp"]
        now = datetime.now(timezone.utc)
        
        if datetime.timestamp(now + timedelta(minutes=10)) > exp:
            access_token = create_access_token(identity=get_jwt_identity())
            set_access_cookies(response, access_token)
        return response
    except Exception:
        return response