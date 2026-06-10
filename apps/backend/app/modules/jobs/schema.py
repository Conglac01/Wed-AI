"""Job Pydantic schemas — v2 style."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class JobBase(BaseModel):
    """Shared job fields."""

    title: str
    company_name: str
    location: str
    description: str

    company_logo_url: str | None = None
    salary_text: str | None = None
    salary_min: int | None = None
    salary_max: int | None = None
    skills: list[str] | None = None
    requirements: str | None = None
    benefits: str | None = None
    deadline: str | None = None
    source_name: str | None = None
    source_url: str | None = None


class JobCreate(JobBase):
    """Payload for creating a new job. Requires title, company_name, location, description."""

    pass


class JobUpdate(BaseModel):
    """Partial update for an existing job."""

    title: str | None = None
    company_name: str | None = None
    location: str | None = None
    description: str | None = None

    company_logo_url: str | None = None
    salary_text: str | None = None
    salary_min: int | None = None
    salary_max: int | None = None
    skills: list[str] | None = None
    requirements: str | None = None
    benefits: str | None = None
    deadline: str | None = None
    source_name: str | None = None
    source_url: str | None = None
    quality_score: float | None = None
    is_active: bool | None = None


class JobRead(BaseModel):
    """Full job representation including all model fields."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    company_name: str
    company_logo_url: str | None
    location: str
    salary_text: str | None
    salary_min: int | None
    salary_max: int | None
    skills: list | None
    description: str
    requirements: str | None
    benefits: str | None
    deadline: str | None
    source_name: str | None
    source_url: str | None
    quality_score: float
    is_active: bool
    created_at: datetime
    updated_at: datetime


class JobListItem(BaseModel):
    """Lightweight job representation for list pages."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    company_name: str
    company_logo_url: str | None
    location: str
    salary_text: str | None
    skills: list | None
    quality_score: float
    is_active: bool
    created_at: datetime
