from datetime import date
from pydantic import BaseModel, Field, field_validator, model_validator
from .models import Role


class LoginIn(BaseModel):
    username: str = Field(min_length=3, max_length=100, pattern=r"^[A-Za-z0-9_.-]+$")
    password: str = Field(min_length=1, max_length=200)


class PasswordChange(BaseModel):
    current_password: str = Field(min_length=1, max_length=200)
    new_password: str = Field(min_length=10, max_length=200)


class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=100, pattern=r"^[A-Za-z0-9_.-]+$")
    full_name: str = Field(min_length=1, max_length=200)
    password: str = Field(min_length=10, max_length=200)
    role: Role = Role.LECTURER

    @field_validator("username")
    @classmethod
    def normalized_username(cls, value: str): return value.casefold()


class UserUpdate(BaseModel):
    full_name: str | None = None
    password: str | None = Field(default=None, min_length=10)
    role: Role | None = None
    active: bool | None = None


class CourseIn(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=3000)
    period_id: int


class PeriodIn(BaseModel):
    name: str = Field(min_length=1, max_length=200)


class GroupIn(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    course_id: int
    period_id: int
    presentation_date: date


class ThemeIn(BaseModel):
    color: str = Field(pattern=r"^#[0-9A-Fa-f]{6}$")


class StudentIn(BaseModel):
    full_name: str = Field(min_length=1, max_length=200)
    presentation_title: str | None = Field(default=None, max_length=300)


class CriterionIn(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    weight: int = Field(gt=0, le=100)


class SessionCreate(BaseModel):
    course_id: int
    period_id: int
    group_id: int
    session_date: date
    title: str | None = None
    voting_duration: int = Field(default=60, ge=10, le=3600)
    is_demo: bool = False
    criteria: list[CriterionIn]
    presenters: list[StudentIn] | None = None

    @model_validator(mode="after")
    def weights(self):
        if not self.criteria or sum(x.weight for x in self.criteria) != 100:
            raise ValueError("Τα βάρη των κριτηρίων πρέπει να αθροίζουν σε 100%")
        return self


class PresentationEditIn(BaseModel):
    presenter_name: str = Field(min_length=1, max_length=200)
    title: str | None = Field(default=None, max_length=300)


class VoteIn(BaseModel):
    scores: dict[int, int]


class DuplicateIn(BaseModel):
    session_date: date
    group_id: int | None = None


class BrandingIn(BaseModel):
    university_name: str | None = Field(default=None, max_length=200)
    school_name: str | None = Field(default=None, max_length=200)
    department_name: str | None = Field(default=None, max_length=200)
    background_type: str | None = Field(default="none", pattern="^(none|solid|gradient|image)$")
    background_value: str | None = Field(default=None, max_length=255)
    background_opacity: float | None = Field(default=0.12, ge=0, le=0.35)

