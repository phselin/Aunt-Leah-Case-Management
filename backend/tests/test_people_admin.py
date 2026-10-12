from io import BytesIO

import openpyxl
from bson import ObjectId
from test_utils import auth_client, seed_programs

from backend_app.db import db


def _create(client, **fields):
    body = {"firstname": "Jane", "lastname": "Doe", **fields}
    resp = client.post("/people", json=body)
    assert resp.status_code == 201, resp.json
    return resp.json["_id"]


def test_intake_form_lists_current_programs():
    with auth_client() as client:
        seed_programs()
        form = client.get("/people/intake").json
        enrollment = form["sections"][0]["fields"][-1]
        assert enrollment["key"] == "programs"
        assert sorted(enrollment["options"]) == [
            "Drug Rehabilitation",
            "Education",
            "Employment",
            "Housing",
        ]


def test_export_people_to_excel():
    with auth_client() as client:
        seed_programs()
        _create(client, firstname="Ann", programs=["Housing", "Education"])
        _create(client, firstname="Bob", programs=["Housing"])

        resp = client.get("/people/export?programs=Housing,Education")
        assert resp.status_code == 200
        sheet = openpyxl.load_workbook(BytesIO(resp.data)).active
        header = [c.value for c in sheet[1]]
        rows = [dict(zip(header, [c.value for c in r], strict=True)) for r in sheet.iter_rows(2)]
        assert [r["firstname"] for r in rows] == ["Ann"]
        assert rows[0]["programs"] == "Housing, Education"

        resp = client.get("/people/export?search=bob")
        assert resp.status_code == 200
        assert client.get("/people/export?search=nobody").status_code == 404


def test_get_person_errors():
    with auth_client() as client:
        assert client.get("/people/bad-id").status_code == 400
        assert client.get(f"/people/{ObjectId()}").status_code == 404


def test_update_person_errors():
    with auth_client() as client:
        pid = _create(client)
        body = {"firstname": "Jane", "lastname": "Doe"}
        assert client.put("/people/bad-id", json=body).status_code == 400
        assert client.put(f"/people/{ObjectId()}", json=body).status_code == 404
        resp = client.put(
            f"/people/{pid}", json={"firstname": "Jane", "lastname": "Doe", "gender": "x"}
        )
        assert resp.status_code == 400
        assert "gender" in resp.json["errors"][0]


def test_update_person_clears_removed_fields():
    with auth_client() as client:
        pid = _create(client, email="jane@test.com")
        resp = client.put(f"/people/{pid}", json={"firstname": "Jane", "lastname": "Doe"})
        assert resp.status_code == 200
        assert "email" not in db.people.find_one({"_id": ObjectId(pid)})


def test_delete_person():
    with auth_client() as client:
        pid = _create(client)
        assert client.delete("/people/bad-id").status_code == 400
        assert client.delete(f"/people/{pid}").status_code == 200
        assert client.delete(f"/people/{pid}").status_code == 404


def test_person_active_toggle():
    with auth_client() as client:
        pid = _create(client)
        assert client.patch("/people/bad/active", json={"active": False}).status_code == 400
        assert client.patch(f"/people/{pid}/active", json={"active": "no"}).status_code == 400
        resp = client.patch(f"/people/{ObjectId()}/active", json={"active": False})
        assert resp.status_code == 404
        resp = client.patch(f"/people/{pid}/active", json={"active": False})
        assert resp.status_code == 200
        assert resp.json["active"] is False


def test_update_milestones():
    with auth_client() as client:
        seed_programs()
        pid = _create(client, programs=["Housing"])

        def put(**body):
            return client.put(f"/people/{pid}/milestones", json=body)

        assert client.put("/people/bad/milestones", json={}).status_code == 400
        assert put(program="Housing").status_code == 400
        assert put(program="Nope", type="general", milestone="x").status_code == 400
        assert put(program="Housing", type="nope", milestone="shelter").status_code == 400
        assert put(program="Housing", type="general", milestone="mansion").status_code == 400
        assert put(program="Education", type="general", milestone="A").status_code == 400
        resp = client.put(
            f"/people/{ObjectId()}/milestones",
            json={"program": "Housing", "type": "general", "milestone": "shelter"},
        )
        assert resp.status_code == 404

        resp = put(program="Housing", type="general", milestone="shelter")
        assert resp.status_code == 200
        first = resp.json["programMilestones"]["Housing"]["general"]
        assert first["value"] == "shelter"

        db.people.update_one(
            {"_id": ObjectId(pid)},
            {"$set": {"programMilestones.Housing.general.startDate": "2020-01-01"}},
        )
        second = put(program="Housing", type="general", milestone="permanent").json
        milestone = second["programMilestones"]["Housing"]["general"]
        assert milestone["value"] == "permanent"
        assert milestone["startDate"] == "2020-01-01"  # start date is kept across updates
