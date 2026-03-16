from test_utils import auth_client, unauth_client

from backend_app.db import db


def test_get_stats():
    with unauth_client() as client:
        response = client.get("/stats")
        assert response.status_code == 401
    with auth_client() as client:
        response = client.get("/stats")
        assert response.status_code == 200

        # Check that we return all programs in the database plus client counts
        assert len(response.json) == db.programs.count_documents({}) + 1

        # Iterate through programs and ignore client counts
        for program_name, program_data in list(response.json.items())[:-1]:
            dbMilestoneTrees = db.programs.find_one({"name": program_name})["milestoneTree"]
            for MT_name, milestoneTree_data in program_data.items():
                existingMilestones = dbMilestoneTrees[MT_name]
                for milestone, count in milestoneTree_data.values():
                    assert existingMilestones.contains(milestone)
                    assert count == db.people.count_documents(
                        {f"status.{program_name}.{MT_name}": milestone}
                    )

        # Finally, check client counts
        for program_name, client_count in response.json.get("clients").items():
            assert client_count == db.people.count_documents({"programs": program_name})
