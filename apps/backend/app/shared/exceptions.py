"""Shared exception classes used across modules."""

from app.core.errors import AppError, NotFoundError, ValidationError

__all__ = ["AppError", "NotFoundError", "ValidationError"]
