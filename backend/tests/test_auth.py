from test_utils import (
    ADMIN_EMAIL,
    ADMIN_PASSWORD,
    auth_client,
    complete_test_login,
    unauth_client,
)


def test_logout():
    with auth_client() as client:
        resp = client.post("/logout")
        assert resp.status_code == 200
        resp = client.get("/me")
        assert resp.status_code == 401


def test_login_success():
    with auth_client() as client:
        client.post("/logout")
        complete_test_login(client)
        resp = client.get("/me")
        assert resp.status_code == 200
        assert resp.json["user"]["email"] == ADMIN_EMAIL


def test_login_failure():
    with auth_client() as client:
        client.post("/logout")
        resp = client.post("/login", json={"email": "notanemail", "password": ADMIN_PASSWORD})
        assert resp.status_code == 400
        resp = client.post("/login", json={"email": ADMIN_EMAIL, "password": "1234"})
        assert resp.status_code == 401


def test_me():
    with unauth_client() as client:
        resp = client.get("/me")
        assert resp.status_code == 401
    with auth_client() as client:
        resp = client.get("/me")
        assert resp.status_code == 200
        assert resp.json["user"]["email"] == ADMIN_EMAIL
        assert resp.json["user"]["role"] == "super-admin"
        assert resp.json["user"]["firstname"] == "Test"
        assert resp.json["user"]["lastname"] == "Admin"
