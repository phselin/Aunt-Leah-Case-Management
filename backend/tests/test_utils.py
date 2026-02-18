from contextlib import contextmanager

from backend_app.auth_init import bcrypt
from backend_app.db import db
from backend_app.flask_app import create_flask_app


def reset_db():
    db.programs.delete_many({})
    db.staff.delete_many({})
    db.people.delete_many({})
    db.goals.delete_many({})
    db.casenotes.delete_many({})
    db.examples.delete_many({})


@contextmanager
def auth_client():
    reset_db()
    app = create_flask_app()

    with app.app_context():
        db.staff.insert_one(
            {
                "email": "admin@test.com",
                "password_hash": bcrypt.generate_password_hash("test").decode("utf-8"),
                "firstname": "Test",
                "lastname": "Admin",
                "role": "admin",
            }
        )

    client = app.test_client()

    response = client.post("/login", json={"email": "admin@test.com", "password": "test"})

    assert response.status_code == 200, "Test setup failed"

    yield client

    client.post("/logout")
    reset_db()


@contextmanager
def unauth_client():
    reset_db()
    app = create_flask_app()
    client = app.test_client()
    yield client
    reset_db()
