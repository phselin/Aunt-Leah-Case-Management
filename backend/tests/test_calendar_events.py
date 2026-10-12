from bson import ObjectId
from test_utils import auth_client, unauth_client


def test_calendar_unauthenticated():
    with unauth_client() as client:
        assert client.get("/calendar-events").status_code == 401
        assert client.post("/calendar-events", json={}).status_code == 401


def test_calendar_event_crud():
    with auth_client() as client:
        resp = client.post(
            "/calendar-events",
            json={
                "clientName": "Jane Doe",
                "startTime": "09:00",
                "endTime": "10:00",
                "date": "2025-05-01",
                "type": "Meeting",
                "location": "Seymour",
                "notes": "  bring forms  ",
            },
        )
        assert resp.status_code == 201
        event_id = resp.json["_id"]
        assert resp.json["notes"] == "bring forms"

        client.post(
            "/calendar-events", json={"title": "Check-in", "time": "13:00", "date": "2025-05-02"}
        )

        assert len(client.get("/calendar-events").json) == 2
        day = client.get("/calendar-events?date=2025-05-01").json
        assert [e["clientName"] for e in day] == ["Jane Doe"]
        assert client.get("/calendar-events?date=May 1").status_code == 400

        assert client.get(f"/calendar-events/{event_id}").json["location"] == "Seymour"

        resp = client.put(
            f"/calendar-events/{event_id}",
            json={"title": "Moved", "time": "11:00", "date": "2025-05-03"},
        )
        assert resp.status_code == 200
        assert resp.json["date"] == "2025-05-03"

        assert client.delete(f"/calendar-events/{event_id}").status_code == 200
        assert client.get(f"/calendar-events/{event_id}").status_code == 404


def test_calendar_event_validation():
    with auth_client() as client:
        bad_bodies = [
            {},
            {"title": "No time", "date": "2025-05-01"},
            {"title": "T", "time": "09:00"},
            {"title": "T", "time": "09:00", "date": "2025-13-01"},
            {"title": "T", "time": "09:00", "date": "2025-05-01", "notes": 5},
        ]
        for body in bad_bodies:
            resp = client.post("/calendar-events", json=body)
            assert resp.status_code == 400, body
            assert "errors" in resp.json

        eid = client.post(
            "/calendar-events", json={"title": "T", "time": "09:00", "date": "2025-05-01"}
        ).json["_id"]
        assert client.put(f"/calendar-events/{eid}", json={}).status_code == 400


def test_calendar_event_bad_ids():
    with auth_client() as client:
        body = {"title": "T", "time": "09:00", "date": "2025-05-01"}
        assert client.get("/calendar-events/bad").status_code == 400
        assert client.put("/calendar-events/bad", json=body).status_code == 400
        assert client.delete("/calendar-events/bad").status_code == 400
        missing = str(ObjectId())
        assert client.put(f"/calendar-events/{missing}", json=body).status_code == 404
        assert client.delete(f"/calendar-events/{missing}").status_code == 404
