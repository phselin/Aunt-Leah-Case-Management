import re
from datetime import date

from pydantic import BaseModel, EmailStr, Field, ValidationInfo, field_validator

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
)


class Milestone(BaseModel):
    value: str
    lastUpdateDate: date | None = None
    startDate: date | None = None


class Address(BaseModel):
    street: str | None = None
    city: str | None = None
    province: str | None = None
    postalCode: str | None = None


class SelectionWithDetails(BaseModel):
    value: str
    details: str | None = None


def validate_selection_with_details(
    value: list[SelectionWithDetails], options: list[dict]
) -> list[SelectionWithDetails]:
    allowed = {op["value"] for op in options}
    for swd in value:
        if swd.value not in allowed:
            raise ValueError(f"'{swd.value}' is not a valid option")
    return value


def validate_optional_yes_no(value: str | None) -> str | None:
    if value in (None, ""):
        return None
    if value not in ("yes", "no"):
        raise ValueError("Expected yes or no")
    return value


HOUSING_STATUS_VALUES = frozenset(op["value"] for op in HOUSING_STATUS_OPTIONS)


class Housing(BaseModel):
    address: Address | None = None
    preferredAuntLeahLocation: str | None = None
    status: str | None = None
    statusDetails: str | None = None
    emergencyContact: str | None = None

    @field_validator("preferredAuntLeahLocation")
    @classmethod
    def validate_location(cls, value: str | None) -> str | None:
        if value is not None and value not in LOCATION_OPTIONS:
            raise ValueError(f"{value} is not a valid aunt leah location")
        return value

    @field_validator("status")
    @classmethod
    def validate_housing_status(cls, value: str | None) -> str | None:
        if value in (None, ""):
            return None
        if value not in HOUSING_STATUS_VALUES:
            raise ValueError(f"{value} is not a valid housing status")
        return value


class Referral(BaseModel):
    source: str | None = None
    referralDate: date | None = None
    connection: str | None = None
    notes: str | None = None

    @field_validator("connection")
    @classmethod
    def validate_connection(cls, value: str | None) -> str | None:
        if value is not None and value not in REFERRAL_CONNECTION_OPTIONS:
            raise ValueError(f"{value} is not a valid referral connection")
        return value


class IntakeBackground(BaseModel):
    personal: list[SelectionWithDetails] = Field(default_factory=list)
    areasOfNeed: list[SelectionWithDetails] = Field(default_factory=list)
    existingId: list[SelectionWithDetails] = Field(default_factory=list)

    @field_validator("personal")
    @classmethod
    def v_personal(cls, v: list[SelectionWithDetails]) -> list[SelectionWithDetails]:
        return validate_selection_with_details(v, BACKGROUND_PERSONAL_OPTIONS)

    @field_validator("areasOfNeed")
    @classmethod
    def v_areas(cls, v: list[SelectionWithDetails]) -> list[SelectionWithDetails]:
        return validate_selection_with_details(v, BACKGROUND_AREAS_OF_NEED_OPTIONS)

    @field_validator("existingId")
    @classmethod
    def v_existing_id(cls, v: list[SelectionWithDetails]) -> list[SelectionWithDetails]:
        return validate_selection_with_details(v, BACKGROUND_EXISTING_ID_OPTIONS)


class IntakeCollateral(BaseModel):
    row1Organization: str | None = None
    row1WorkerRole: str | None = None
    row2Organization: str | None = None
    row2WorkerRole: str | None = None
    row3Organization: str | None = None
    row3WorkerRole: str | None = None
    noOtherSupports: bool | None = None


class IntakeDepartmentReferral(BaseModel):
    lifeSkills: list[SelectionWithDetails] = Field(default_factory=list)
    employment: list[SelectionWithDetails] = Field(default_factory=list)
    education: list[SelectionWithDetails] = Field(default_factory=list)
    housing: list[SelectionWithDetails] = Field(default_factory=list)

    @field_validator("lifeSkills")
    @classmethod
    def v_life_skills(cls, v: list[SelectionWithDetails]) -> list[SelectionWithDetails]:
        return validate_selection_with_details(v, DEPT_REFERRAL_LIFE_SKILLS_OPTIONS)

    @field_validator("employment")
    @classmethod
    def v_employment(cls, v: list[SelectionWithDetails]) -> list[SelectionWithDetails]:
        return validate_selection_with_details(v, DEPT_REFERRAL_EMPLOYMENT_OPTIONS)

    @field_validator("education")
    @classmethod
    def v_education(cls, v: list[SelectionWithDetails]) -> list[SelectionWithDetails]:
        return validate_selection_with_details(v, DEPT_REFERRAL_EDUCATION_OPTIONS)

    @field_validator("housing")
    @classmethod
    def v_dept_housing(cls, v: list[SelectionWithDetails]) -> list[SelectionWithDetails]:
        return validate_selection_with_details(v, DEPT_REFERRAL_HOUSING_OPTIONS)


class IntakeDepartmentSpecific(BaseModel):
    lifeSajeParticipant: str | None = None
    lifeSajeKindAndWorker: str | None = None
    lifeSajeApplicationCompleted: str | None = None
    empCurrentStatus: str | None = None
    empAge15to30: str | None = None
    empLegallyEntitledWork: str | None = None
    eduEnrolledInSchool: str | None = None
    eduHighSchoolCompletedWhere: str | None = None
    eduLastGradeWhere: str | None = None
    eduReportCardsAccess: str | None = None
    deptHousingAge19to30: str | None = None
    deptHousingRentalSubsidy: str | None = None
    deptHousingReachingHomeEligible: str | None = None

    @field_validator(
        "lifeSajeParticipant",
        "lifeSajeApplicationCompleted",
        "empAge15to30",
        "empLegallyEntitledWork",
        "eduEnrolledInSchool",
        "eduReportCardsAccess",
        "deptHousingAge19to30",
        "deptHousingRentalSubsidy",
        "deptHousingReachingHomeEligible",
    )
    @classmethod
    def validate_yes_no_fields(cls, value: str | None) -> str | None:
        return validate_optional_yes_no(value)


class ClientIntake(BaseModel):
    background: IntakeBackground | None = None
    collateral: IntakeCollateral | None = None
    departmentReferral: IntakeDepartmentReferral | None = None
    departmentSpecific: IntakeDepartmentSpecific | None = None


class Person(BaseModel):
    firstname: str = Field(..., min_length=1)
    lastname: str = Field(..., min_length=1)
    active: bool = True
    dob: date | None = None
    gender: str | None = None
    pronouns: str | None = None
    phone: str | None = None
    email: EmailStr | None = None
    preferredContactMethod: str | None = None
    programs: list[str] = Field(default_factory=list)
    programMilestones: dict[str, dict[str, Milestone]] | None = None
    housing: Housing | None = None
    referral: Referral | None = None
    intake: ClientIntake | None = None

    @field_validator("firstname", "lastname")
    @classmethod
    def sanitize_name(cls, value: str) -> str:
        value = value.strip().title()
        if not value:
            raise ValueError("name cannot be empty")
        if len(value) > 100:
            raise ValueError("name is too long")
        # special char ai-gen, i don't know which characters to allow
        if not re.compile(r"^[A-Za-zÀ-ÖØ-öø-ÿ\s'\-]+$").match(value):
            raise ValueError("Name contains invalid characters")
        return value

    @field_validator("gender")
    @classmethod
    def validate_gender(cls, value: str | None) -> str | None:
        if value is not None and value not in GENDER_OPTIONS:
            raise ValueError(f"'{value}' is not a valid gender")
        return value

    @field_validator("preferredContactMethod")
    @classmethod
    def validate_contact_method(cls, value: str | None) -> str | None:
        if value is not None and value not in CONTACT_METHOD_OPTIONS:
            raise ValueError(f"'{value}' is not a valid contact method")
        return value

    # very strict right now, only accepts canadian numbers
    @field_validator("phone")
    @classmethod
    def sanitize_phone(cls, value: str | None) -> str | None:
        if not value:
            return None

        digits = re.sub(r"\D", "", value)

        if len(digits) == 11:
            if digits[0] != "1":
                raise ValueError("Invalid phone number. Wrong country code")
            return f"+{digits}"

        raise ValueError("Invalid phone number")

    @field_validator("programs")
    @classmethod
    def validate_programs(cls, value: list[str], info: ValidationInfo) -> list[str]:
        valid_programs_structure = (
            info.context.get("valid_programs_structure", []) if info.context else []
        )
        for program in value:
            if program not in valid_programs_structure:
                raise ValueError(f"{program} is not a valid program")
        return value

    @field_validator("programMilestones")
    @classmethod
    def validate_programMilestones(
        cls, value: dict[str, dict[str, Milestone]], info: ValidationInfo
    ) -> dict[str, dict[str, Milestone]] | None:
        if value is None:
            return value

        programs = info.data.get("programs", [])
        value = {
            program: milestone_tree
            for program, milestone_tree in value.items()
            if program in programs
        }
        if not value:
            return None
        valid_programs_structure = (
            info.context.get("valid_programs_structure", {}) if info.context else {}
        )

        for program, milestone_trees in value.items():
            if program not in programs:
                raise ValueError(f"Client doesn't belong to {program} program")
            if program not in valid_programs_structure:
                raise ValueError(f"{program} program doesn't have any milestones")

            valid_milestone_trees = valid_programs_structure.get(program, {})

            for milestone_tree_type, milestone in milestone_trees.items():
                if milestone_tree_type not in valid_milestone_trees:
                    raise ValueError(f"Invalid milestoneTree {milestone_tree_type} for {program}")
                valid_milestones = valid_milestone_trees.get(milestone_tree_type, [])
                if milestone.value not in valid_milestones:
                    raise ValueError(
                        f"Invalid milestone {milestone.value} for {program} {milestone_tree_type}"
                    )
        return value
