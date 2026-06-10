"""Reusable mixin for common entity fields.

This MUST NOT create its own database table.
This MUST NOT replace app/db/base.py.
"""

from datetime import datetime

from sqlalchemy import Column, DateTime, Integer
from sqlalchemy.orm import Mapped, mapped_column


class BaseEntity:
    """Mixin providing common entity columns: id, created_at, updated_at, deleted_at.

    Intended to be reused across future modules:
    - Jobs
    - CV
    - Interview
    - ChatHistory
    - AdminLog
    """

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )
    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime, default=None, nullable=True
    )
