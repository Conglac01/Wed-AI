"""Abstract Storage Adapter — provider-independent interface for file storage.

Future implementations (S3, MinIO) must implement this interface without
modifying the CV module.
"""

from __future__ import annotations

from abc import ABC, abstractmethod

from fastapi import UploadFile


class StorageAdapter(ABC):
    """Abstract interface for storing validated CV uploads.

    Implementations receive a sanitized filename from the Upload Security Layer
    and must not re-validate or re-sanitize.
    """

    @abstractmethod
    async def save_file(
        self, file: UploadFile, user_id: int, sanitized_filename: str
    ) -> str:
        """Persist *file* for *user_id* and return the relative storage path.

        Args:
            file: A validated UploadFile whose pointer is at position 0.
            user_id: The owning user's primary key.
            sanitized_filename: Already-sanitized filename from upload_service.

        Returns:
            Relative path suitable for storing in ``CV.original_file_path``.
            Example: ``uploads/cv/123/3f0f9d55_resume.pdf``
        """
        ...

    @abstractmethod
    async def delete_file(self, relative_path: str) -> bool:
        """Delete the file at *relative_path*.  Returns True if the file existed.

        Args:
            relative_path: A relative path previously returned by ``save_file``.

        Returns:
            ``True`` if the file was deleted, ``False`` if it did not exist.
        """
        ...

    @abstractmethod
    async def exists(self, relative_path: str) -> bool:
        """Return ``True`` if a file exists at *relative_path*."""
        ...
