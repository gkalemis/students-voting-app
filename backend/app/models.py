import enum
from datetime import date, datetime, timezone
from decimal import Decimal
from sqlalchemy import Boolean, Date, DateTime, Enum, ForeignKey, Integer, Numeric, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .database import Base


def utcnow():
    return datetime.now(timezone.utc)


class Role(str, enum.Enum):
    ADMIN = "ADMIN"
    LECTURER = "LECTURER"


class SessionStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    ARCHIVED = "ARCHIVED"


class PresentationStatus(str, enum.Enum):
    PENDING = "PENDING"
    VOTING_OPEN = "VOTING_OPEN"
    EVALUATED = "EVALUATED"
    NO_VOTES = "NO_VOTES"
    SKIPPED = "SKIPPED"


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)


class User(Base, TimestampMixin):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(200))
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[Role] = mapped_column(Enum(Role))
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    must_change_password: Mapped[bool] = mapped_column(Boolean, default=True)
    auth_version: Mapped[int] = mapped_column(Integer, default=0)


class BrandingMixin:
    university_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    school_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    department_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    logo_path: Mapped[str | None] = mapped_column(String(255), nullable=True)
    background_type: Mapped[str | None] = mapped_column(String(20), nullable=True)
    background_value: Mapped[str | None] = mapped_column(String(255), nullable=True)
    background_image_path: Mapped[str | None] = mapped_column(String(255), nullable=True)
    background_opacity: Mapped[Decimal | None] = mapped_column(Numeric(3, 2), nullable=True)


class GlobalBranding(Base, TimestampMixin, BrandingMixin):
    __tablename__ = "global_branding"
    id: Mapped[int] = mapped_column(primary_key=True, default=1)


class Course(Base, TimestampMixin, BrandingMixin):
    __tablename__ = "courses"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200))
    description: Mapped[str | None] = mapped_column(Text)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)


class AcademicPeriod(Base, TimestampMixin):
    __tablename__ = "academic_periods"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200))
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    __table_args__ = (UniqueConstraint("owner_id", "name"),)


class StudentGroup(Base, TimestampMixin):
    __tablename__ = "student_groups"
    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200))
    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id"), index=True)
    period_id: Mapped[int] = mapped_column(ForeignKey("academic_periods.id"))
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)


class Student(Base, TimestampMixin):
    __tablename__ = "students"
    id: Mapped[int] = mapped_column(primary_key=True)
    group_id: Mapped[int] = mapped_column(ForeignKey("student_groups.id", ondelete="CASCADE"), index=True)
    full_name: Mapped[str] = mapped_column(String(200))
    presentation_title: Mapped[str | None] = mapped_column(String(300))


class PresentationSession(Base, TimestampMixin):
    __tablename__ = "presentation_sessions"
    id: Mapped[int] = mapped_column(primary_key=True)
    public_id: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id"))
    period_id: Mapped[int] = mapped_column(ForeignKey("academic_periods.id"))
    group_id: Mapped[int] = mapped_column(ForeignKey("student_groups.id"))
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    session_date: Mapped[date] = mapped_column(Date)
    title: Mapped[str | None] = mapped_column(String(250))
    status: Mapped[SessionStatus] = mapped_column(Enum(SessionStatus), default=SessionStatus.DRAFT)
    lock_new_participants: Mapped[bool] = mapped_column(Boolean, default=False)
    criteria_locked: Mapped[bool] = mapped_column(Boolean, default=False)
    voting_duration: Mapped[int] = mapped_column(Integer, default=60)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False)
    results_revealed: Mapped[bool] = mapped_column(Boolean, default=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class Presentation(Base, TimestampMixin):
    __tablename__ = "presentations"
    id: Mapped[int] = mapped_column(primary_key=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("presentation_sessions.id", ondelete="CASCADE"), index=True)
    student_id: Mapped[int | None] = mapped_column(ForeignKey("students.id"))
    presenter_name: Mapped[str] = mapped_column(String(200))
    title: Mapped[str | None] = mapped_column(String(300))
    position: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[PresentationStatus] = mapped_column(Enum(PresentationStatus), default=PresentationStatus.PENDING)
    voting_opened_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    voting_closes_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    voting_closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class Criterion(Base, TimestampMixin):
    __tablename__ = "criteria"
    id: Mapped[int] = mapped_column(primary_key=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("presentation_sessions.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(200))
    weight: Mapped[int] = mapped_column(Integer)
    position: Mapped[int] = mapped_column(Integer)


class ParticipationToken(Base):
    __tablename__ = "participation_tokens"
    id: Mapped[int] = mapped_column(primary_key=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("presentation_sessions.id", ondelete="CASCADE"), index=True)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    issued_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    revoked: Mapped[bool] = mapped_column(Boolean, default=False)


class Vote(Base):
    __tablename__ = "votes"
    id: Mapped[int] = mapped_column(primary_key=True)
    presentation_id: Mapped[int] = mapped_column(ForeignKey("presentations.id", ondelete="CASCADE"), index=True)
    # SET NULL lets maintenance erase an expired credential without erasing its
    # already-cast anonymous contribution. A replacement token is a new voter.
    token_id: Mapped[int | None] = mapped_column(ForeignKey("participation_tokens.id", ondelete="SET NULL"), index=True, nullable=True)
    synthetic: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
    __table_args__ = (UniqueConstraint("presentation_id", "token_id", name="uq_vote_token_presentation"),)


class VoteScore(Base):
    __tablename__ = "vote_scores"
    id: Mapped[int] = mapped_column(primary_key=True)
    vote_id: Mapped[int] = mapped_column(ForeignKey("votes.id", ondelete="CASCADE"), index=True)
    criterion_id: Mapped[int] = mapped_column(ForeignKey("criteria.id"))
    score: Mapped[int] = mapped_column(Integer)
    __table_args__ = (UniqueConstraint("vote_id", "criterion_id"),)


class AnonymousVoteScore(Base):
    __tablename__ = "anonymous_vote_scores"
    id: Mapped[int] = mapped_column(primary_key=True)
    presentation_id: Mapped[int] = mapped_column(ForeignKey("presentations.id", ondelete="CASCADE"), index=True)
    anonymous_vote_id: Mapped[str] = mapped_column(String(32), index=True)
    criterion_id: Mapped[int] = mapped_column(ForeignKey("criteria.id"))
    score: Mapped[int] = mapped_column(Integer)
    synthetic: Mapped[bool] = mapped_column(Boolean, default=False)


class PresentationEdit(Base):
    __tablename__ = "presentation_edits"
    id: Mapped[int] = mapped_column(primary_key=True)
    presentation_id: Mapped[int] = mapped_column(ForeignKey("presentations.id", ondelete="CASCADE"), index=True)
    field: Mapped[str] = mapped_column(String(30))
    previous_value: Mapped[str | None] = mapped_column(Text)
    new_value: Mapped[str | None] = mapped_column(Text)
    changed_by_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    changed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

