"""Pytest hooks for the backend test suite."""

from __future__ import annotations


def pytest_configure(config) -> None:
    """Fail fast when deps are missing (e.g. system Python without backend venv)."""
    missing: list[str] = []
    for name in ("pymongo", "pyotp", "flask"):
        try:
            __import__(name)
        except ImportError:
            missing.append(name)
    if not missing:
        return
    import pytest

    pytest.exit(
        "\nMissing Python packages: " + ", ".join(missing) + ".\n\n"
        "Install backend dependencies, then run pytest from the backend directory:\n"
        "  cd backend && make install\n"
        "  MONGO_URI=mongomock://localhost/auntleah PYTHONPATH=src .venv/bin/pytest -q\n\n"
        "Or run tests via Docker (recommended):\n"
        "  make test\n",
        returncode=4,
    )
