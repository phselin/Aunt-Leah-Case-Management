from typing import Literal

from pydantic import BaseModel, EmailStr, Field, ValidationError, ValidationInfo, field_validator

from backend_app.schemas.utils import sanitize_name, sanitize_phone, validate_programs_util


class Staff(BaseModel):
    firstname: str = Field(..., min_length=1)
    lastname: str = Field(..., min_length=1)
    role: Literal["admin", "super-admin", "staff"]
    phone: str | None = None
    email: EmailStr
    activate: bool = True
    programs: list[str] = Field(default_factory=list)
    mfaEnabled: bool = False
    mfaSecret: str | None = None


@field_validator("firstname", "lastname")
@classmethod
def validate_name(cls, value: str) -> str:
    return sanitize_name(cls, value)


@field_validator("phone")
def validate_phone(cls, value: str | None) -> str | None:
    return sanitize_phone(cls, value)


@field_validator("programs")
def validate_programs(cls, value: list[str], info: ValidationInfo) -> list[str]:
    return validate_programs_util(cls, value, info)


@field_validator("mfaSecret")
def validate_mfa_secret(cls, value: str | None, info: ValidationInfo) -> str | None:
    mfa_enabled = info.data.get("mfaEnabled")
    if mfa_enabled and not value:
        return ValidationError("mfaSecret is required when mfaEnabled is true")
    return value
