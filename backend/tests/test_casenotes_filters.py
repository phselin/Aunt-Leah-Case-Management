from bson import ObjectId
from test_utils import auth_client, seed_programs

from backend_app.db import db


def _person_with_notes(client):
    seed_programs()
    pid = client.post(
        "/people",
        json={"firstname": "Jane", "lastname": "Doe", "programs": ["Housing", "Education"]},
    ).json["_id"]
    notes = [
        ("2025-01-01", "Found an apartment", "Housing", "Visit"),
        ("2025-01-01", "Enrolled in GED class", "Education", "Call"),
        ("2025-02-01", "Rent paid on time", "Housing", "Call"),
    ]
    for date, content, program, category in notes:
        resp = client.post(
            f"/people/{pid}/casenotes",
            json={"date": date, "content": content, "program": program, "category": category},
        )
        assert resp.status_code == 201
    return pid


def _contents(client, url):
    return sorted(n["content"] for n in client.get(url).json)


def test_casenote_dates():
    with auth_client() as client:
        pid = _person_with_notes(client)
        assert client.get(f"/people/{pid}/casenotes/dates").json == ["2025-02-01", "2025-01-01"]
        assert client.get("/people/bad/casenotes/dates").status_code == 400
        assert client.get(f"/people/{ObjectId()}/casenotes/dates").status_code == 404


def test_casenote_filters():
    with auth_client() as client:
        pid = _person_with_notes(client)
        url = f"/people/{pid}/casenotes"
        assert len(client.get(url).json) == 3
        assert _contents(client, f"{url}?date=2025-01-01") == [
            "Enrolled in GED class",
            "Found an apartment",
        ]
        assert _contents(client, f"{url}?search=RENT") == ["Rent paid on time"]
        assert _contents(client, f"{url}?program=Education") == ["Enrolled in GED class"]
        assert _contents(client, f"{url}?category=Call&program=Housing") == ["Rent paid on time"]
        assert client.get("/people/bad/casenotes").status_code == 400
        assert client.get(f"/people/{ObjectId()}/casenotes").status_code == 404


def test_save_casenote_errors():
    with auth_client() as client:
        pid = _person_with_notes(client)
        url = f"/people/{pid}/casenotes"
        assert client.post("/people/bad/casenotes", json={}).status_code == 400
        assert client.post(url, json={"date": "Jan 1", "content": "x"}).status_code == 400
        resp = client.post(url, json={"date": "2025-01-01", "content": "x", "program": "Art"})
        assert resp.status_code == 400
        resp = client.post(
            f"/people/{ObjectId()}/casenotes", json={"date": "2025-01-01", "content": "x"}
        )
        assert resp.status_code == 404


def test_edit_casenote_fields():
    with auth_client() as client:
        pid = _person_with_notes(client)
        note = db.casenotes.find_one({"content": "Found an apartment"})
        url = f"/people/{pid}/casenotes/{note['_id']}"

        resp = client.put(url, json={"program": "Education", "category": "Email"})
        assert resp.status_code == 200
        assert resp.json["program"] == "Education"
        assert resp.json["category"] == "Email"
        assert resp.json["lastUpdatedBy"] == "Test Admin"

        resp = client.put(url, json={"program": "", "category": ""})
        assert resp.status_code == 200
        assert "program" not in resp.json and "category" not in resp.json

        assert client.put(f"/people/{pid}/casenotes/bad", json={}).status_code == 400
        missing_person = f"/people/{ObjectId()}/casenotes/{note['_id']}"
        assert client.put(missing_person, json={}).status_code == 404
