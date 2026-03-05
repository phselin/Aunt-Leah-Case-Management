import re
from datetime import UTC, datetime, timedelta

from bson import ObjectId, json_util
from bson.errors import InvalidId
from flask import Blueprint, jsonify, request
from flask_jwt_extended import (
    create_access_token,
    current_user,
    get_jwt,
    get_jwt_identity,
    jwt_required,
    set_access_cookies,
    unset_jwt_cookies,
)

from backend_app.auth_init import bcrypt, jwt, limiter
from backend_app.db import db, redis_client

auth_bp = Blueprint("auth", __name__)

# TODO replace direct field access [] with .get()


@jwt.user_lookup_error_loader
def user_lookup_error(_jwt_header, _jwt_data):
    resp = jsonify({"detail": "Expired token"})
    unset_jwt_cookies(resp)
    return resp, 401


@jwt.user_lookup_loader
def user_lookup(_jwt_header, jwt_data):
    identity = jwt_data["sub"]

    try:
        cached_user = redis_client.get(identity)
        if cached_user:
            return json_util.loads(cached_user)
    except Exception as e:
        print(e)

    try:
        oid = ObjectId(identity)
    except (InvalidId, TypeError):
        return None

    user = db.staff.find_one({"_id": oid})
    if user:
        try:
            redis_client.setex(
                name=identity, time=timedelta(minutes=15), value=json_util.dumps(user)
            )
        except Exception as e:
            print(e)

    return user


@jwt.token_in_blocklist_loader
def check_revoked_token(jwt_header, jwt_data):
    jti = jwt_data["jti"]
    try:
        cached_token = redis_client.get(jti)
        return cached_token is not None
    except Exception:
        return False


"""
Helper for making sure email is formatted correctly and sanitized
"""


def sanitizeEmail(email):
    email = email.strip()
    emailPattern = r"^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$"

    if re.match(emailPattern, email, re.IGNORECASE) is None:
        raise ValueError("String is not in email format")

    return email


@auth_bp.post("/login")
@limiter.limit("5 per minute")
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"detail": "Missing email or password"}), 400

    try:
        email = sanitizeEmail(email)
    except ValueError:
        return jsonify({"detail": "Invalid email format"}), 400

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
@jwt_required
def logout():
    # jti = get_jwt()["jti"]
    # try:
    #     redis_client.setex(name=jti, time=timedelta(minutes=30), value="revoked")
    # except Exception:
    #     print("Failed to add token to blocklist")
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


# @auth_bp.after_app_request
# def refresh_expiring_jwt(response):
#     try:
#         exp = get_jwt()["exp"]
#         now = datetime.now(UTC)

#         if datetime.timestamp(now + timedelta(minutes=10)) > exp:
#             access_token = create_access_token(identity=get_jwt_identity())
#             set_access_cookies(response, access_token)
#         return response
#     except Exception:
#         return response
