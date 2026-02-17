from backend_app.db import get_examples_collection, get_mongo_client
from backend_app.flask_app import create_flask_app


def _reset_examples() -> None:
    client = get_mongo_client()
    try:
        get_examples_collection(client).delete_many({})
    finally:
        client.close()


def test_example_get_route():
    _reset_examples()
    client = get_mongo_client()
    try:
        get_examples_collection(client).insert_one({"message": "Hello, World!"})
    finally:
        client.close()

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

    mongo = get_mongo_client()
    try:
        assert get_examples_collection(mongo).count_documents({}) == 1
    finally:
        mongo.close()


def test_example_patch_route():
    _reset_examples()
    client = create_flask_app().test_client()
    client.post("/example", json={"message": "First"})
    resp = client.patch("/example", json={"message": "Hello, World!"})
    assert resp.status_code == 200
    assert resp.json["status"] == "ok"
    assert resp.json["framework"] == "flask"
    assert resp.json["message"] == "Hello, World!"

    mongo = get_mongo_client()
    try:
        doc = get_examples_collection(mongo).find_one(sort=[("_id", -1)])
        assert doc is not None
        assert doc["message"] == "Hello, World!"
    finally:
        mongo.close()


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

    mongo = get_mongo_client()
    try:
        assert get_examples_collection(mongo).count_documents({}) == 0
    finally:
        mongo.close()
