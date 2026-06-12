"""Local filesystem storage adapter for CV uploads."""

from __future__ import annotations

import os
import uuid
from pathlib import Path

from fastapi import UploadFile

from app.core.config import settings
from app.core.errors import ValidationError
from app.infrastructure.storage.storage_adapter import StorageAdapter


def _safe_storage_dir(root: Path, user_id: int) -> Path:
    """Return the target directory for *user_id* under *root*.

    Ensures the directory exists.  Never escapes the storage root.
    """
    clean_id = str(user_id).lstrip("/.")
    if not clean_id:
        raise ValidationError("Invalid user ID")
    target_dir = root / "uploads" / "cv" / clean_id
    target_dir.mkdir(parents=True, exist_ok=True)
    return target_dir


def _resolve_safe(root: Path, relative_path: str) -> Path:
    """Resolve *relative_path* against *root* and verify it does not escape.

    Raises:
        ValidationError: If the resolved path would be outside *root*.
    """
    # Absolute paths are always a traversal attempt
    if relative_path.startswith("/"):
        raise ValidationError(f"Path traversal denied: {relative_path!r}")

    clean = relative_path.lstrip("/")
    full = (root / clean).resolve()
    if not str(full).startswith(str(root)):
        raise ValidationError(f"Path traversal denied: {relative_path!r}")
    return full


def _unique_name(sanitized_filename: str) -> str:
    """Generate a collision-proof storage filename.

    Returns ``{uuid_short}_{sanitized_filename}`` where *uuid_short* is the
    first 8 hex characters of a UUID4.

    Examples:
        ``sanitized_filename`` = ``my_cv.pdf``
        → ``3f0f9d55_my_cv.pdf``
    """
    prefix = uuid.uuid4().hex[:8]
    return f"{prefix}_{sanitized_filename}"


class LocalStorageAdapter(StorageAdapter):
    """Stores CV files on the local filesystem under ``STORAGE_ROOT``.

    Filenames are collision-proof (UUID4-prefixed).  Paths are relative so
    they remain portable across deployments.
    """

    def __init__(self) -> None:
        self._root = Path(settings.STORAGE_ROOT).resolve()

    # ── StorageAdapter contract ───────────────────────────────────────────────

    async def save_file(
        self, file: UploadFile, user_id: int, sanitized_filename: str
    ) -> str:
        """Write *file* to disk, returning a relative path suitable for the DB."""
        target_dir = _safe_storage_dir(self._root, user_id)
        unique_name = _unique_name(sanitized_filename)
        full_path = target_dir / unique_name

        # ── Write ────────────────────────────────────────────────────
        await file.seek(0)
        content = await file.read()
        await file.seek(0)  # reset for downstream consumers

        full_path.write_bytes(content)

        # ── Return relative path ─────────────────────────────────────
        rel = full_path.relative_to(self._root)
        return str(rel).replace("\\", "/")  # POSIX normalisation

    async def delete_file(self, relative_path: str) -> bool:
        """Delete the file at *relative_path*.  Returns True if it existed."""
        try:
            target = _resolve_safe(self._root, relative_path)
        except ValidationError:
            return False

        if target.is_file():
            target.unlink()
            return True
        return False

    async def exists(self, relative_path: str) -> bool:
        """Return True if *relative_path* points to an existing file."""
        try:
            target = _resolve_safe(self._root, relative_path)
        except ValidationError:
            return False
        return target.is_file()
