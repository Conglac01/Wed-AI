"""User model."""

from sqlalchemy import Boolean, Column, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.modules.identity.constants import UserRole
from app.shared.base_entity import BaseEntity


class User(BaseEntity, Base):
    """User identity for ViecConnect IT Jobs."""

    __tablename__ = "users"

    email: Mapped[str] = mapped_column(
        String(255), unique=True, index=True, nullable=False
    )
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str | None] = mapped_column(String(255), default=None, nullable=True)
    role: Mapped[UserRole] = mapped_column(
        default=UserRole.USER, nullable=False
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
