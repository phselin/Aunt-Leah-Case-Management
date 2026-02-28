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

    @field_validator("firstname", "lastname")
    @classmethod
    def sanitize_name(cls, value: str) -> str:
        return value.strip().title()

    @field_validator("phone")
    @classmethod
    def sanitize_phone(cls, value: str | None) -> str | None:
        if not value:
            return None

        digits = re.sub(r"\D", "", value)
        if not (7 <= len(digits) <= 15):
            raise ValueError("Invalid phone number")
        return value

    @field_validator("programs")
    @classmethod
    def validate_programs(cls, value: list[str], info: ValidationInfo) -> list[str]:
        valid_programs = info.context.get("valid_programs", []) if info.context else []
        for program in value:
            if program not in valid_programs:
                raise ValueError(f"{program} is not a valid program")
        return value
