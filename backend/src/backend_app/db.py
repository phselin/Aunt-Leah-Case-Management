from __future__ import annotations

from urllib.parse import urlparse

from pymongo import MongoClient
from pymongo.errors import ConnectionFailure

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
        try:
            import mongomock  # type: ignore
        except ImportError as err:
            raise ImportError("mongomock is required") from err

        global _MONGO_MOCK_CLIENT
        if _MONGO_MOCK_CLIENT is None:
            _MONGO_MOCK_CLIENT = mongomock.MongoClient()
        return _MONGO_MOCK_CLIENT  # type: ignore
    return MongoClient(settings.mongo_uri, serverSelectionTimeoutMS=1500)


client = get_mongo_client()
db = client[_db_name_from_uri(settings.mongo_uri)]


def ping_mongo() -> bool:
    try:
        client.admin.command("ping")
        return True
    except (ConnectionFailure, Exception):
        return False
