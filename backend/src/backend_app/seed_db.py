import random

from faker import Faker
from flask import Flask

from backend_app.auth_init import bcrypt
from backend_app.db import db
from backend_app.intake_form import GENDER_OPTIONS

NUM_PEOPLE = 500
NOTES_PER_PERSON = 50
PROGRAMS = ["Housing", "Education", "Employment", "Drug Rehabilitation"]
# we can have multiple goal types but including general only for now for simplicity
GENERAL_MILESTONES = {
    "Housing": ["homeless", "shelter", "transitional", "permanent"],
    "Education": ["F", "D", "C", "B", "A"],
    "Employment": ["unemployed", "search", "interview", "hired", "stable"],
    "Drug Rehabilitation": ["7", "30", "90", "180", "360"],
}
NUM_STAFF = 25

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
            "milestoneTree": {"general": GENERAL_MILESTONES.get(program_name, [])},
            "description": faker.sentence(nb_words=10),
        }
        db.programs.insert_one(program)

    db.staff.insert_one(
        {
            "firstname": faker.first_name(),
            "lastname": faker.last_name(),
            "role": "super-admin",
            "phone": faker.numerify(text="+1$#########"),
            "email": "admin@auntleah.org",
            "passwordHash": hash_pwd("password"),
            "mfaEnabled": False,
            "active": True,
        }
    )

    db.staff.insert_one(
        {
            "firstname": "Gregor",
            "lastname": "Kiczales",
            "role": "admin",
            "phone": faker.numerify(text="+1$#########"),
            "email": "gkiczales@auntleah.org",
            "passwordHash": hash_pwd("trustTheNaturalRecursion"),
            "mfaEnabled": False,
            "active": True,
        }
    )

    db.staff.insert_one(
        {
            "firstname": faker.first_name(),
            "lastname": faker.last_name(),
            "role": "staff",
            "phone": faker.numerify(text="+1$#########"),
            "email": "caseworker@auntleah.org",
            "passwordHash": hash_pwd("12345"),
            "programs": ["Education", "Housing"],
            "mfaEnabled": False,
            "active": True,
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
            "mfaEnabled": False,
            "active": True,
        }
        db.staff.insert_one(staff_member)

    db.staff.create_index("email", unique=True)  # 404 :)

    for _ in range(NUM_PEOPLE):
        enrolled_programs = random.sample(PROGRAMS, k=random.randint(1, 3))
        programMilestones = {}
        for enrolled_program in enrolled_programs:
            programMilestones[enrolled_program] = {
                "general": {
                    "value": random.choice(GENERAL_MILESTONES[enrolled_program]),
                    "lastUpdateDate": faker.date_between(
                        start_date="-30d", end_date="now"
                    ).strftime("%Y-%m-%d"),
                    "startDate": faker.date_between(start_date="-60d", end_date="-30d").strftime(
                        "%Y-%m-%d"
                    ),
                }
            }
        person = {
            "firstname": faker.first_name(),
            "lastname": faker.last_name(),
            "dob": faker.date_of_birth(minimum_age=18, maximum_age=60).strftime("%Y-%m-%d"),
            "gender": random.choice(GENDER_OPTIONS),
            "programs": enrolled_programs,
            "active": random.random() < 0.9,
            "phone": faker.numerify(text="+1$#########"),
            "housing": {"address": {"city": "Vancouver", "province": "BC"}},
            "email": faker.free_email(),
            "referral": {
                "referralDate": faker.date_between(start_date="-5y", end_date="now").strftime(
                    "%Y-%m-%d"
                )
            },
            "programMilestones": programMilestones,
        }

        res = db.people.insert_one(person)
        person_id = res.inserted_id

        case_notes = []
        for _ in range(random.randint(1, NOTES_PER_PERSON)):
            case_note = {
                "personid": person_id,
                "date": faker.date_between(start_date="-90d", end_date="now").strftime("%Y-%m-%d"),
                "content": faker.paragraph(nb_sentences=5),
                "program": random.choice(PROGRAMS),
                "author": f"{faker.first_name()} {faker.last_name()}",
                "lastUpdatedBy": f"{faker.first_name()} {faker.last_name()}",
            }
            case_notes.append(case_note)

        db.casenotes.insert_many(case_notes)


if __name__ == "__main__":
    seed_db()
