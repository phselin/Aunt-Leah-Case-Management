import re
from datetime import date
from typing import Literal

from pydantic import BaseModel, EmailStr, Field, ValidationInfo, field_validator


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
    status: dict[str, dict[str, str]] = Field(default_factory=dict)

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
        cls, value: dict[str, dict[str, str]], info: ValidationInfo
    ) -> dict[str, dict[str, str]]:
        valid_programs_structure = (
            info.context.get("valid_programs_structure", {}) if info.context else {}
        )
        programs = info.data.get("programs", [])
        for program, goal_types in value.items():
            if program not in programs:
                raise ValueError(f"Client doesn't belong to {program} program")
            if program not in valid_programs_structure:
                raise ValueError(f"{program} program doesn't have any milestones")
            valid_goal_types = valid_programs_structure.get(program, {})
            for goal_type, milestone in goal_types.items():
                if goal_type not in valid_goal_types:
                    raise ValueError(f"Invalid goaltype {goal_type} for {program}")
                valid_milestones = valid_goal_types.get(goal_type, [])
                if milestone not in valid_milestones:
                    raise ValueError(f"Invalid milestone {milestone} for {program} {goal_type}")
        return value
