from test_utils import auth_client, seed_programs, unauth_client

from backend_app.db import db


def test_programs_unauthenticated():
    with unauth_client() as client:
        assert client.get("/programs").status_code == 401
        assert client.get("/programs/names").status_code == 401
        assert client.post("/programs", json={"name": "Art"}).status_code == 401


def test_program_names_and_structure():
    with auth_client() as client:
        seed_programs()
        assert sorted(client.get("/programs/names").json) == [
            "Drug Rehabilitation",
            "Education",
            "Employment",
            "Housing",
        ]
        structure = client.get("/programs/structure").json
        assert structure["Education"]["general"] == ["F", "D", "C", "B", "A"]
        assert len(client.get("/programs").json) == 4


def test_create_program():
    with auth_client() as client:
        resp = client.post(
            "/programs",
            json={
                "name": "life skills",
                "description": "Budgeting and cooking",
                "milestoneTree": {"General": ["Started", "Halfway", "Done"]},
            },
        )
        assert resp.status_code == 201
        assert resp.json["name"] == "Life Skills"
        assert resp.json["milestoneTree"] == {"general": ["started", "halfway", "done"]}

        resp = client.post("/programs", json={"name": "Life Skills", "milestoneTree": {}})
        assert resp.status_code == 409

        # New program is immediately usable by the intake form
        resp = client.post(
            "/people",
            json={"firstname": "Jo", "lastname": "Doe", "programs": ["Life Skills"]},
        )
        assert resp.status_code == 201


def test_create_program_validation():
    with auth_client() as client:
        bad_bodies = [
            {},
            {"name": "Art123", "milestoneTree": {}},
            {"name": "Art", "milestoneTree": {"general": "notalist"}},
            {"name": "Art", "milestoneTree": {"general": ["a", "A"]}},
            {"name": "Art", "milestoneTree": {"general": ["ok"], "General": ["ok"]}},
            {"name": "Art", "milestoneTree": {"gen-eral": ["ok"]}},
            {"name": "Art", "milestoneTree": {"general": ["step 1"]}},
        ]
        for body in bad_bodies:
            assert client.post("/programs", json=body).status_code == 400, body
        assert db.programs.count_documents({}) == 0


def test_edit_program_cleans_up_removed_milestones():
    with auth_client() as client:
        seed_programs()
        db.people.insert_many(
            [
                {
                    "firstname": "A",
                    "programs": ["Housing"],
                    "programMilestones": {"Housing": {"general": {"value": "shelter"}}},
                },
                {
                    "firstname": "B",
                    "programs": ["Housing"],
                    "programMilestones": {
                        "Housing": {"general": {"value": "permanent"}, "extra": {"value": "x"}}
                    },
                },
            ]
        )
        db.programs.update_one({"name": "Housing"}, {"$set": {"milestoneTree.extra": ["x"]}})

        resp = client.put(
            "/programs",
            json={
                "name": "housing",
                "description": "Updated",
                "milestoneTree": {"general": ["homeless", "transitional", "permanent"]},
            },
        )
        assert resp.status_code == 200
        assert resp.json["description"] == "Updated"

        a = db.people.find_one({"firstname": "A"})
        b = db.people.find_one({"firstname": "B"})
        assert "general" not in a["programMilestones"]["Housing"]  # "shelter" was removed
        assert b["programMilestones"]["Housing"] == {"general": {"value": "permanent"}}


def test_edit_program_errors():
    with auth_client() as client:
        seed_programs()
        assert client.put("/programs", json={}).status_code == 400
        resp = client.put("/programs", json={"name": "Nope", "milestoneTree": {"g": ["a"]}})
        assert resp.status_code == 404
        resp = client.put("/programs", json={"name": "Housing", "milestoneTree": {"g": ["1"]}})
        assert resp.status_code == 400


def test_delete_program_removes_it_everywhere():
    with auth_client() as client:
        seed_programs()
        pid = db.people.insert_one(
            {
                "firstname": "A",
                "programs": ["Housing", "Education"],
                "programMilestones": {"Housing": {"general": {"value": "shelter"}}},
            }
        ).inserted_id
        db.casenotes.insert_one({"personid": pid, "program": "Housing", "content": "x"})
        db.staff.insert_one({"email": "s@t.com", "role": "staff", "programs": ["Housing"]})

        assert client.delete("/programs").status_code == 400
        assert client.delete("/programs?name=Nope").status_code == 400

        resp = client.delete("/programs?name=housing")
        assert resp.status_code == 200
        assert db.programs.find_one({"name": "Housing"}) is None
        person = db.people.find_one({"_id": pid})
        assert person["programs"] == ["Education"]
        assert "Housing" not in person.get("programMilestones", {})
        assert "program" not in db.casenotes.find_one({"personid": pid})
        assert db.staff.find_one({"email": "s@t.com"})["programs"] == []
