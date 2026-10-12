from datetime import timedelta

import pyotp
from test_utils import (
    ADMIN_EMAIL,
    ADMIN_MFA_SECRET,
    ADMIN_PASSWORD,
    auth_client,
    insert_admin,
    insert_staff,
    reset_db,
    unauth_client,
)

from backend_app.db import db, redis_client
from backend_app.flask_app import create_flask_app


def _new_user_client():
    """Fresh app with one staff member who has not set up MFA yet."""
    reset_db()
    app = create_flask_app()
    with app.app_context():
        insert_staff("staff", email="new@test.com", password="temp", mfa=False)
    return app.test_client()


def _start_login(client, email=ADMIN_EMAIL, password=ADMIN_PASSWORD):
    resp = client.post("/login", json={"email": email, "password": password})
    assert resp.status_code == 200
    return resp.json


def test_mfa_setup_and_confirm_flow():
    client = _new_user_client()
    body = _start_login(client, "new@test.com", "temp")
    assert body["setupRequired"] is True
    session = body["mfaSession"]

    # Not logged in until MFA is confirmed
    assert client.get("/me").status_code == 401

    resp = client.post("/mfa/setup", json={"mfaSession": session})
    assert resp.status_code == 200
    assert resp.json["uri"].startswith("otpauth://totp/AuntLeahs:new%40test.com")
    secret = db.staff.find_one({"email": "new@test.com"})["mfaSecret"]

    # Calling setup again (e.g. page refresh) keeps the same unconfirmed secret
    client.post("/mfa/setup", json={"mfaSession": session})
    assert db.staff.find_one({"email": "new@test.com"})["mfaSecret"] == secret

    resp = client.post(
        "/mfa/confirm", json={"mfaSession": session, "otp": "000000", "password": "New1!"}
    )
    assert resp.status_code == 400
    assert db.staff.find_one({"email": "new@test.com"})["mfaEnabled"] is False

    resp = client.post(
        "/mfa/confirm",
        json={"mfaSession": session, "otp": pyotp.TOTP(secret).now(), "password": "NewPass1!"},
    )
    assert resp.status_code == 200
    assert resp.json["user"]["email"] == "new@test.com"
    assert db.staff.find_one({"email": "new@test.com"})["mfaEnabled"] is True
    assert client.get("/me").status_code == 200

    # The MFA session is single-use
    resp = client.post(
        "/mfa/confirm",
        json={"mfaSession": session, "otp": pyotp.TOTP(secret).now(), "password": "x"},
    )
    assert resp.status_code == 401

    # Temporary password no longer works; new one requires an OTP
    client.post("/logout")
    assert (
        client.post("/login", json={"email": "new@test.com", "password": "temp"}).status_code == 401
    )
    assert _start_login(client, "new@test.com", "NewPass1!")["mfaRequired"] is True
    reset_db()


def test_mfa_session_invalid():
    with unauth_client() as client:
        for path in ("/login/mfa", "/mfa/setup", "/mfa/confirm"):
            resp = client.post(path, json={"mfaSession": "bogus", "otp": "123456"})
            assert resp.status_code == 401, path
            resp = client.post(path, json={"otp": "123456"})
            assert resp.status_code == 401, path


def test_mfa_session_with_malformed_user_id():
    with unauth_client() as client:
        redis_client.setex(name="mfaSession:bad", time=timedelta(minutes=1), value="not-an-id")
        for path in ("/login/mfa", "/mfa/setup", "/mfa/confirm"):
            resp = client.post(path, json={"mfaSession": "bad", "otp": "123456"})
            assert resp.status_code == 401, path


def test_mfa_session_for_deleted_or_unconfigured_user():
    reset_db()
    app = create_flask_app()
    insert_admin(app)
    client = app.test_client()
    session = _start_login(client)["mfaSession"]

    db.staff.update_one({"email": ADMIN_EMAIL}, {"$unset": {"mfaSecret": ""}})
    assert client.post("/login/mfa", json={"mfaSession": session, "otp": "1"}).status_code == 400
    assert client.post("/mfa/confirm", json={"mfaSession": session, "otp": "1"}).status_code == 400

    db.staff.delete_many({})
    for path in ("/login/mfa", "/mfa/setup", "/mfa/confirm"):
        assert client.post(path, json={"mfaSession": session, "otp": "1"}).status_code == 404
    reset_db()


def test_login_mfa_rejects_bad_otp():
    reset_db()
    app = create_flask_app()
    insert_admin(app)
    client = app.test_client()
    session = _start_login(client)["mfaSession"]
    totp = pyotp.TOTP(ADMIN_MFA_SECRET)

    for otp in (None, "", "12345", "abcdef", "1234567"):
        resp = client.post("/login/mfa", json={"mfaSession": session, "otp": otp})
        assert resp.status_code == 401, otp
    wrong = str((int(totp.now()) + 500000) % 1000000).zfill(6)
    assert client.post("/login/mfa", json={"mfaSession": session, "otp": wrong}).status_code == 401
    assert client.get("/me").status_code == 401

    # Spaces/dashes are stripped from codes typed by users
    code = totp.now()
    resp = client.post("/login/mfa", json={"mfaSession": session, "otp": f"{code[:3]} {code[3:]}"})
    assert resp.status_code == 200
    reset_db()


def test_login_validation():
    reset_db()
    app = create_flask_app()
    insert_admin(app)
    client = app.test_client()
    assert client.post("/login", json={"email": ADMIN_EMAIL}).status_code == 400
    assert client.post("/login", json={"password": ADMIN_PASSWORD}).status_code == 400
    assert (
        client.post("/login", json={"email": "nobody@test.com", "password": "x"}).status_code == 401
    )
    # Email is normalized before lookup
    resp = client.post("/login", json={"email": "  ADMIN@Test.com ", "password": ADMIN_PASSWORD})
    assert resp.status_code == 200
    reset_db()


def test_inactive_staff_cannot_login():
    reset_db()
    app = create_flask_app()
    insert_admin(app)
    db.staff.update_one({"email": ADMIN_EMAIL}, {"$set": {"active": False}})
    client = app.test_client()
    resp = client.post("/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert resp.status_code == 401
    reset_db()


def test_login_rate_limited():
    reset_db()
    app = create_flask_app()
    insert_admin(app)
    client = app.test_client()
    codes = [
        client.post("/login", json={"email": ADMIN_EMAIL, "password": "wrong"}).status_code
        for _ in range(6)
    ]
    assert codes[:5] == [401] * 5
    assert codes[5] == 429
    reset_db()


def test_revoked_token_cannot_be_reused():
    with auth_client() as client:
        token = client.get_cookie("access_token_cookie").value
        assert client.post("/logout").status_code == 200
        client.set_cookie("access_token_cookie", token)
        assert client.get("/me").status_code == 401


def test_logout_requires_login():
    with unauth_client() as client:
        assert client.post("/logout").status_code == 401


def test_token_for_deleted_user_rejected():
    with auth_client() as client:
        admin = db.staff.find_one({"email": ADMIN_EMAIL})
        db.staff.delete_one({"_id": admin["_id"]})
        redis_client.delete(f"user:{admin['_id']}")
        resp = client.get("/me")
        assert resp.status_code == 401
        assert resp.json["detail"] == "Expired token"


def test_expiring_token_is_refreshed():
    reset_db()
    app = create_flask_app()
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(minutes=5)
    insert_admin(app)
    client = app.test_client()
    session = _start_login(client)["mfaSession"]
    client.post(
        "/login/mfa", json={"mfaSession": session, "otp": pyotp.TOTP(ADMIN_MFA_SECRET).now()}
    )
    old = client.get_cookie("access_token_cookie").value

    resp = client.get("/me")
    assert resp.status_code == 200
    assert any("access_token_cookie" in h for h in resp.headers.getlist("Set-Cookie"))
    assert client.get_cookie("access_token_cookie").value != old
    reset_db()
