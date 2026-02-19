from bson import ObjectId
from bson.errors import InvalidId
from flask import Blueprint, g, jsonify, request
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    set_access_cookies,
    set_refresh_cookies,
    unset_jwt_cookies,
    verify_jwt_in_request,
    jwt_required
)

from backend_app.auth_init import bcrypt, jwt, limiter
from backend_app.db import db

auth_bp = Blueprint("auth", __name__)


@jwt.user_lookup_loader
def user_lookup(_jwt_header, jwt_data):
    identity = jwt_data["sub"]

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
    refresh_token = create_refresh_token(identity=str(user["_id"]))

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
    set_refresh_cookies(resp, refresh_token)

    return resp


@auth_bp.post("/logout")
def logout():
    resp = jsonify({"detail": "Logout successful"})
    unset_jwt_cookies(resp)
    return resp

@auth_bp.get("/me")
@jwt_required()
def me():
    if not g.user:
        return jsonify({"detail": "User not found"}), 404
    
    return jsonify({
        "user": {
            "email": g.user["email"],
            "role": g.user["role"],
            "id": str(g.user["_id"]),
            "firstname": g.user["firstname"],
            "lastname": g.user["lastname"],
        }
    })


@auth_bp.before_app_request
def set_global_user():
    g.user = None
    try:
        verify_jwt_in_request(optional=True)
        from flask_jwt_extended import current_user

        if current_user:
            g.user = current_user
    except Exception:
        pass
