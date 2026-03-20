from test_utils import auth_client, seed_programs, seeded_client, unauth_client


def test_people_unauth():
    with unauth_client() as client:
        assert client.get("/people").status_code == 401
        assert client.post("/people").status_code == 401


def test_create_person():
    with auth_client() as client:
        seed_programs()
        resp = client.post(
            "/people",
            json={
                "firstname": "John",
                "lastname": "Doe",
                "programs": ["Housing", "Education"],
                "status": {"Housing": {"general": {"value": "homeless"}}},
            },
        )
        assert resp.status_code == 201
        data = resp.json
        assert data["firstname"] == "John"
        assert data["lastname"] == "Doe"
        assert data["programs"] == ["Housing", "Education"]
        assert "_id" in data


def test_create_person_missing_name():
    with auth_client() as client:
        resp = client.post("/people", json={"firstname": "John"})
        assert resp.status_code == 400
        resp = client.post("/people", json={"lastname": "Doe"})
        assert resp.status_code == 400


def test_create_person_invalid_program():
    with auth_client() as client:
        seed_programs()
        resp = client.post(
            "/people",
            json={"firstname": "John", "lastname": "Doe", "programs": ["InvalidProgram"]},
        )
        assert resp.status_code == 400


def test_create_person_invalid_status():
    with auth_client() as client:
        seed_programs()
        resp = client.post(
            "/people",
            json={
                "firstname": "John",
                "lastname": "Doe",
                "programs": ["Education"],
                "status": {"Housing": {"general": "homeless"}},
            },
        )
        assert resp.status_code == 400
        resp = client.post(
            "/people",
            json={
                "firstname": "John",
                "lastname": "Doe",
                "programs": ["Education"],
                "status": {"Education": {"general": "highschool"}},  # not a valid milestone
            },
        )
        assert resp.status_code == 400


def test_get_people_with_seeded_data():
    with seeded_client(num_people=10) as client:
        resp = client.get("/people")
        assert resp.status_code == 200
        assert len(resp.json) == 10


def test_get_people_search():
    with auth_client() as client:
        client.post("/people", json={"firstname": "John", "lastname": "Doe"})
        client.post("/people", json={"firstname": "Alice", "lastname": "Smith"})

        resp = client.get("/people?person=Alice")
        assert resp.status_code == 200
        assert len(resp.json) == 1
        assert resp.json[0]["firstname"] == "Alice"


def test_get_person_by_id():
    with auth_client() as client:
        resp = client.post("/people", json={"firstname": "Alice", "lastname": "Smith"})
        pid = resp.json["_id"]

        resp = client.get(f"/people/{pid}")
        assert resp.status_code == 200
        assert resp.json["firstname"] == "Alice"
        assert resp.json["lastname"] == "Smith"


def test_update_person():
    with auth_client() as client:
        resp = client.post("/people", json={"firstname": "Alice", "lastname": "Smith"})
        pid = resp.json["_id"]

        resp = client.put(f"/people/{pid}", json={"firstname": "Jane", "lastname": "Doe"})
        assert resp.status_code == 200
        assert resp.json["firstname"] == "Jane"
        assert resp.json["lastname"] == "Doe"


def test_delete_person():
    with auth_client() as client:
        resp = client.post("/people", json={"firstname": "John", "lastname": "Doe"})
        pid = resp.json["_id"]

        resp = client.delete(f"/people/{pid}")
        assert resp.status_code == 200

        resp = client.get(f"/people/{pid}")
        assert resp.status_code == 404


def test_update_milestones():
    with auth_client() as client:
        seed_programs()
        resp = client.post(
            "/people",
            json={
                "firstname": "John",
                "lastname": "Doe",
                "programs": ["Housing"],
                "status": {"Housing": {"general": {"value": "homeless"}}},
            },
        )
        pid = resp.json["_id"]

        resp = client.put(
            f"/people/{pid}/milestones",
            json={"program": "Housing", "type": "general", "milestone": "shelter"},
        )
        assert resp.status_code == 200
        assert resp.json["status"]["Housing"]["general"]["value"] == "shelter"
