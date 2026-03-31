from bson import ObjectId
from test_utils import auth_client, seed_programs, unauth_client

from backend_app.db import db

# Routes use /people/<id>/casenotes (see backend_app.routes.casenotes).
_SAMPLE_OID = "507f1f77bcf86cd799439011"


def test_casenotes_unauthenticated():
    with unauth_client() as client:
        assert client.get(f"/people/{_SAMPLE_OID}/casenotes").status_code == 401
        assert (
            client.post(f"/people/{_SAMPLE_OID}/casenotes", json={"date": "2025-03-15"}).status_code
            == 401
        )


# def test_get_seeded_casenotes():
#     with seeded_client(num_people=10) as client:
#         people = client.get("/people").json
#         assert len(people) > 0
#         pid = people[0]["_id"]
#         resp = client.get(f"/people/{pid}/casenotes")
#         assert resp.status_code == 200
#         assert len(resp.json) > 0
#         note = resp.json[0]
#         assert isinstance(note["content"], str)
#         assert len(note["content"]) > 0


def test_get_casenotes_for_person():
    with auth_client() as client:
        seed_programs()
        resp = client.post("/people", json={"firstname": "John", "lastname": "Doe"})
        pid = resp.json["_id"]
        client.post(
            f"/people/{pid}/casenotes",
            json={"date": "2025-03-15", "content": "Test note"},
        )

        resp = client.get(f"/people/{pid}/casenotes")
        assert resp.status_code == 200
        assert len(resp.json) == 1
        assert resp.json[0]["content"] == "Test note"


def test_get_casenotes_for_invalid_person():
    with auth_client() as client:
        # Valid ObjectId format but no such person: API returns an empty list.
        resp = client.get(f"/people/{ObjectId()}/casenotes")
        assert resp.status_code == 200
        assert resp.json == []


def test_save_casenote():
    with auth_client() as client:
        seed_programs()
        resp = client.post("/people", json={"firstname": "John", "lastname": "Doe"})
        pid = resp.json["_id"]

        resp = client.post(
            f"/people/{pid}/casenotes",
            json={"date": "2025-03-15", "content": "Test note"},
        )
        assert resp.status_code == 201
        note = db.casenotes.find_one({"personid": ObjectId(pid), "date": "2025-03-15"})
        assert note is not None
        assert note["content"] == "Test note"


def test_save_casenote_invalid_person_id():
    with auth_client() as client:
        resp = client.post(
            "/people/not-valid/casenotes",
            json={"date": "2025-03-15", "content": "Test note"},
        )
        assert resp.status_code == 400


def test_save_casenote_missing_fields():
    with auth_client() as client:
        seed_programs()
        resp = client.post("/people", json={"firstname": "John", "lastname": "Doe"})
        pid = resp.json["_id"]
        resp = client.post(f"/people/{pid}/casenotes", json={"personid": "abc"})
        assert resp.status_code == 400
        resp = client.post(f"/people/{pid}/casenotes", json={"content": "only"})
        assert resp.status_code == 400


def test_update_casenote():
    with auth_client() as client:
        seed_programs()
        resp = client.post("/people", json={"firstname": "John", "lastname": "Doe"})
        pid = resp.json["_id"]

        resp = client.post(
            f"/people/{pid}/casenotes",
            json={"date": "2025-03-15", "content": "Test note"},
        )
        assert resp.status_code == 201
        casenote_id = resp.json["_id"]

        resp = client.put(
            f"/people/{pid}/casenotes/{casenote_id}",
            json={"content": "Test note 2"},
        )
        assert resp.status_code == 200

        stored = db.casenotes.find_one({"personid": ObjectId(pid), "date": "2025-03-15"})
        assert stored["content"] == "Test note 2"
