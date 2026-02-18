import pytest
from test_utils import auth_client, unauth_client

from backend_app.db import db

SECTIONS = ["programs", "people", "casenotes", "goals"]


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
        assert response_after.json[0]["test"] == "pass"


def test_get_staff():
    with unauth_client() as client:
        response = client.get("/staff")
        assert response.status_code == 401
    with auth_client() as client:
        response_before = client.get("/staff")
        assert response_before.status_code == 200
        assert len(response_before.json) == 1
        db.staff.insert_one({"test": "pass"})
        response_after = client.get("/staff")
        assert response_after.status_code == 200
        assert response_after.json[1]["test"] == "pass"
