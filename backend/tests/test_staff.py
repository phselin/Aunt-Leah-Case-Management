from bson import ObjectId
from test_utils import auth_client, seed_programs, unauth_client

from backend_app.db import db


def _staff_json(**overrides):
    body = {
        "firstname": "Sam",
        "lastname": "Worker",
        "role": "staff",
        "email": "Sam@Test.com",
        "phone": "+1 604-555-0100",
        "programs": ["Housing"],
        "password": "TempPass1!",
    }
    body.update(overrides)
    return body


def test_staff_unauthenticated():
    with unauth_client() as client:
        assert client.get("/staff").status_code == 401
        assert client.post("/staff", json=_staff_json()).status_code == 401


def test_create_staff():
    with auth_client() as client:
        seed_programs()
        resp = client.post("/staff", json=_staff_json())
        assert resp.status_code == 201
        assert resp.json["email"] == "sam@test.com"
        assert resp.json["phone"] == "+16045550100"
        assert "password" not in resp.json
        assert "passwordHash" not in resp.json

        stored = db.staff.find_one({"email": "sam@test.com"})
        assert stored["passwordHash"] != "TempPass1!"
        assert stored["mfaEnabled"] is False

        assert client.post("/staff", json=_staff_json()).status_code == 409


def test_create_staff_validation():
    with auth_client() as client:
        seed_programs()
        for bad in (
            {"role": "owner"},
            {"email": "not-an-email"},
            {"programs": ["Nonexistent"]},
            {"firstname": "R2D2"},
            {"phone": "12345"},
            {"phone": "+44 20 7946 0958 1"},
        ):
            resp = client.post("/staff", json=_staff_json(**bad))
            assert resp.status_code == 400, bad
        assert db.staff.count_documents({"email": "sam@test.com"}) == 0


def test_admin_roles_have_no_program_list():
    with auth_client() as client:
        seed_programs()
        resp = client.post("/staff", json=_staff_json(role="admin", programs=["Bogus"]))
        assert resp.status_code == 201
        assert resp.json["programs"] == []


def test_get_staff_and_search():
    with auth_client() as client:
        seed_programs()
        client.post("/staff", json=_staff_json())
        client.post("/staff", json=_staff_json(firstname="Alex", lastname="Smith", email="a@t.com"))

        resp = client.get("/staff")
        assert resp.status_code == 200
        assert len(resp.json) == 3
        assert all("passwordHash" not in s and "mfaSecret" not in s for s in resp.json)

        names = [s["firstname"] for s in client.get("/staff?staff=smith alex").json]
        assert names == ["Alex"]

        sid = resp.json[0]["_id"]
        assert client.get(f"/staff/{sid}").json["_id"] == sid
        assert client.get("/staff/bad-id").status_code == 400
        assert client.get(f"/staff/{ObjectId()}").status_code == 400


def test_update_staff():
    with auth_client() as client:
        seed_programs()
        sid = client.post("/staff", json=_staff_json()).json["_id"]
        client.post("/staff", json=_staff_json(email="taken@test.com"))

        resp = client.put(f"/staff/{sid}", json=_staff_json(lastname="Changed", phone=None))
        assert resp.status_code == 200
        assert resp.json["lastname"] == "Changed"
        assert "phone" not in db.staff.find_one({"_id": ObjectId(sid)})

        assert (
            client.put(f"/staff/{sid}", json=_staff_json(email="taken@test.com")).status_code == 409
        )
        assert client.put(f"/staff/{sid}", json=_staff_json(role="boss")).status_code == 400
        assert client.put("/staff/bad-id", json=_staff_json()).status_code == 400
        assert client.put(f"/staff/{ObjectId()}", json=_staff_json()).status_code == 400


def test_resetting_staff_mfa_clears_secret():
    with auth_client() as client:
        seed_programs()
        sid = client.post("/staff", json=_staff_json()).json["_id"]
        db.staff.update_one(
            {"_id": ObjectId(sid)}, {"$set": {"mfaEnabled": True, "mfaSecret": "SECRET"}}
        )
        resp = client.put(f"/staff/{sid}", json=_staff_json(mfaEnabled=False, password="Reset1!"))
        assert resp.status_code == 200
        stored = db.staff.find_one({"_id": ObjectId(sid)})
        assert "mfaSecret" not in stored
        assert stored["mfaEnabled"] is False


def test_deactivate_staff_blocks_login():
    with auth_client() as client:
        seed_programs()
        sid = client.post("/staff", json=_staff_json()).json["_id"]

        assert client.patch(f"/staff/{sid}/active", json={"active": "no"}).status_code == 400
        assert client.patch(f"/staff/{sid}/active", json={}).status_code == 400
        assert client.patch("/staff/bad/active", json={"active": False}).status_code == 400

        resp = client.patch(f"/staff/{sid}/active", json={"active": False})
        assert resp.status_code == 200
        assert resp.json["active"] is False
        resp = client.post("/login", json={"email": "sam@test.com", "password": "TempPass1!"})
        assert resp.status_code == 401

        assert client.patch(f"/staff/{sid}/active", json={"active": True}).status_code == 200
        resp = client.post("/login", json={"email": "sam@test.com", "password": "TempPass1!"})
        assert resp.status_code == 200
