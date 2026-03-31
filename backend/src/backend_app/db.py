from __future__ import annotations

from urllib.parse import urlparse

import redis
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


class _InMemoryRedis:
    """Minimal Redis-like client for tests when using mongomock."""

    def __init__(self) -> None:
        self._store: dict[str, str] = {}

    def setex(self, name, time, value):  # type: ignore[override]
        # TTL is ignored for tests; we only need basic key/value behaviour.
        self._store[str(name)] = str(value)

    def get(self, name):  # type: ignore[override]
        return self._store.get(str(name))

    def delete(self, name):  # type: ignore[override]
        self._store.pop(str(name), None)


if settings.mongo_uri.startswith("mongomock://"):
    # When running tests against mongomock, use an in-memory Redis stub
    # so unit tests do not require an actual Redis instance.
    redis_client = _InMemoryRedis()
else:
    redis_client = redis.from_url(settings.redis_url, decode_responses=True)


def ping_mongo() -> bool:
    try:
        client.admin.command("ping")
        return True
    except (ConnectionFailure, Exception):
        return False
