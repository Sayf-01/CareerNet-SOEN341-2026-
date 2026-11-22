from pydantic import BaseModel, ConfigDict, Field, field_validator


class ProfileIn(BaseModel):
    """What the frontend sends to PUT /profile/me."""

    full_name: str = Field(min_length=1, max_length=100)
    headline: str = Field(default="", max_length=255)
    location: str = Field(default="", max_length=100)
    phone: str = Field(default="", max_length=30)
    summary: str = Field(default="", max_length=2000)
    skills: list[str] = Field(default_factory=list, max_length=30)

    @field_validator("full_name")
    @classmethod
    def full_name_not_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Full name is required")
        return value

    @field_validator("skills")
    @classmethod
    def clean_skills(cls, skills: list[str]) -> list[str]:
        # Remove extra spaces and empty entries, e.g. ["Python ", ""] -> ["Python"]
        return [skill.strip() for skill in skills if skill.strip()]


class ProfileOut(BaseModel):
    """What the backend sends back. Empty fields come back as "" (never null)."""

    model_config = ConfigDict(from_attributes=True)  # lets us build it from the Profile table row

    full_name: str = ""
    headline: str = ""
    location: str = ""
    phone: str = ""
    summary: str = ""
    skills: list[str] = []

    @field_validator("full_name", "headline", "location", "phone", "summary", mode="before")
    @classmethod
    def none_to_empty_text(cls, value):
        return value or ""

    @field_validator("skills", mode="before")
    @classmethod
    def none_to_empty_list(cls, value):
        return value or []