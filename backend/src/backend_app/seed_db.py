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
    "Drug Rehabilitation": [7, 30, 90, 180, 360],
}
NUM_STAFF = 50

faker = Faker()


def seed_db():
    if db.people.count_documents({}) > 0:
        return

    app = Flask(__name__)
    bcrypt.init_app(app)

    with app.app_context():
        admin_hash_pwd = bcrypt.generate_password_hash("password").decode("utf-8")

    db.programs.delete_many({})
    db.staff.delete_many({})
    db.people.delete_many({})
    db.goals.delete_many({})
    db.casenotes.delete_many({})

    for program_name in PROGRAMS:
        program = {
            "name": program_name,
            "goalTypes": {
                "type": "general",
                "milestones": GENERAL_MILESTONES.get(program_name, []),
            },
        }
        db.programs.insert_one(program)

    db.staff.insert_one(
        {
            "firstname": faker.first_name(),
            "lastname": faker.last_name(),
            "role": "admin",
            "phone": faker.numerify(text="###-###-####"),
            "email": "admin@auntleah.org",
            "password_hash": admin_hash_pwd,
        }
    )

    for _ in range(NUM_STAFF):
        staff_member = {
            "firstname": faker.first_name(),
            "lastname": faker.last_name(),
            "role": "staff",
            "phone": faker.numerify(text="###-###-####"),
            "email": faker.free_email(),
            "programs": random.sample(PROGRAMS, k=random.randint(1, 2)),
        }
        db.staff.insert_one(staff_member)

    for _ in range(NUM_PEOPLE):
        enrolled_programs = random.sample(PROGRAMS, k=random.randint(1, 3))
        person = {
            "firstname": faker.first_name(),
            "lastname": faker.last_name(),
            "dob": faker.date_of_birth(minimum_age=18, maximum_age=60).strftime("%Y-%m-%d"),
            "gender": random.choice(["male", "female", "non-binary", "prefer not to say"]),
            "programs": enrolled_programs,
            "phone": faker.numerify(text="###-###-####"),
            "address": faker.address(),
            "email": faker.free_email(),
            "referraldate": faker.date_between(start_date="-5y", end_date="now").strftime("%Y-%m-%d")
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
        for _ in range(random.randint(1, NOTES_PER_PERSON)):
            case_note = {
                "personid": person_id,
                "goalid": random.choice(goal_ids),
                "date": faker.date_between(start_date="-5y", end_date="now").strftime("%Y-%m-%d"),
                "note": faker.paragraph(nb_sentences=5),
            }
            case_notes.append(case_note)

        db.casenotes.insert_many(case_notes)


if __name__ == "__main__":
    seed_db()
