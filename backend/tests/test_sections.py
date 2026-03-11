import pytest
from bson import ObjectId
from test_utils import auth_client, unauth_client

from backend_app.db import db

SECTIONS = ["programs", "people", "casenotes"]


@pytest.mark.parametrize("section", SECTIONS)
def test_get_section(section):
    with unauth_client() as client:
        response = client.get(f"/{section}")
        assert response.status_code == 401
    with auth_client() as client:
        response_before = client.get(f"/{section}")
        assert response_before.status_code == 200
        assert response_before.json == []
        db[section].insert_one({"test": "pass"})
        response_after = client.get(f"/{section}")
        assert response_after.status_code == 200
        assert response_after.json[0]["test"] == "pass"  # type: ignore


def test_get_clients():
    with unauth_client() as client:
        response = client.get("/clients")
        assert response.status_code == 401
    with auth_client() as client:
        response = client.get("/clients")
        assert response.status_code == 200
        assert response.json == []
        db.people.insert_one(
            {
                "firstname": "Test",
                "lastname": "Pass",
                "dob": "2000-01-01",
                "gender": "male",
                "address": {
                    "line1": "123 MAIN ST",
                    "city": "Toronto",
                    "province": "ON",
                    "postalCode": "A1A 1A1",
                },
                "phone": "+14165551234",
                "email": "test@example.com",
            }
        )
        response_after = client.get("/clients")
        assert response_after.status_code == 200
        assert response_after.json[0]["name"] == "Test Pass"
        assert response_after.json[0]["gender"] == "Male"
        assert response_after.json[0]["dob"] == "2000-01-01"


def test_get_staff():
    with unauth_client() as client:
        response = client.get("/staff")
        assert response.status_code == 401
    with auth_client() as client:
        response_before = client.get("/staff")
        assert response_before.status_code == 200
        assert len(response_before.json) == 1  # type: ignore
        db.staff.insert_one({"test": "pass"})
        response_after = client.get("/staff")
        assert response_after.status_code == 200
        assert response_after.json[1]["test"] == "pass"  # type: ignore


def test_add_program():
    with unauth_client() as client:
        response = client.post("/programs")
        assert response.status_code == 401
    with auth_client() as client:
        payload = {"name": "Test Program", "goalTypes": ["Goal 1", "Goal 2"]}
        response = client.post("/programs", json=payload)
        assert response.status_code == 201
        assert response.json["name"] == payload["name"]
        assert response.json["goalTypes"] == payload["goalTypes"]
        program_id = response.json["_id"]
        assert program_id is not None
        assert db.programs.count_documents({}) == 1
        program_doc = db.programs.find_one({"_id": ObjectId(program_id)})
        assert program_doc is not None
        assert program_doc["name"] == payload["name"]
        assert program_doc["goalTypes"] == payload["goalTypes"]
        assert str(program_doc["_id"]) == program_id
