"""Checkbox option lists for intake form pages 2–3 (shared by intake_form and person validators)."""

BACKGROUND_PERSONAL_OPTIONS = [
    {"value": "currentlyInCare", "label": "Currently in Care"},
    {"value": "formerlyInCare", "label": "Formerly in Care", "hasDetails": True},
    {"value": "pregnantParenting", "label": "Pregnant/Parenting"},
    {"value": "lgbtqia2s", "label": "LGBTQIA2S+"},
    {"value": "physicalDiagnosis", "label": "Physical Diagnosis", "hasDetails": True},
    {"value": "cognitiveDiagnosis", "label": "Cognitive Diagnosis", "hasDetails": True},
    {"value": "mentalHealthStruggles", "label": "Mental Health Struggles"},
    {"value": "substanceUseDisorder", "label": "Substance Use Disorder"},
    {"value": "firstNations", "label": "First Nations"},
    {"value": "metis", "label": "Métis"},
    {"value": "inuit", "label": "Inuit"},
    {"value": "latinAmerican", "label": "Latin/Central/South American"},
    {"value": "caribbean", "label": "Caribbean"},
    {"value": "african", "label": "African"},
    {"value": "middleEastern", "label": "Middle Eastern"},
    {"value": "southAsian", "label": "South Asian"},
    {"value": "eastAsian", "label": "East Asian"},
    {"value": "europeanWhite", "label": "European/White"},
    {"value": "cultureOther", "label": "Other", "hasDetails": True},
]

BACKGROUND_AREAS_OF_NEED_OPTIONS = [
    {"value": "housing", "label": "Housing"},
    {"value": "education", "label": "Education"},
    {"value": "financialEmployment", "label": "Financial difficulties / needing employment"},
    {"value": "foodSecurity", "label": "Food Security"},
    {"value": "substanceUse", "label": "Substance Use"},
    {"value": "mentalHealth", "label": "Mental Health"},
    {"value": "peerRelations", "label": "Peer Relations"},
    {"value": "lifeIndependentSkills", "label": "Life / Independent Living Skills"},
    {"value": "justiceSystem", "label": "Justice System Involvement", "hasDetails": True},
    {"value": "historyOfViolence", "label": "History of Violence", "hasDetails": True},
    {"value": "sexWorkSurvival", "label": "Sex Work / Survival Sex"},
    {"value": "ipvDomestic", "label": "Intimate Partner Violence / Domestic Violence"},
    {"value": "areasOther", "label": "Other (areas of need)", "hasDetails": True},
]

BACKGROUND_EXISTING_ID_OPTIONS = [
    {"value": "birthCertificate", "label": "Birth Certificate"},
    {"value": "bcPhotoId", "label": "BC Photo ID"},
    {"value": "prPhotoCard", "label": "PR Photo Card"},
    {"value": "bcServicesCard", "label": "BC Services Card (BCID)"},
    {"value": "passport", "label": "Passport"},
    {"value": "sin", "label": "SIN (required for housing subsidies)"},
    {"value": "indigenousStatusCard", "label": "Indigenous Status Card", "hasDetails": True},
    {"value": "idOther", "label": "Other (ID)", "hasDetails": True},
    {"value": "idNone", "label": "None"},
]

DEPT_REFERRAL_LIFE_SKILLS_OPTIONS = [
    {"value": "sharingCircle", "label": "Sharing Circle"},
    {"value": "freshAirFridays", "label": "Fresh-Air Fridays"},
    {"value": "workshops", "label": "Workshops"},
    {"value": "foodSecurity", "label": "Food Security"},
    {"value": "lifeSkillsOther", "label": "Other", "hasDetails": True},
]

DEPT_REFERRAL_EMPLOYMENT_OPTIONS = [
    {"value": "preEmployment", "label": "Pre-Employment"},
]

DEPT_REFERRAL_EDUCATION_OPTIONS = [
    {"value": "seffy", "label": "SEFFY"},
]

DEPT_REFERRAL_HOUSING_OPTIONS = [
    {"value": "link", "label": "Link"},
    {"value": "reachingHome", "label": "Reaching Home"},
    {"value": "lale", "label": "Lale"},
    {"value": "thresholds", "label": "Thresholds"},
]

YES_NO_DROPDOWN = [
    {"value": "yes", "label": "Yes"},
    {"value": "no", "label": "No"},
]

GENDER_OPTIONS = ["Male", "Female", "Non Binary", "Prefer not to say"]

CONTACT_METHOD_OPTIONS = ["Phone", "Email", "Text"]

LOCATION_OPTIONS = ["New Westminster", "Seymour", "Flexible"]

HOUSING_STATUS_OPTIONS = [
    {"value": "sleepingRough", "label": "Sleeping Rough"},
    {"value": "shelter", "label": "Shelter"},
    {"value": "hiddenHomelessness", "label": "Hidden Homelessness"},
    {"value": "privateMarket", "label": "Private Market"},
    {"value": "subsidizedHousing", "label": "Subsidized Housing"},
    {"value": "singleRoomOccupancy", "label": "Single Room Occupancy"},
    {"value": "supportiveHousing", "label": "Supportive Housing"},
    {"value": "transitionalHousing", "label": "Transitional Housing"},
    {"value": "other", "label": "Other"},
]

REFERRAL_CONNECTION_OPTIONS = [
    "Current Participant",
    "Former Participant",
    "New Referral",
    "Guest of current participant",
]
