from test_utils import auth_client, seed_programs, seeded_client


def test_person_workflow():
    with auth_client() as client:
        seed_programs()
        resp = client.post(
            "/people",
            json={
                "firstname": "John",
                "lastname": "Doe",
                "programs": ["Housing"],
                "status": {"Housing": {"general": "homeless"}},
            },
        )
        assert resp.status_code == 201
        pid = resp.json["_id"]

        resp = client.get(f"/people/{pid}")
        assert resp.status_code == 200
        assert resp.json["firstname"] == "John"

        resp = client.put(
            f"/people/{pid}",
            json={
                "firstname": "Jane",
                "lastname": "Doe",
                "programs": ["Housing"],
                "status": {"Housing": {"general": "homeless"}},
            },
        )
        assert resp.status_code == 200
        assert resp.json["firstname"] == "Jane"

        resp = client.put(
            f"/people/{pid}/milestones",
            json={"milestones": {"Housing": "shelter"}},
        )
        assert resp.status_code == 200
        assert resp.json["status"]["Housing"]["general"] == "shelter"

        resp = client.post(
            "/casenotes",
            json={"personid": pid, "date": "2025-03-15", "content": "Moved to shelter"},
        )
        assert resp.status_code == 200

        resp = client.get(f"/casenotes?person={pid}")
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
        resp = client.post(
            "/people",
            json={
                "firstname": "John",
                "lastname": "Doe",
                "programs": ["Housing"],
                "status": {"Housing": {"general": "homeless"}},
            },
        )
        pid = resp.json["_id"]

        stats_before = client.get("/stats").json
        homeless_before = next(
            m["value"] for m in stats_before["Housing"]["general"] if m["milestone"] == "homeless"
        )
        shelter_before = next(
            m["value"] for m in stats_before["Housing"]["general"] if m["milestone"] == "shelter"
        )

        client.put(f"/people/{pid}/milestones", json={"milestones": {"Housing": "shelter"}})

        stats_after = client.get("/stats").json
        homeless_after = next(
            m["value"] for m in stats_after["Housing"]["general"] if m["milestone"] == "homeless"
        )
        shelter_after = next(
            m["value"] for m in stats_after["Housing"]["general"] if m["milestone"] == "shelter"
        )

        assert homeless_after == homeless_before - 1
        assert shelter_after == shelter_before + 1
