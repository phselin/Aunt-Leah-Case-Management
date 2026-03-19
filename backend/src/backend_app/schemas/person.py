import re
from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field, ValidationInfo, field_validator, model_validator


class MilestoneStatus(BaseModel):
    value: str
    updatedAt: datetime
    updatedBy: str


class Person(BaseModel):
    firstname: str = Field(..., min_length=1)
    lastname: str = Field(..., min_length=1)
    dob: date | None = None
    gender: str | None = None
    address: str | None = None
    phone: str | None = None
    email: EmailStr | None = None
    referralDate: date | None = None
    programs: list[str] = Field(default_factory=list)
    pronouns: str | None = None
    preferredContactMethod: Literal["email", "phone"] | None = None
    status: dict[str, dict[str, MilestoneStatus]] | None = None

    @field_validator("firstname", "lastname")
    @classmethod
    def sanitize_name(cls, value: str) -> str:
        return value.strip().title()

    # very strict right not, only accepts canadian numbers. we probably don't want it that strict
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

    @field_validator("status")
    @classmethod
    def validate_status(
        cls, value: dict[str, dict[str, MilestoneStatus]], info: ValidationInfo
    ) -> dict[str, dict[str, MilestoneStatus]] | None:
        if value is None:
            return value

        valid_programs_structure = (
            info.context.get("valid_programs_structure", {}) if info.context else {}
        )
        programs = info.data.get("programs", [])

        for program, milestone_trees in value.items():
            if program not in programs:
                raise ValueError(f"Client doesn't belong to {program} program")
            if program not in valid_programs_structure:
                raise ValueError(f"{program} program doesn't have any milestones")

            valid_milestone_trees = valid_programs_structure.get(program, {})

            for milestone_tree_type, status in milestone_trees.items():
                if milestone_tree_type not in valid_milestone_trees:
                    raise ValueError(f"Invalid milestoneTree {milestone_tree_type} for {program}")
                valid_milestones = valid_milestone_trees.get(milestone_tree_type, [])
                if status.value not in valid_milestones:
                    raise ValueError(
                        f"Invalid milestone {status} for {program} {milestone_tree_type}"
                    )
        return value
