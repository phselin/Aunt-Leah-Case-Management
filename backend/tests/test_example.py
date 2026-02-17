from backend_app.db import db
from backend_app.flask_app import create_flask_app


def _reset_examples() -> None:
    db.examples.delete_many({})


def test_example_get_route():
    _reset_examples()
    db.examples.insert_one({"message": "Hello, World!"})
    client = create_flask_app().test_client()
    resp = client.get("/example")
    assert resp.status_code == 200
    assert resp.json["status"] == "ok"
    assert resp.json["framework"] == "flask"
    assert resp.json["message"] == "Hello, World!"


def test_example_post_route():
    _reset_examples()
    client = create_flask_app().test_client()
    resp = client.post("/example", json={"message": "Hello, World!"})
    assert resp.status_code == 200
    assert resp.json["status"] == "ok"
    assert resp.json["framework"] == "flask"
    assert resp.json["message"] == "Hello, World!"
    assert "id" in resp.json
    assert db.examples.count_documents({}) == 1


def test_example_patch_route():
    _reset_examples()
    client = create_flask_app().test_client()
    client.post("/example", json={"message": "First"})
    resp = client.patch("/example", json={"message": "Hello, World!"})
    assert resp.status_code == 200
    assert resp.json["status"] == "ok"
    assert resp.json["framework"] == "flask"
    assert resp.json["message"] == "Hello, World!"
    doc = db.examples.find_one(sort=[("_id", -1)])
    assert doc is not None
    assert doc["message"] == "Hello, World!"


def test_example_delete_route():
    _reset_examples()
    client = create_flask_app().test_client()
    client.post("/example", json={"message": "Hello, World!"})
    resp = client.delete("/example", json={"message": "Hello, World!"})
    assert resp.status_code == 200
    assert resp.json["status"] == "ok"
    assert resp.json["framework"] == "flask"
    assert resp.json["message"] == "Hello, World!"
    assert resp.json["deleted"] is True
    assert db.examples.count_documents({}) == 0
