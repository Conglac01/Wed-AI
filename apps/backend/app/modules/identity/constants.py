"""Identity module constants."""

import enum


class UserRole(str, enum.Enum):
    USER = "user"
    ADMIN = "admin"
