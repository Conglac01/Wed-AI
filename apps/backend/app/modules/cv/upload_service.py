"""Upload Security Layer — validates CV files before they enter the system.

Reusable async validation service for FastAPI UploadFile objects.
No coupling to routers, storage, or extraction implementations.
"""

from __future__ import annotations

import re
import zipfile
from io import BytesIO
from typing import Final

from fastapi import UploadFile

from app.core.errors import ValidationError

# ═════════════════════════════════════════════════════════════════════════════
# Configuration Constants
# ═════════════════════════════════════════════════════════════════════════════

ALLOWED_EXTENSIONS: Final[set[str]] = {".pdf", ".docx", ".txt"}
BLOCKED_EXTENSIONS: Final[set[str]] = {
    ".exe", ".zip", ".rar", ".7z",
    ".png", ".jpg", ".jpeg", ".gif", ".webp",
    ".mp4", ".mov",
    ".html", ".js",
}

ALLOWED_MIME_TYPES: Final[dict[str, set[str]]] = {
    ".pdf":  {"application/pdf"},
    ".docx": {"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},
    ".txt":  {"text/plain"},
}

MAX_FILE_SIZES: Final[dict[str, int]] = {
    ".pdf":  10 * 1024 * 1024,   # 10 MB
    ".docx": 10 * 1024 * 1024,   # 10 MB
    ".txt":   2 * 1024 * 1024,   #  2 MB
}

# ── Magic bytes ───────────────────────────────────────────────────────────────

PDF_MAGIC: Final[bytes] = b"%PDF"
ZIP_MAGIC: Final[bytes] = b"PK\x03\x04"
DOCX_REQUIRED_ENTRY: Final[str] = "[Content_Types].xml"

# ── Filename sanitization ─────────────────────────────────────────────────────

_UNSAFE_CHARS_RE = re.compile(r'[<>:"/\\|?*;\']')
_WHITESPACE_RE = re.compile(r"\s+")
_SEPARATOR_COLLAPSE_RE = re.compile(r"[_-]{2,}")


# ═════════════════════════════════════════════════════════════════════════════
# Validation Helpers
# ═════════════════════════════════════════════════════════════════════════════

def _get_extension(filename: str) -> str:
    """Extract the lowercase file extension including the dot.  Empty string if none."""
    dot = filename.rfind(".")
    if dot == -1 or dot == len(filename) - 1:
        return ""
    return filename[dot:].lower()


# ═════════════════════════════════════════════════════════════════════════════
# Public API
# ═════════════════════════════════════════════════════════════════════════════


def validate_extension(filename: str) -> str:
    """Validate that *filename* has an allowed extension.  Returns the extension.

    Raises:
        ValidationError: Blocked or unsupported extension, or missing extension.
    """
    if not filename or not filename.strip():
        raise ValidationError("Filename is empty")

    ext = _get_extension(filename)

    if not ext:
        raise ValidationError(f"Missing file extension: {filename!r}")

    if ext in BLOCKED_EXTENSIONS:
        raise ValidationError(f"Blocked file type: {ext}")

    if ext not in ALLOWED_EXTENSIONS:
        raise ValidationError(
            f"Unsupported file type: {ext}. "
            f"Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )

    return ext


def validate_mime_type(filename: str, mime_type: str) -> None:
    """Validate that the MIME type matches the extension.

    Raises:
        ValidationError: Unknown MIME, or MIME/extension mismatch.
    """
    ext = _get_extension(filename)

    allowed = ALLOWED_MIME_TYPES.get(ext)
    if allowed is None:
        raise ValidationError(f"Cannot validate MIME for unknown extension: {ext}")

    if not mime_type:
        raise ValidationError("Missing content type")

    # Normalise — strip charset suffixes like "; charset=utf-8"
    normalised = mime_type.split(";")[0].strip().lower()

    if normalised not in allowed:
        raise ValidationError(
            f"Invalid MIME type for {ext}: {mime_type!r}. Expected: {', '.join(sorted(allowed))}"
        )


async def validate_signature(ext: str, file: UploadFile) -> None:
    """Validate file content against its declared extension using magic bytes.

    Raises:
        ValidationError: Signature mismatch, or invalid internal structure.
    """
    # ── Read leading bytes ──────────────────────────────────────────
    await file.seek(0)
    header = await file.read(1024)  # enough for all sig checks
    await file.seek(0)              # reset for downstream consumers

    if ext == ".pdf":
        if not header.startswith(PDF_MAGIC):
            raise ValidationError("Invalid PDF signature: file does not start with %PDF")

    elif ext == ".docx":
        if not header.startswith(ZIP_MAGIC):
            raise ValidationError("Invalid DOCX signature: file is not a valid ZIP archive")

        # ── Internal DOCX structure check ──────────────────────────
        await file.seek(0)
        content = await file.read()
        await file.seek(0)

        try:
            with zipfile.ZipFile(BytesIO(content)) as zf:
                names = zf.namelist()
        except (zipfile.BadZipFile, zipfile.LargeZipFile) as exc:
            raise ValidationError(f"Invalid DOCX archive: {exc}") from exc

        if DOCX_REQUIRED_ENTRY not in names:
            raise ValidationError(
                f"Invalid DOCX structure: missing {DOCX_REQUIRED_ENTRY}"
            )

    elif ext == ".txt":
        # Text files must be readable text, not binary
        try:
            text = header.decode("utf-8", errors="strict")
        except UnicodeDecodeError:
            raise ValidationError("Invalid TXT file: content is binary, not text")

        # Additional heuristic: null bytes indicate binary
        if b"\x00" in header:
            raise ValidationError("Invalid TXT file: contains null bytes (binary content)")


def validate_file_size(ext: str, file_size: int) -> None:
    """Validate that *file_size* in bytes does not exceed the limit for *ext*.

    Raises:
        ValidationError: File exceeds size limit, or unknown extension.
    """
    max_size = MAX_FILE_SIZES.get(ext)
    if max_size is None:
        raise ValidationError(f"Cannot validate size for unknown extension: {ext}")

    if file_size > max_size:
        max_mb = max_size / (1024 * 1024)
        current_mb = file_size / (1024 * 1024)
        raise ValidationError(
            f"File too large: {current_mb:.1f} MB exceeds {max_mb:.0f} MB limit for {ext}"
        )


def sanitize_filename(filename: str) -> str:
    """Return a safe, normalised filename.

    - Removes unsafe characters: ``< > : \" / \\ | ? * ; '``
    - Collapses whitespace → single underscore
    - Collapses repeated separators
    - Trims leading/trailing separators and dots
    - Preserves extension
    - Returns empty string for empty input

    Does NOT generate storage paths — that belongs to the Storage Layer.
    """
    if not filename or not filename.strip():
        return ""

    # Split extension off before sanitizing the name part
    ext = _get_extension(filename)
    name = filename[: len(filename) - len(ext)] if ext else filename
    if ext:
        ext = ext.lower()

    # Remove unsafe characters
    name = _UNSAFE_CHARS_RE.sub("", name)

    # Replace whitespace with underscores
    name = _WHITESPACE_RE.sub("_", name)

    # Collapse repeated separators
    name = _SEPARATOR_COLLAPSE_RE.sub("_", name)

    # Trim leading/trailing separators and dots
    name = name.strip("_.-")

    if not name:
        name = "untitled"

    return f"{name}{ext}"


async def validate_upload(file: UploadFile) -> str:
    """Full validation pipeline for a CV upload.

    Executes in order:
        1. extension validation
        2. MIME type validation
        3. file size validation
        4. magic-byte signature validation
        5. filename sanitization

    Returns:
        The sanitized filename (str).

    Raises:
        ValidationError: On any validation failure.
    """
    if file.filename is None:
        raise ValidationError("Filename is required")

    # 1. Extension
    ext = validate_extension(file.filename)

    # 2. Content type
    if file.content_type:
        validate_mime_type(file.filename, file.content_type)

    # 3. File size — read full content to determine size, then reset
    await file.seek(0)
    content = await file.read()
    await file.seek(0)
    file_size = len(content)

    validate_file_size(ext, file_size)

    # 4. Signature
    await validate_signature(ext, file)

    # 5. Sanitize filename
    safe_name = sanitize_filename(file.filename)

    return safe_name
