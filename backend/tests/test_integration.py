from test_utils import auth_client, seed_programs, seeded_client


def _housing_person_json(firstname: str, lastname: str):
    return {
        "firstname": firstname,
        "lastname": lastname,
        "programs": ["Housing"],
        "programMilestones": {"Housing": {"general": {"value": "homeless"}}},
    }


def test_person_workflow():
    with auth_client() as client:
        seed_programs()
        resp = client.post("/people", json=_housing_person_json("John", "Doe"))
        assert resp.status_code == 201
        pid = resp.json["_id"]

        resp = client.get(f"/people/{pid}")
        assert resp.status_code == 200
        assert resp.json["firstname"] == "John"

        resp = client.put(
            f"/people/{pid}",
            json=_housing_person_json("Jane", "Doe"),
        )
        assert resp.status_code == 200
        assert resp.json["firstname"] == "Jane"

        resp = client.put(
            f"/people/{pid}/milestones",
            json={"program": "Housing", "type": "general", "milestone": "shelter"},
        )
        assert resp.status_code == 200
        assert resp.json["programMilestones"]["Housing"]["general"]["value"] == "shelter"

        resp = client.post(
            f"/people/{pid}/casenotes",
            json={"date": "2025-03-15", "content": "Moved to shelter"},
        )
        assert resp.status_code == 201

        resp = client.get(f"/people/{pid}/casenotes")
        assert resp.status_code == 200
        assert len(resp.json) == 1

        resp = client.get("/clients?client=Jane Doe")
        assert resp.status_code == 200
        assert len(resp.json) == 1

        resp = client.delete(f"/people/{pid}")
        assert resp.status_code == 200
        resp = client.get(f"/people/{pid}")
        assert resp.status_code == 404


def test_stats_change_on_milestone_updates():
    with seeded_client(num_people=50) as client:
        resp = client.post("/people", json=_housing_person_json("John", "Doe"))
        pid = resp.json["_id"]

        stats_before = client.get("/stats").json
        homeless_before = next(
            m["value"] for m in stats_before["Housing"]["general"] if m["milestone"] == "homeless"
        )
        shelter_before = next(
            m["value"] for m in stats_before["Housing"]["general"] if m["milestone"] == "shelter"
        )

        client.put(
            f"/people/{pid}/milestones",
            json={"program": "Housing", "type": "general", "milestone": "shelter"},
        )

        stats_after = client.get("/stats").json
        homeless_after = next(
            m["value"] for m in stats_after["Housing"]["general"] if m["milestone"] == "homeless"
        )
        shelter_after = next(
            m["value"] for m in stats_after["Housing"]["general"] if m["milestone"] == "shelter"
        )

        assert homeless_after == homeless_before - 1
        assert shelter_after == shelter_before + 1
