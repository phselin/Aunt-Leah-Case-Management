from datetime import date as date_type

from pydantic import BaseModel, Field, ValidationInfo, field_validator

from backend_app.schemas.utils import validate_programs_util


class CaseNote(BaseModel):
    date: date_type = Field(...)
    content: str = Field(...)
    personid: str = Field(...)
    program: str | None
    category: str | None
    author: str | None
    lastUpdatedBy: str | None

    @field_validator("program")
    @classmethod
    def get_validate_program(cls, value: str | None, info: ValidationInfo):
        if value:
            return validate_programs_util([value])
        return None

    # may be a validator for category?
