from backend_app.intake_form_options import (
    BACKGROUND_AREAS_OF_NEED_OPTIONS,
    BACKGROUND_EXISTING_ID_OPTIONS,
    BACKGROUND_PERSONAL_OPTIONS,
    CONTACT_METHOD_OPTIONS,
    DEPT_REFERRAL_EDUCATION_OPTIONS,
    DEPT_REFERRAL_EMPLOYMENT_OPTIONS,
    DEPT_REFERRAL_HOUSING_OPTIONS,
    DEPT_REFERRAL_LIFE_SKILLS_OPTIONS,
    GENDER_OPTIONS,
    HOUSING_STATUS_OPTIONS,
    LOCATION_OPTIONS,
    REFERRAL_CONNECTION_OPTIONS,
    YES_NO_DROPDOWN,
)
from backend_app.routes.routes_utils import get_program_names


def get_participant_info():
    return {
        "label": "Participant Information",
        "type": "section",
        "fields": [
            {"key": "firstname", "label": "First Name", "type": "text", "required": True},
            {"key": "lastname", "label": "Last Name", "type": "text", "required": True},
            {"key": "dob", "label": "Birth Date", "type": "date"},
            {
                "key": "gender",
                "label": "Gender Identity",
                "type": "dropdown",
                "options": GENDER_OPTIONS,
            },
            {"key": "pronouns", "label": "Pronouns", "type": "text", "maxLength": 20},
            {"key": "phone", "label": "Phone Number", "type": "phone"},
            {"key": "email", "label": "Email Address", "type": "email"},
            {
                "key": "preferredContactMethod",
                "label": "Preferred Method of Contact",
                "type": "dropdown",
                "options": CONTACT_METHOD_OPTIONS,
            },
            {
                "key": "programs",
                "label": "Program Enrollment",
                "type": "multi-dropdown",
                "options": get_program_names(),
            },
        ],
    }


address_and_housing_info = {
    "key": "housing",
    "label": "Address & Housing",
    "type": "section",
    "layout": "housing_intake_pdf",
    "groups": [
        {
            "key": "address",
            "type": "group",
            "label": "Current Address & Postal Code (if applicable)",
            "fields": [
                {"key": "street", "label": "Street address", "type": "text"},
                {"key": "city", "label": "City", "type": "text", "maxLength": 30},
                {"key": "province", "label": "Province", "type": "text", "maxLength": 30},
                {"key": "postalCode", "label": "Postal Code", "type": "text", "maxLength": 20},
            ],
        },
    ],
    "fields": [
        {
            "key": "status",
            "label": "Current Housing Status",
            "type": "dropdown",
            "options": HOUSING_STATUS_OPTIONS,
        },
        {"key": "statusDetails", "label": "Housing status details (if applicable)", "type": "text"},
        {
            "key": "preferredAuntLeahLocation",
            "label": "Preferred Aunt Leah's Location",
            "type": "dropdown",
            "options": LOCATION_OPTIONS,
        },
        {
            "key": "emergencyContact",
            "label": "Emergency Contact (if applicable)",
            "type": "text",
        },
    ],
}

referral_info = {
    "key": "referral",
    "label": "Referral Information",
    "type": "section",
    "fields": [
        {"key": "source", "label": "Referral source", "type": "text"},
        {"key": "referralDate", "label": "Referral date", "type": "date"},
        {
            "key": "connection",
            "label": "Connection to Aunt Leah's",
            "type": "dropdown",
            "options": REFERRAL_CONNECTION_OPTIONS,
        },
        {
            "key": "notes",
            "label": "Additional comments / referral notes",
            "type": "text-long",
        },
    ],
}

background_history_section = {
    "key": "intake",
    "label": "Background History",
    "type": "section",
    "description": "Personal information, areas of need, and existing ID.",
    "groups": [
        {
            "key": "background",
            "type": "group",
            "label": "Personal information",
            "fields": [
                {
                    "key": "personal",
                    "label": "",
                    "type": "multi-dropdown-with-details",
                    "options": BACKGROUND_PERSONAL_OPTIONS,
                },
            ],
        },
        {
            "key": "background",
            "type": "group",
            "label": "Areas of need",
            "fields": [
                {
                    "key": "areasOfNeed",
                    "label": "",
                    "type": "multi-dropdown-with-details",
                    "options": BACKGROUND_AREAS_OF_NEED_OPTIONS,
                },
            ],
        },
        {
            "key": "background",
            "type": "group",
            "label": "Existing ID",
            "fields": [
                {
                    "key": "existingId",
                    "label": "",
                    "type": "multi-dropdown-with-details",
                    "options": BACKGROUND_EXISTING_ID_OPTIONS,
                },
            ],
        },
    ],
}

collateral_supports_section = {
    "key": "intake",
    "label": "Collateral Supports (if any)",
    "type": "section",
    "descriptionTone": "emphasis",
    "description": (
        "*Please note that written, revokable consent is required prior to "
        "contacting these supports*"
    ),
    "groups": [
        {
            "key": "collateral",
            "type": "group",
            "label": "Name of organization & worker / role",
            "fields": [
                {
                    "key": "row1Organization",
                    "label": "Organization of Collateral Support 1",
                    "type": "text",
                },
                {
                    "key": "row1WorkerRole",
                    "label": "Worker / role of Collateral Support 1",
                    "type": "text",
                },
                {
                    "key": "row2Organization",
                    "label": "Organization of Collateral Support 2",
                    "type": "text",
                },
                {
                    "key": "row2WorkerRole",
                    "label": "Worker / role of Collateral Support 2",
                    "type": "text",
                },
                {
                    "key": "row3Organization",
                    "label": "Organization of Collateral Support 3",
                    "type": "text",
                },
                {
                    "key": "row3WorkerRole",
                    "label": "Worker / role of Collateral Support 3",
                    "type": "text",
                },
                {
                    "key": "noOtherSupports",
                    "label": "No other supports",
                    "type": "checkbox-boolean",
                },
            ],
        },
    ],
}

department_receiving_referral_section = {
    "key": "intake",
    "label": "Department Receiving Referral",
    "type": "section",
    "groups": [
        {
            "key": "departmentReferral",
            "type": "group",
            "label": "Life Skills",
            "fields": [
                {
                    "key": "lifeSkills",
                    "label": "",
                    "type": "multi-dropdown-with-details",
                    "options": DEPT_REFERRAL_LIFE_SKILLS_OPTIONS,
                },
            ],
        },
        {
            "key": "departmentReferral",
            "type": "group",
            "label": "Employment",
            "fields": [
                {
                    "key": "employment",
                    "label": "",
                    "type": "multi-dropdown-with-details",
                    "options": DEPT_REFERRAL_EMPLOYMENT_OPTIONS,
                },
            ],
        },
        {
            "key": "departmentReferral",
            "type": "group",
            "label": "Education",
            "fields": [
                {
                    "key": "education",
                    "label": "",
                    "type": "multi-dropdown-with-details",
                    "options": DEPT_REFERRAL_EDUCATION_OPTIONS,
                },
            ],
        },
        {
            "key": "departmentReferral",
            "type": "group",
            "label": "Housing (referral)",
            "fields": [
                {
                    "key": "housing",
                    "label": "",
                    "type": "multi-dropdown-with-details",
                    "options": DEPT_REFERRAL_HOUSING_OPTIONS,
                },
            ],
        },
    ],
}

department_specific_section = {
    "key": "intake",
    "label": "Department-Specific Information",
    "type": "section",
    "groups": [
        {
            "key": "departmentSpecific",
            "type": "group",
            "label": "Life Skills",
            "fields": [
                {
                    "key": "lifeSajeParticipant",
                    "label": "Current / former SAJE participant?",
                    "type": "dropdown",
                    "options": YES_NO_DROPDOWN,
                },
                {
                    "key": "lifeSajeKindAndWorker",
                    "label": "If yes, what kind of SAJE and who is/was your social worker?",
                    "type": "text-long",
                },
                {
                    "key": "lifeSajeApplicationCompleted",
                    "label": "If no, have you completed the SAJE application?",
                    "type": "dropdown",
                    "options": YES_NO_DROPDOWN,
                },
            ],
        },
        {
            "key": "departmentSpecific",
            "type": "group",
            "label": "Employment",
            "fields": [
                {
                    "key": "empCurrentStatus",
                    "label": "What is your current employment status?",
                    "type": "text",
                },
                {
                    "key": "empAge15to30",
                    "label": "Are you between the ages of 15 and 30?",
                    "type": "dropdown",
                    "options": YES_NO_DROPDOWN,
                },
                {
                    "key": "empLegallyEntitledWork",
                    "label": "Are you legally entitled to work in Canada?",
                    "type": "dropdown",
                    "options": YES_NO_DROPDOWN,
                },
            ],
        },
        {
            "key": "departmentSpecific",
            "type": "group",
            "label": "Education",
            "fields": [
                {
                    "key": "eduEnrolledInSchool",
                    "label": "Are you currently enrolled in school?",
                    "type": "dropdown",
                    "options": YES_NO_DROPDOWN,
                },
                {
                    "key": "eduHighSchoolCompletedWhere",
                    "label": "Have you completed your high school education? If so, where?",
                    "type": "text-long",
                },
                {
                    "key": "eduLastGradeWhere",
                    "label": (
                        "If you have not completed high school, what is the last grade "
                        "you completed and where?"
                    ),
                    "type": "text-long",
                },
                {
                    "key": "eduReportCardsAccess",
                    "label": "Do you have access to past report cards?",
                    "type": "dropdown",
                    "options": YES_NO_DROPDOWN,
                },
            ],
        },
        {
            "key": "departmentSpecific",
            "type": "group",
            "label": "Housing",
            "fields": [
                {
                    "key": "deptHousingAge19to30",
                    "label": "Are you between the ages of 19 and 30?",
                    "type": "dropdown",
                    "options": YES_NO_DROPDOWN,
                },
                {
                    "key": "deptHousingRentalSubsidy",
                    "label": "Are you currently receiving any form of rental subsidy?",
                    "type": "dropdown",
                    "options": YES_NO_DROPDOWN,
                },
                {
                    "key": "deptHousingReachingHomeEligible",
                    "label": "Are you eligible for Reaching Home?",
                    "type": "dropdown",
                    "options": YES_NO_DROPDOWN,
                },
            ],
        },
    ],
}


def get_intake_form():
    return {
        "sections": [
            get_participant_info(),
            address_and_housing_info,
            referral_info,
            background_history_section,
            collateral_supports_section,
            department_receiving_referral_section,
            department_specific_section,
        ],
    }
