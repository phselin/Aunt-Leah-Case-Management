import random

from faker import Faker
from flask import Flask

from backend_app.auth_init import bcrypt
from backend_app.db import db

NUM_PEOPLE = 1000
NOTES_PER_PERSON = 20
PROGRAMS = ["Housing", "Education", "Employment", "Drug Rehabilitation"]
# we can have multiple goal types but including general only for now for simplicity
GENERAL_MILESTONES = {
    "Housing": ["homeless", "shelter", "transitional", "permanent"],
    "Education": ["F", "D", "C", "B", "A"],
    "Employment": ["unemployed", "search", "interview", "hired", "stable"],
    "Drug Rehabilitation": ["7", "30", "90", "180", "360"],
}
NUM_STAFF = 50

faker = Faker("en_CA")


def seed_db():
    if db.people.count_documents({}) > 0:
        return

    app = Flask(__name__)
    bcrypt.init_app(app)

    with app.app_context():

        def hash_pwd(pwd):
            return bcrypt.generate_password_hash(pwd).decode("utf-8")

    db.programs.delete_many({})
    db.staff.delete_many({})
    db.people.delete_many({})
    db.goals.delete_many({})
    db.casenotes.delete_many({})

    for program_name in PROGRAMS:
        program = {
            "name": program_name,
            "goalTypes": {"general": GENERAL_MILESTONES.get(program_name, [])},
        }
        db.programs.insert_one(program)

    db.staff.insert_one(
        {
            "firstname": faker.first_name(),
            "lastname": faker.last_name(),
            "role": "admin",
            "phone": faker.numerify(text="+1$#########"),
            "email": "admin@auntleah.org",
            "password_hash": hash_pwd("password"),
        }
    )

    db.staff.insert_one(
        {
            "firstname": "Gregor",
            "lastname": "Kiczales",
            "role": "admin",
            "phone": faker.numerify(text="+1$#########"),
            "email": "GKiczales@auntleah.org",
            "password_hash": hash_pwd("trustTheNaturalRecursion"),
        }
    )

    for _ in range(NUM_STAFF):
        staff_member = {
            "firstname": faker.first_name(),
            "lastname": faker.last_name(),
            "role": "staff",
            "phone": faker.numerify(text="+1$#########"),
            "email": faker.free_email(),
            "programs": random.sample(PROGRAMS, k=random.randint(1, 2)),
        }
        db.staff.insert_one(staff_member)

    for _ in range(NUM_PEOPLE):
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

        case_notes = []
        for _ in range(random.randint(1, NOTES_PER_PERSON)):
            case_note = {
                "personid": person_id,
                "date": faker.date_between(start_date="-30d", end_date="now").strftime("%Y-%m-%d"),
                "content": faker.paragraph(nb_sentences=5),
            }
            case_notes.append(case_note)

        db.casenotes.insert_many(case_notes)


if __name__ == "__main__":
    seed_db()
