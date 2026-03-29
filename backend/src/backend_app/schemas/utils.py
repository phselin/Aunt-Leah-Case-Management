import re

from pydantic import ValidationInfo


def validate_name_util(cls, value: str) -> str:
    value = value.strip().title()
    if not value:
        raise ValueError("name cannot be empty")
    if len(value) > 100:
        raise ValueError("name is too long")
    # special char ai-gen, i don't know which characters to allow
    if not re.compile(r"^[A-Za-zÀ-ÖØ-öø-ÿ\s'\-]+$").match(value):
        raise ValueError("Name contains invalid characters")
    return value


# very strict right now, only accepts canadian numbers
def validate_phone_util(cls, value: str | None) -> str | None:
    if not value:
        return None

    digits = re.sub(r"\D", "", value)

    if len(digits) == 11:
        if digits[0] != "1":
            raise ValueError("Invalid phone number. Wrong country code")
        return f"+{digits}"

    raise ValueError("Invalid phone number")


def validate_programs_util(cls, value: list[str], info: ValidationInfo) -> list[str]:
    valid_programs_structure = (
        info.context.get("valid_programs_structure", []) if info.context else []
    )
    for program in value:
        if program not in valid_programs_structure:
            raise ValueError(f"{program} is not a valid program")
    return value
