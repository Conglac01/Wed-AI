"""UserService — business logic including auth operations."""

from sqlalchemy.orm import Session

from app.core.security import (
    create_access_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.modules.identity.model import User
from app.modules.identity.repository import UserRepository
from app.modules.identity.schema import (
    RefreshTokenRequest,
    TokenResponse,
    UserCreateInternal,
    UserLoginRequest,
    UserRead,
    UserRegisterRequest,
    UserUpdate,
)


class UserService:
    """User domain logic. Delegates persistence to UserRepository."""

    def __init__(self, db: Session):
        self.repo = UserRepository(db)

    # ------------------------------------------------------------------
    # Read
    # ------------------------------------------------------------------

    def get_user_by_id(self, user_id: int) -> UserRead | None:
        user = self.repo.get_by_id(user_id)
        if user is None:
            return None
        return UserRead.model_validate(user)

    def get_user_by_email(self, email: str) -> UserRead | None:
        user = self.repo.get_by_email(email)
        if user is None:
            return None
        return UserRead.model_validate(user)

    # ------------------------------------------------------------------
    # Write
    # ------------------------------------------------------------------

    def create_user(self, data: UserCreateInternal) -> UserRead:
        user = self.repo.create(data)
        return UserRead.model_validate(user)

    def update_user(self, user_id: int, data: UserUpdate) -> UserRead:
        user = self.repo.update(user_id, data)
        return UserRead.model_validate(user)

    def deactivate_user(self, user_id: int) -> UserRead:
        user = self.repo.deactivate(user_id)
        return UserRead.model_validate(user)

    # ------------------------------------------------------------------
    # Auth
    # ------------------------------------------------------------------

    def register_user(self, data: UserRegisterRequest) -> UserRead:
        """Register a new user account."""
        # 1. Check duplicate email
        existing = self.repo.get_by_email(data.email)
        if existing is not None:
            raise ValueError("Email already registered")

        # 2. Validate password length
        if len(data.password) < 8:
            raise ValueError("Password must be at least 8 characters")

        # 3. Hash password
        hashed = hash_password(data.password)

        # 4. Create user with USER role
        internal = UserCreateInternal(
            email=data.email,
            password_hash=hashed,
            full_name=data.full_name,
        )
        return self.create_user(internal)

    def authenticate_user(self, data: UserLoginRequest) -> UserRead:
        """Authenticate a user by email + password. Returns user on success."""
        # 1. Find user by email
        user = self.repo.get_by_email(data.email)
        if user is None:
            raise ValueError("Invalid email or password")

        # 2. Check active
        if not user.is_active:
            raise ValueError("User is inactive")

        # 3. Verify password
        if not verify_password(data.password, user.password_hash):
            raise ValueError("Invalid email or password")

        return UserRead.model_validate(user)

    def refresh_access_token(self, data: RefreshTokenRequest) -> TokenResponse:
        """Issue a new access token from a valid refresh token."""
        # 1. Decode token — may raise ValueError
        payload = decode_token(data.refresh_token)

        # 2. Validate payload shape
        sub = payload.get("sub")
        token_type = payload.get("type")
        if sub is None:
            raise ValueError("Invalid refresh token")
        if token_type != "refresh":
            raise ValueError("Invalid refresh token")

        # 3. Ensure user still exists and is active
        user = self.repo.get_by_id(int(sub))
        if user is None or not user.is_active:
            raise ValueError("Invalid refresh token")

        # 4. Issue new access token only (no new refresh token)
        access_token = create_access_token(subject=sub)
        return TokenResponse(access_token=access_token, refresh_token=None)

    def get_current_user_by_id(self, user_id: int) -> UserRead:
        """Return the user if they exist and are active."""
        user = self.repo.get_by_id(user_id)
        if user is None:
            raise ValueError("User not found")
        if not user.is_active:
            raise ValueError("User is inactive")
        return UserRead.model_validate(user)
