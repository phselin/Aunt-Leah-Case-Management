import re
import secrets
from datetime import datetime, timedelta, timezone

import pyotp
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
from password_strength import PasswordPolicy

from backend_app.auth_init import bcrypt, jwt, limiter
from backend_app.db import db, redis_client

auth_bp = Blueprint("auth", __name__)

policy = PasswordPolicy.from_names(length=8, uppercase=1, numbers=1, special=1)


@jwt.user_lookup_error_loader
def user_lookup_error(_jwt_header, _jwt_data):
    resp = jsonify({"detail": "Expired token"})
    unset_jwt_cookies(resp)
    return resp, 401


@jwt.user_lookup_loader
def user_lookup(_jwt_header, jwt_data):
    identity = jwt_data["sub"]

    try:
        cached_user = redis_client.get(f"user:{identity}")
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
                name=f"user:{identity}", time=timedelta(minutes=15), value=json_util.dumps(user)
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
    email = email.lower().strip()
    emailPattern = r"^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$"

    if re.match(emailPattern, email, re.IGNORECASE) is None:
        raise ValueError("String is not in email format")

    return email


def _normalize_otp(raw) -> str:
    """Digits only; authenticators send 6-digit codes (see frontend OtpInput)."""
    if raw is None:
        return ""
    return "".join(c for c in str(raw) if c.isdigit())


def _verify_totp(totp: pyotp.TOTP, otp_raw) -> bool:
    code = _normalize_otp(otp_raw)
    if len(code) != 6:
        return False
    return bool(totp.verify(code, valid_window=1))


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

    user = db.staff.find_one({"email": email, "active": True})
    if not user:
        return jsonify({"detail": "Invalid credentials"}), 401

    if "passwordHash" not in user or not bcrypt.check_password_hash(user["passwordHash"], password):
        return jsonify({"detail": "Invalid credentials"}), 401

    mfa_session = secrets.token_urlsafe(32)

    redis_client.setex(
        name=f"mfaSession:{mfa_session}",
        time=timedelta(minutes=10),
        value=str(user["_id"]),
    )

    if not user.get("mfaEnabled"):
        return jsonify(
            {
                "setupRequired": True,
                "mfaSession": mfa_session,
                "detail": "Please set up MFA and change your password",
            }
        ), 200

    return jsonify({"mfaRequired": True, "mfaSession": mfa_session, "detail": "OTP required"})


@auth_bp.post("/login/mfa")
def login_mfa():
    data = request.get_json()
    session = data.get("mfaSession")
    otp = data.get("otp")
    id = redis_client.get(f"mfaSession:{session}")
    if not session or not id:
        return jsonify({"detail": "MFA session expired or invalid"}), 401
    try:
        oid = ObjectId(id)
    except InvalidId:
        return jsonify({"detail": "MFA session expired or invalid"}), 401

    user = db.staff.find_one({"_id": oid, "active": True})
    if not user:
        return jsonify({"detail": "User not found"}), 404
    if not user.get("mfaSecret"):
        return jsonify({"detail": "MFA not configured"}), 400

    totp = pyotp.TOTP(user["mfaSecret"])
    if _verify_totp(totp, otp):
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
        redis_client.delete(f"mfaSession:{session}")
        return resp

    return jsonify({"detail": "Invalid OTP Code"}), 401


@auth_bp.post("/mfa/setup")
@limiter.limit("5 per minute")
def setup_mfa():
    data = request.get_json()
    session = data.get("mfaSession")
    id = redis_client.get(f"mfaSession:{session}")
    if not session or not id:
        return jsonify({"detail": "MFA session expired or invalid"}), 401
    try:
        oid = ObjectId(id)
    except InvalidId:
        return jsonify({"detail": "MFA session expired or invalid"}), 401

    staff = db.staff.find_one({"_id": oid})
    if not staff:
        return jsonify({"detail": "User not found"}), 404

    if staff.get("mfaSecret") and not staff.get("mfaEnabled"):
        secret = staff["mfaSecret"]
    else:
        secret = pyotp.random_base32()
        db.staff.update_one(
            {"_id": staff["_id"]},
            {"$set": {"mfaSecret": secret, "mfaEnabled": False}},
        )

    totp = pyotp.TOTP(secret)
    provisioning_url = totp.provisioning_uri(name=staff["email"], issuer_name="AuntLeahs")
    return jsonify({"uri": provisioning_url})


@auth_bp.post("/mfa/confirm")
@limiter.limit("5 per minute")
def confirm_mfa():
    data = request.get_json()
    session = data.get("mfaSession")
    otp = data.get("otp")
    pwd = data.get("password")

    id = redis_client.get(f"mfaSession:{session}")
    if not session or not id:
        return jsonify({"detail": "MFA session expired or invalid"}), 401
    try:
        oid = ObjectId(id)
    except InvalidId:
        return jsonify({"detail": "MFA session expired or invalid"}), 401

    user = db.staff.find_one({"_id": oid, "active": True})
    if not user:
        return jsonify({"detail": "User not found"}), 404
    if not user.get("mfaSecret"):
        return jsonify({"detail": "MFA not configured"}), 400

    # uncomment this for a stricted password check
    # if policy.test(pwd) != []:
    #     return jsonify(
    #         {
    #             "detail": "Password must be at least 8 characters long with an uppercase letter, number and symbol"  # noqa: E501
    #         }
    #     ), 400

    totp = pyotp.TOTP(user["mfaSecret"])
    if _verify_totp(totp, otp):
        db.staff.update_one(
            {"_id": user["_id"]},
            {
                "$set": {
                    "mfaEnabled": True,
                    "passwordHash": bcrypt.generate_password_hash(pwd).decode("utf-8"),
                }
            },
        )
        access_token = create_access_token(identity=str(user["_id"]))
        resp = jsonify(
            {
                "detail": "MFA enabled and new password set",
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
        redis_client.delete(f"mfaSession:{session}")
        return resp
    return jsonify({"detail": "Invalid OTP Code"}), 400


@auth_bp.post("/logout")
@jwt_required()
def logout():
    jti = get_jwt()["jti"]
    try:
        redis_client.setex(name=jti, time=timedelta(minutes=30), value="revoked")
    except Exception:
        print("Failed to add token to blocklist")
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
