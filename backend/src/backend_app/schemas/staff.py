from typing import Literal

from pydantic import BaseModel, EmailStr, Field, ValidationInfo, field_validator

from backend_app.schemas.utils import (
    validate_email_util,
    validate_name_util,
    validate_phone_util,
    validate_programs_util,
)


class Staff(BaseModel):
    firstname: str = Field(..., min_length=1)
    lastname: str = Field(..., min_length=1)
    role: Literal["admin", "super-admin", "staff"]
    phone: str | None = None
    email: EmailStr
    active: bool = True
    programs: list[str] = Field(default_factory=list)
    mfaEnabled: bool = False

    @field_validator("firstname", "lastname")
    @classmethod
    def validate_name(cls, value: str) -> str:
        return validate_name_util(value)

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str | None) -> str | None:
        return validate_phone_util(value)

    @field_validator("programs")
    @classmethod
    def validate_programs(cls, value: list[str], info: ValidationInfo) -> list[str]:
        return validate_programs_util(value, info)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: EmailStr) -> EmailStr:
        return validate_email_util(value)
