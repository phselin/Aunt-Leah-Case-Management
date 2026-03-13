import random
from contextlib import contextmanager

from faker import Faker

from backend_app.auth_init import bcrypt
from backend_app.db import db
from backend_app.flask_app import create_flask_app

faker = Faker("en_CA")

PROGRAMS = ["Housing", "Education", "Employment", "Drug Rehabilitation"]
GENERAL_MILESTONES = {
    "Housing": ["homeless", "shelter", "transitional", "permanent"],
    "Education": ["F", "D", "C", "B", "A"],
    "Employment": ["unemployed", "search", "interview", "hired", "stable"],
    "Drug Rehabilitation": ["7", "30", "90", "180", "360"],
}

ADMIN_EMAIL = "admin@test.com"
ADMIN_PASSWORD = "test"


def reset_db():
    db.programs.delete_many({})
    db.staff.delete_many({})
    db.people.delete_many({})
    db.goals.delete_many({})
    db.casenotes.delete_many({})


def insert_admin(app):
    with app.app_context():
        db.staff.insert_one(
            {
                "email": ADMIN_EMAIL,
                "password_hash": bcrypt.generate_password_hash(ADMIN_PASSWORD).decode("utf-8"),
                "firstname": "Test",
                "lastname": "Admin",
                "role": "admin",
            }
        )


def seed_programs():
    for name in PROGRAMS:
        db.programs.insert_one({"name": name, "goalTypes": {"general": GENERAL_MILESTONES[name]}})


def seed_people(n=10):
    # from seed_db
    for _ in range(n):
        enrolled_programs = random.sample(PROGRAMS, k=random.randint(1, 3))
        status = {}
        for enrolled_program in enrolled_programs:
            status[enrolled_program] = {
                "general": random.choice(GENERAL_MILESTONES[enrolled_program])
            }
        person = {
            "firstname": faker.first_name(),
            "lastname": faker.last_name(),
            "dob": faker.date_of_birth(minimum_age=18, maximum_age=60).strftime("%Y-%m-%d"),
            "gender": random.choice(["male", "female", "non-binary", "prefer not to say"]),
            "programs": enrolled_programs,
            "phone": faker.numerify(text="+1$#########"),
            "address": faker.address(),
            "email": faker.free_email(),
            "referralDate": faker.date_between(start_date="-5y", end_date="now").strftime(
                "%Y-%m-%d"
            ),
            "status": status,
        }

        res = db.people.insert_one(person)
        person_id = res.inserted_id

        goal_ids = []
        for program_name in enrolled_programs:
            goal = {
                "personid": person_id,
                "program": program_name,
                "type": "general",
                "status": random.choice(GENERAL_MILESTONES.get(program_name, [])),
                "detail": faker.paragraph(nb_sentences=2),
                "due": faker.date_between(start_date="+30d", end_date="+3y").strftime("%Y-%m-%d"),
            }
            res = db.goals.insert_one(goal)
            goal_ids.append(res.inserted_id)

        case_notes = []
        for _ in range(random.randint(1, 5)):
            case_note = {
                "personid": person_id,
                "goalid": random.choice(goal_ids),
                "date": faker.date_between(start_date="-30d", end_date="now").strftime("%Y-%m-%d"),
                "content": faker.paragraph(nb_sentences=5),
            }
            case_notes.append(case_note)

        db.casenotes.insert_many(case_notes)


@contextmanager
def unauth_client():
    reset_db()
    app = create_flask_app()
    client = app.test_client()
    yield client
    reset_db()


@contextmanager
def auth_client():
    reset_db()
    app = create_flask_app()
    insert_admin(app)
    client = app.test_client()
    resp = client.post("/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert resp.status_code == 200
    yield client
    client.post("/logout")
    reset_db()


@contextmanager
def seeded_client(num_people=10):
    reset_db()
    app = create_flask_app()
    insert_admin(app)
    seed_programs()
    seed_people(num_people)
    client = app.test_client()
    resp = client.post("/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert resp.status_code == 200
    yield client
    client.post("/logout")
    reset_db()
