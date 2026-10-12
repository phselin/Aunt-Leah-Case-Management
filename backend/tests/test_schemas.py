import pytest
from pydantic import ValidationError

from backend_app.schemas.person import Person

PROGRAMS = {"Housing": {"general": ["shelter", "permanent"]}}


def _validate(**fields):
    body = {"firstname": "jane", "lastname": "o'neil", **fields}
    return Person.model_validate(body, context={"valid_programs_structure": PROGRAMS})


def test_valid_person_is_normalized():
    person = _validate(
        email=" Jane@Example.COM ",
        phone="1 (604) 555-0100",
        gender="Female",
        pronouns="She/Her",
        preferredContactMethod="Text",
        programs=["Housing"],
        programMilestones={"Housing": {"general": {"value": "shelter"}}},
        housing={"preferredAuntLeahLocation": "Seymour", "status": "shelter"},
        referral={"connection": "New Referral"},
        intake={
            "background": {"personal": [{"value": "formerlyInCare", "details": "until 19"}]},
            "departmentSpecific": {"empAge15to30": "yes", "eduEnrolledInSchool": ""},
        },
    )
    assert person.firstname == "Jane"
    assert person.lastname == "O'Neil"
    assert person.email == "jane@example.com"
    assert person.phone == "+16045550100"
    assert person.intake.departmentSpecific.eduEnrolledInSchool is None


@pytest.mark.parametrize(
    "fields",
    [
        {"firstname": "   "},
        {"firstname": "A" * 21},
        {"lastname": "Doe3"},
        {"phone": "604-555-0100"},
        {"phone": "44 20 7946 0958"},
        {"gender": "unknown"},
        {"pronouns": "xe"},
        {"preferredContactMethod": "Fax"},
        {"email": "not-an-email"},
        {"programs": ["Art"]},
        {"housing": {"preferredAuntLeahLocation": "Moon"}},
        {"housing": {"status": "castle"}},
        {"referral": {"connection": "Cousin"}},
        {"intake": {"background": {"areasOfNeed": [{"value": "bogus"}]}}},
        {"intake": {"departmentReferral": {"housing": [{"value": "bogus"}]}}},
        {"intake": {"departmentSpecific": {"empAge15to30": "maybe"}}},
        {"programs": ["Housing"], "programMilestones": {"Housing": {"other": {"value": "x"}}}},
        {
            "programs": ["Housing"],
            "programMilestones": {"Housing": {"general": {"value": "mansion"}}},
        },
    ],
)
def test_invalid_person_rejected(fields):
    with pytest.raises(ValidationError):
        _validate(**fields)


def test_milestones_for_unenrolled_programs_are_dropped():
    person = _validate(programs=[], programMilestones={"Housing": {"general": {"value": "x"}}})
    assert person.programMilestones is None


def test_milestones_require_program_structure():
    with pytest.raises(ValidationError):
        Person.model_validate(
            {
                "firstname": "Jane",
                "lastname": "Doe",
                "programs": ["Housing"],
                "programMilestones": {"Housing": {"general": {"value": "shelter"}}},
            }
        )
