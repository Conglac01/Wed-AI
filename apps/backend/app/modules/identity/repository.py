"""UserRepository — database access layer. No business logic."""

from datetime import datetime

from sqlalchemy.orm import Session

from app.core.errors import NotFoundError
from app.modules.identity.model import User
from app.modules.identity.schema import UserCreateInternal, UserUpdate


class UserRepository:
    """Data access for the users table."""

    def __init__(self, db: Session):
        self.db = db

    # ------------------------------------------------------------------
    # Read
    # ------------------------------------------------------------------

    def get_by_id(self, user_id: int) -> User | None:
        """Return a user by primary key, or None."""
        return self.db.query(User).filter(User.id == user_id).first()

    def get_by_email(self, email: str) -> User | None:
        """Return a user by email address, or None."""
        return self.db.query(User).filter(User.email == email).first()

    # ------------------------------------------------------------------
    # Write
    # ------------------------------------------------------------------

    def create(self, data: UserCreateInternal) -> User:
        """Insert a new user row. Caller is responsible for password hashing."""
        user = User(
            email=data.email,
            password_hash=data.password_hash,
            full_name=data.full_name,
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def update(self, user_id: int, data: UserUpdate) -> User:
        """Update mutable fields on an existing user. Raises NotFoundError."""
        user = self.get_by_id(user_id)
        if user is None:
            raise NotFoundError(f"User with id={user_id} not found")

        if data.full_name is not None:
            user.full_name = data.full_name

        self.db.commit()
        self.db.refresh(user)
        return user

    def deactivate(self, user_id: int) -> User:
        """Soft-delete a user: set is_active=False and deleted_at=now."""
        user = self.get_by_id(user_id)
        if user is None:
            raise NotFoundError(f"User with id={user_id} not found")

        user.is_active = False
        user.deleted_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(user)
        return user
