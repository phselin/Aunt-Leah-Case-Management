from test_utils import auth_client, unauth_client

from backend_app.db import db


def test_get_stats():
    with unauth_client() as client:
        response = client.get("/stats")
        assert response.status_code == 401
    with auth_client() as client:
        response = client.get("/stats")
        assert response.status_code == 200

        assert "kpis" in response.json
        assert response.json["kpis"]["totalParticipants"] == db.people.count_documents({})

        assert len(response.json) == db.programs.count_documents({}) + 2

        for program_name, program_data in response.json.items():
            if program_name in ("clients", "kpis"):
                continue
            dbMilestoneTrees = db.programs.find_one({"name": program_name})["milestoneTree"]
            for MT_name, milestoneTree_data in program_data.items():
                existingMilestones = dbMilestoneTrees[MT_name]
                for row in milestoneTree_data:
                    milestone = row["milestone"]
                    count = row["value"]
                    assert milestone in existingMilestones
                    assert count == db.people.count_documents(
                        {
                            f"programMilestones.{program_name}.{MT_name}.value": milestone,
                        }
                    )

        for program_name, client_count in response.json.get("clients").items():
            if program_name == "total":
                assert client_count == db.people.count_documents({})
            else:
                assert client_count == db.people.count_documents({"programs": program_name})
