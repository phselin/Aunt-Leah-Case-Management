from __future__ import annotations

from urllib.parse import urlparse

from pymongo import MongoClient
from pymongo.collection import Collection
from pymongo.database import Database

from backend_app.config import settings

_MONGO_MOCK_CLIENT: MongoClient | None = None


def _db_name_from_uri(uri: str) -> str:
    parsed = urlparse(uri)
    path = (parsed.path or "").lstrip("/")
    if not path:
        return "auntleah"
    return path.split("/")[0]


def get_mongo_client() -> MongoClient:
    # Allow running unit tests without a real MongoDB by using mongomock:
    #   MONGO_URI=mongomock://localhost/auntleah
    if settings.mongo_uri.startswith("mongomock://"):
        import mongomock  # type: ignore

        global _MONGO_MOCK_CLIENT
        if _MONGO_MOCK_CLIENT is None:
            _MONGO_MOCK_CLIENT = mongomock.MongoClient()
        return _MONGO_MOCK_CLIENT
    return MongoClient(settings.mongo_uri, serverSelectionTimeoutMS=1500)


def get_db(client: MongoClient) -> Database:
    return client[_db_name_from_uri(settings.mongo_uri)]


def get_examples_collection(client: MongoClient) -> Collection:
    return get_db(client)["examples"]


def ping_mongo() -> bool:
    client = get_mongo_client()
    try:
        client.admin.command("ping")
        return True
    finally:
        client.close()
