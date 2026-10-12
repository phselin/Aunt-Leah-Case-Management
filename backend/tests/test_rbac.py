"""Role-based access: staff only see clients in their own programs; admin-only and
super-admin-only actions are refused for lower roles."""

from bson import ObjectId
from test_utils import auth_client, role_client

from backend_app.db import db


def _insert_person(firstname, programs, active=True):
    return str(
        db.people.insert_one(
            {"firstname": firstname, "lastname": "Client", "programs": programs, "active": active}
        ).inserted_id
    )


def _insert_casenote(pid, program, content):
    db.casenotes.insert_one(
        {"personid": ObjectId(pid), "date": "2025-01-01", "program": program, "content": content}
    )


def test_staff_only_see_clients_in_their_programs():
    with role_client("staff", ["Housing"]) as client:
        _insert_person("Housed", ["Housing"])
        _insert_person("Student", ["Education"])
        _insert_person("Unassigned", [])
        _insert_person("Inactive", ["Housing"], active=False)

        for path in ("/people", "/clients"):
            names = {p["firstname"] for p in client.get(path).json}
            assert names == {"Housed", "Unassigned"}, path


def test_admins_see_all_clients():
    with role_client("admin") as client:
        _insert_person("Housed", ["Housing"])
        _insert_person("Student", ["Education"])
        _insert_person("Inactive", ["Housing"], active=False)
        names = {p["firstname"] for p in client.get("/people").json}
        assert names == {"Housed", "Student", "Inactive"}


def test_staff_cannot_open_client_outside_their_programs():
    with role_client("staff", ["Housing"]) as client:
        housed = _insert_person("Housed", ["Housing"])
        student = _insert_person("Student", ["Education"])
        inactive = _insert_person("Inactive", ["Housing"], active=False)

        assert client.get(f"/people/{housed}").status_code == 200
        assert client.get(f"/people/{student}").status_code == 403
        assert client.get(f"/people/{inactive}").status_code == 403


def test_staff_cannot_read_or_write_casenotes_outside_their_programs():
    with role_client("staff", ["Housing"]) as client:
        student = _insert_person("Student", ["Education"])
        for path in (f"/people/{student}/casenotes", f"/people/{student}/casenotes/dates"):
            assert client.get(path).status_code == 403
        resp = client.post(
            f"/people/{student}/casenotes", json={"date": "2025-01-01", "content": "x"}
        )
        assert resp.status_code == 403
        note_id = str(ObjectId())
        resp = client.put(f"/people/{student}/casenotes/{note_id}", json={"content": "x"})
        assert resp.status_code == 403


def test_staff_only_see_casenotes_from_their_programs():
    with role_client("staff", ["Housing"]) as client:
        pid = _insert_person("Both", ["Housing", "Education"])
        _insert_casenote(pid, "Housing", "housing note")
        _insert_casenote(pid, "Education", "education note")
        db.casenotes.insert_one(
            {"personid": ObjectId(pid), "date": "2025-01-02", "content": "general note"}
        )
        contents = {n["content"] for n in client.get(f"/people/{pid}/casenotes").json}
        assert contents == {"housing note", "general note"}

        # Staff cannot file a note under a program they don't belong to
        resp = client.post(
            f"/people/{pid}/casenotes",
            json={"date": "2025-01-01", "content": "x", "program": "Education"},
        )
        assert resp.status_code == 403


def test_staff_cannot_create_or_move_clients_into_other_programs():
    with role_client("staff", ["Housing"]) as client:
        resp = client.post(
            "/people", json={"firstname": "New", "lastname": "Client", "programs": ["Education"]}
        )
        assert resp.status_code == 403
        resp = client.post(
            "/people", json={"firstname": "New", "lastname": "Client", "programs": ["Housing"]}
        )
        assert resp.status_code == 201
        pid = resp.json["_id"]

        resp = client.put(
            f"/people/{pid}",
            json={"firstname": "New", "lastname": "Client", "programs": ["Housing", "Education"]},
        )
        assert resp.status_code == 403
        resp = client.put(
            f"/people/{pid}",
            json={
                "firstname": "New",
                "lastname": "Client",
                "programs": ["Housing"],
                "active": False,
            },
        )
        assert resp.status_code == 403
        resp = client.put(
            f"/people/{pid}",
            json={"firstname": "Renamed", "lastname": "Client", "programs": ["Housing"]},
        )
        assert resp.status_code == 200

        student = _insert_person("Student", ["Education"])
        resp = client.put(
            f"/people/{student}",
            json={"firstname": "Student", "lastname": "Client", "programs": ["Education"]},
        )
        assert resp.status_code == 403


def test_staff_cannot_update_milestones_outside_their_programs():
    with role_client("staff", ["Housing"]) as client:
        pid = _insert_person("Both", ["Housing", "Education"])
        resp = client.put(
            f"/people/{pid}/milestones",
            json={"program": "Education", "type": "general", "milestone": "A"},
        )
        assert resp.status_code == 403
        resp = client.put(
            f"/people/{pid}/milestones",
            json={"program": "Housing", "type": "general", "milestone": "shelter"},
        )
        assert resp.status_code == 200


def test_staff_role_refused_admin_actions():
    with role_client("staff", ["Housing"]) as client:
        pid = _insert_person("Housed", ["Housing"])
        refused = [
            client.get("/people/export"),
            client.patch(f"/people/{pid}/active", json={"active": False}),
            client.delete(f"/people/{pid}"),
            client.get("/staff"),
            client.get("/programs"),
            client.get("/audit"),
        ]
        assert [r.status_code for r in refused] == [403] * len(refused)
        assert db.people.find_one({"_id": ObjectId(pid)})["active"] is True


def test_admin_role_refused_super_admin_actions():
    with role_client("admin") as client:
        pid = _insert_person("Housed", ["Housing"])
        staff_id = str(db.staff.find_one({"role": "super-admin"})["_id"])
        refused = [
            client.delete(f"/people/{pid}"),
            client.get("/staff"),
            client.get(f"/staff/{staff_id}"),
            client.post("/staff", json={}),
            client.put(f"/staff/{staff_id}", json={}),
            client.patch(f"/staff/{staff_id}/active", json={"active": False}),
            client.get("/programs"),
            client.post("/programs", json={"name": "Art"}),
            client.put("/programs", json={"name": "Housing"}),
            client.delete("/programs?name=Housing"),
            client.get("/audit"),
        ]
        assert [r.status_code for r in refused] == [403] * len(refused)

        # but admins can deactivate clients
        assert client.patch(f"/people/{pid}/active", json={"active": False}).status_code == 200


def test_super_admin_cannot_edit_another_super_admin():
    with auth_client() as client:
        other = db.staff.insert_one(
            {
                "email": "other@test.com",
                "firstname": "Other",
                "lastname": "Admin",
                "role": "super-admin",
                "active": True,
            }
        ).inserted_id
        resp = client.put(
            f"/staff/{other}",
            json={
                "firstname": "Hacked",
                "lastname": "Admin",
                "role": "staff",
                "email": "other@test.com",
            },
        )
        assert resp.status_code == 403
        assert db.staff.find_one({"_id": other})["role"] == "super-admin"


def test_calendar_events_are_private_to_their_creator():
    with role_client("staff", ["Housing"]) as client:
        other_staff = str(ObjectId())
        event_id = db.calendar_events.insert_one(
            {"title": "Private", "time": "09:00", "date": "2025-01-01", "createdBy": other_staff}
        ).inserted_id
        assert client.get("/calendar-events").json == []
        assert client.get(f"/calendar-events/{event_id}").status_code == 404
        body = {"title": "Edited", "time": "10:00", "date": "2025-01-01"}
        assert client.put(f"/calendar-events/{event_id}", json=body).status_code == 404
        assert client.delete(f"/calendar-events/{event_id}").status_code == 404
        assert db.calendar_events.find_one({"_id": event_id})["title"] == "Private"
