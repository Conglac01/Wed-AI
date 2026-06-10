"""Base application exceptions."""


class AppError(Exception):
    """Base exception for all application-level errors."""

    def __init__(self, message: str, *, code: str = "APP_ERROR"):
        self.message = message
        self.code = code
        super().__init__(message)


class NotFoundError(AppError):
    """Resource not found."""

    def __init__(self, message: str = "Resource not found"):
        super().__init__(message, code="NOT_FOUND")


class ValidationError(AppError):
    """Validation failure."""

    def __init__(self, message: str = "Validation failed"):
        super().__init__(message, code="VALIDATION_ERROR")
