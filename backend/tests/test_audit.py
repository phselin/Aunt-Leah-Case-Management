from bson import ObjectId
from test_utils import auth_client, seed_programs, unauth_client

from backend_app.db import db


def test_audit_unauthenticated():
    with unauth_client() as client:
        assert client.get("/audit").status_code == 401


def test_record_changes_are_audited():
    with auth_client() as client:
        seed_programs()
        db.audit.delete_many({})
        pid = client.post("/people", json={"firstname": "Jane", "lastname": "Doe"}).json["_id"]
        client.post(f"/people/{pid}/casenotes", json={"date": "2025-01-01", "content": "Met"})
        client.patch(f"/people/{pid}/active", json={"active": False})
        client.patch(f"/people/{pid}/active", json={"active": True})
        client.delete(f"/people/{pid}")

        entries = client.get("/audit").json
        actions = {e["action"] for e in entries}
        assert actions == {
            'deleted client "Jane Doe"',
            'activated client "Jane Doe"',
            'deactivated client "Jane Doe"',
            'saved a case note for "Jane Doe"',
            'added a new client with name "Jane Doe"',
        }
        assert all(e["user"] == "Test Admin" for e in entries)
        assert "id" in entries[0] and "timestamp" in entries[0]


def test_failed_changes_are_not_audited():
    with auth_client() as client:
        db.audit.delete_many({})
        client.post("/people", json={"firstname": "1nvalid"})
        client.delete(f"/people/{ObjectId()}")
        assert client.get("/audit").json == []


def test_audit_pagination():
    with auth_client() as client:
        db.audit.delete_many({})
        db.audit.insert_many([{"timestamp": i, "action": f"a{i}", "user": "u"} for i in range(25)])
        page1 = client.get("/audit").json
        page2 = client.get("/audit?page=2").json
        assert len(page1) == 20 and len(page2) == 5
        assert page1[0]["action"] == "a24"
        assert page2[-1]["action"] == "a0"
        db.audit.delete_many({})
