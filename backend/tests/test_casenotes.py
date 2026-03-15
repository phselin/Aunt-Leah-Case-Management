from bson import ObjectId
from test_utils import auth_client, seed_programs, seeded_client, unauth_client

from backend_app.db import db


def test_casenotes_unauthenticated():
    with unauth_client() as client:
        assert client.get("/casenotes").status_code == 401
        assert client.post("/casenotes").status_code == 401


def test_get_seeded_casenotes():
    with seeded_client(num_people=10) as client:
        resp = client.get("/casenotes")
        assert resp.status_code == 200
        assert len(resp.json) > 0
        note = resp.json[0]
        assert isinstance(note["content"], str)
        assert len(note["content"]) > 0


def test_get_casenotes_for_person():
    with auth_client() as client:
        seed_programs()
        resp = client.post("/people", json={"firstname": "John", "lastname": "Doe"})
        pid = resp.json["_id"]
        client.post(
            "/casenotes",
            json={"personid": pid, "date": "2025-03-15", "content": "Test note"},
        )

        resp = client.get(f"/casenotes?person={pid}")
        assert resp.status_code == 200
        assert len(resp.json) == 1
        assert resp.json[0]["content"] == "Test note"


def test_get_casenotes_for_invalid_person():
    with auth_client() as client:
        resp = client.get(f"/casenotes?person={ObjectId()}")
        assert resp.status_code == 404


def test_save_casenote():
    with auth_client() as client:
        seed_programs()
        resp = client.post("/people", json={"firstname": "John", "lastname": "Doe"})
        pid = resp.json["_id"]

        resp = client.post(
            "/casenotes",
            json={"personid": pid, "date": "2025-03-15", "content": "Test note"},
        )
        assert resp.status_code == 200
        note = db.casenotes.find_one({"personid": ObjectId(pid), "date": "2025-03-15"})
        assert note is not None
        assert note["content"] == "Test note"


def test_save_casenote_invalid_person_id():
    with auth_client() as client:
        resp = client.post(
            "/casenotes",
            json={"personid": "not-valid", "date": "2025-03-15", "content": "Test note"},
        )
        assert resp.status_code == 400


def test_save_casenote_missing_fields():
    with auth_client() as client:
        resp = client.post("/casenotes", json={"personid": "abc"})
        assert resp.status_code == 400

        resp = client.post("/casenotes", json={"date": "2025-03-15"})
        assert resp.status_code == 400


def test_update_casenote():
    with auth_client() as client:
        seed_programs()
        resp = client.post("/people", json={"firstname": "John", "lastname": "Doe"})
        pid = resp.json["_id"]

        client.post(
            "/casenotes",
            json={"personid": pid, "date": "2025-03-15", "content": "Test note"},
        )
        client.post(
            "/casenotes",
            json={"personid": pid, "date": "2025-03-15", "content": "Test note 2"},
        )

        count = db.casenotes.count_documents({"personid": ObjectId(pid), "date": "2025-03-15"})
        assert count == 1

        stored = db.casenotes.find_one({"personid": ObjectId(pid), "date": "2025-03-15"})
        assert stored["content"] == "Test note 2"
