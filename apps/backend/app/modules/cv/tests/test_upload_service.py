"""Tests for the Upload Security Layer — all validation scenarios."""

import asyncio
import io
import struct
import zipfile

import pytest
from fastapi import UploadFile

from app.core.errors import ValidationError
from app.modules.cv.upload_service import (
    validate_extension,
    validate_mime_type,
    validate_signature,
    validate_file_size,
    sanitize_filename,
    validate_upload,
)


# ═════════════════════════════════════════════════════════════════════════════
# Helpers — create fake UploadFile objects for testing
# ═════════════════════════════════════════════════════════════════════════════

def _make_file(filename: str, content: bytes, content_type: str = "") -> UploadFile:
    """Create a Starlette UploadFile from in-memory bytes."""
    return UploadFile(
        filename=filename,
        file=io.BytesIO(content),
        size=len(content),
        headers={"content-type": content_type} if content_type else {},
    )


async def _read_all(file: UploadFile) -> bytes:
    await file.seek(0)
    data = await file.read()
    await file.seek(0)
    return data


def _make_pdf(filename: str = "resume.pdf", size: int = 1024) -> UploadFile:
    content = b"%PDF-1.4\n" + b"x" * (size - 9)
    return _make_file(filename, content, "application/pdf")


def _make_docx(filename: str = "resume.docx", size: int = 2048) -> UploadFile:
    """Create a minimal valid DOCX (ZIP with [Content_Types].xml)."""
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("[Content_Types].xml", '<?xml version="1.0"?><Types xmlns=""/>')
        zf.writestr("word/document.xml", "<document/>")
    content = buf.getvalue()
    # Pad to desired size if needed
    if len(content) < size:
        content = content + b"\x00" * (size - len(content))
    return _make_file(
        filename, content,
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    )


def _make_txt(filename: str = "notes.txt", size: int = 512) -> UploadFile:
    content = b"Hello, this is a valid text file.\nLine two.\n" * (size // 40 + 1)
    content = content[:size]
    return _make_file(filename, content, "text/plain")


def _make_zip_without_docx(filename: str = "fake.docx") -> UploadFile:
    """ZIP file that lacks [Content_Types].xml (invalid DOCX structure)."""
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("readme.txt", "hello")
    return _make_file(
        filename, buf.getvalue(),
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    )


# ═════════════════════════════════════════════════════════════════════════════
# EXTENSION VALIDATION
# ═════════════════════════════════════════════════════════════════════════════


class TestValidateExtension:
    def test_pdf_accepted(self):
        assert validate_extension("resume.pdf") == ".pdf"

    def test_docx_accepted(self):
        assert validate_extension("resume.docx") == ".docx"

    def test_txt_accepted(self):
        assert validate_extension("notes.txt") == ".txt"

    def test_uppercase_pdf_accepted(self):
        assert validate_extension("RESUME.PDF") == ".pdf"

    def test_mixed_case_docx_accepted(self):
        assert validate_extension("Resume.DocX") == ".docx"

    def test_empty_filename_rejected(self):
        with pytest.raises(ValidationError, match="Filename is empty"):
            validate_extension("")

    def test_missing_extension_rejected(self):
        with pytest.raises(ValidationError, match="Missing file extension"):
            validate_extension("noextension")

    def test_exe_rejected(self):
        with pytest.raises(ValidationError, match="Blocked file type"):
            validate_extension("malware.exe")

    def test_zip_rejected(self):
        with pytest.raises(ValidationError, match="Blocked file type"):
            validate_extension("archive.zip")

    def test_rar_rejected(self):
        with pytest.raises(ValidationError, match="Blocked file type"):
            validate_extension("archive.rar")

    def test_png_rejected(self):
        with pytest.raises(ValidationError, match="Blocked file type"):
            validate_extension("screenshot.png")

    def test_jpg_rejected(self):
        with pytest.raises(ValidationError, match="Blocked file type"):
            validate_extension("photo.jpg")

    def test_jpeg_rejected(self):
        with pytest.raises(ValidationError, match="Blocked file type"):
            validate_extension("photo.jpeg")

    def test_html_rejected(self):
        with pytest.raises(ValidationError, match="Blocked file type"):
            validate_extension("page.html")

    def test_js_rejected(self):
        with pytest.raises(ValidationError, match="Blocked file type"):
            validate_extension("script.js")

    def test_unknown_ext_rejected(self):
        with pytest.raises(ValidationError, match="Unsupported file type"):
            validate_extension("data.xyz")


# ═════════════════════════════════════════════════════════════════════════════
# MIME TYPE VALIDATION
# ═════════════════════════════════════════════════════════════════════════════


class TestValidateMimeType:
    def test_valid_pdf_mime(self):
        validate_mime_type("resume.pdf", "application/pdf")

    def test_valid_docx_mime(self):
        validate_mime_type(
            "resume.docx",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        )

    def test_valid_txt_mime(self):
        validate_mime_type("notes.txt", "text/plain")

    def test_fake_pdf_mime_rejected(self):
        with pytest.raises(ValidationError, match="Invalid MIME type"):
            validate_mime_type("resume.pdf", "text/plain")

    def test_fake_docx_mime_rejected(self):
        with pytest.raises(ValidationError, match="Invalid MIME type"):
            validate_mime_type("resume.docx", "application/zip")

    def test_fake_txt_mime_rejected(self):
        with pytest.raises(ValidationError, match="Invalid MIME type"):
            validate_mime_type("notes.txt", "application/octet-stream")

    def test_empty_mime_type_rejected(self):
        with pytest.raises(ValidationError, match="Missing content type"):
            validate_mime_type("resume.pdf", "")

    def test_unknown_ext_skips_mime_validation(self):
        """validate_mime_type should raise for an extension not in the allowed dict."""
        with pytest.raises(ValidationError, match="Cannot validate MIME"):
            validate_mime_type("data.xyz", "anything/here")


# ═════════════════════════════════════════════════════════════════════════════
# SIGNATURE VALIDATION
# ═════════════════════════════════════════════════════════════════════════════


class TestValidateSignature:
    def test_valid_pdf_passes(self):
        f = _make_pdf()
        asyncio.run(validate_signature(".pdf", f))

    def test_valid_docx_passes(self):
        f = _make_docx()
        asyncio.run(validate_signature(".docx", f))

    def test_valid_txt_passes(self):
        f = _make_txt()
        asyncio.run(validate_signature(".txt", f))

    def test_exe_renamed_to_pdf_rejected(self):
        # MZ header = Windows executable
        content = b"MZ\x90\x00" + b"x" * 100
        f = _make_file("resume.pdf", content, "application/pdf")
        with pytest.raises(ValidationError, match="Invalid PDF signature"):
            asyncio.run(validate_signature(".pdf", f))

    def test_invalid_pdf_header_rejected(self):
        content = b"NOTAPDF" + b"x" * 100
        f = _make_file("resume.pdf", content, "application/pdf")
        with pytest.raises(ValidationError, match="Invalid PDF signature"):
            asyncio.run(validate_signature(".pdf", f))

    def test_non_zip_renamed_to_docx_rejected(self):
        content = b"NOT_A_ZIP_FILE" * 50
        f = _make_file(
            "resume.docx", content,
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        )
        with pytest.raises(ValidationError, match="Invalid DOCX signature"):
            asyncio.run(validate_signature(".docx", f))

    def test_docx_missing_content_types_rejected(self):
        f = _make_zip_without_docx("resume.docx")
        with pytest.raises(ValidationError, match="missing \\[Content_Types\\].xml"):
            asyncio.run(validate_signature(".docx", f))

    def test_binary_renamed_to_txt_rejected(self):
        # Binary data with null bytes → txt should be rejected
        content = b"\x00\x01\x02\x03\xff\xfe\xfd" * 10
        f = _make_file("notes.txt", content, "text/plain")
        with pytest.raises(ValidationError, match="Invalid TXT file"):
            asyncio.run(validate_signature(".txt", f))

    def test_text_with_utf8_passes(self):
        # Vietnamese text must pass
        f = _make_file("notes.txt", "Xin chào Việt Nam".encode("utf-8"), "text/plain")
        asyncio.run(validate_signature(".txt", f))

    def test_non_utf8_binary_txt_rejected(self):
        content = bytes(range(128, 256)) * 3  # latin-1 bytes, not valid UTF-8
        f = _make_file("notes.txt", content, "text/plain")
        with pytest.raises(ValidationError, match="Invalid TXT file"):
            asyncio.run(validate_signature(".txt", f))

    def test_signature_resets_pointer(self):
        """After validate_signature, the file pointer should be back at 0."""
        f = _make_pdf()
        asyncio.run(validate_signature(".pdf", f))
        # tell() is sync on an in-memory BytesIO
        pos = f.file.tell()
        assert pos == 0  # pointer reset


# ═════════════════════════════════════════════════════════════════════════════
# FILE SIZE VALIDATION
# ═════════════════════════════════════════════════════════════════════════════


class TestValidateFileSize:
    def test_pdf_under_limit(self):
        validate_file_size(".pdf", 5 * 1024 * 1024)  # 5 MB

    def test_pdf_exceeds_limit(self):
        with pytest.raises(ValidationError, match="File too large"):
            validate_file_size(".pdf", 11 * 1024 * 1024)  # 11 MB

    def test_docx_under_limit(self):
        validate_file_size(".docx", 9 * 1024 * 1024)

    def test_docx_exceeds_limit(self):
        with pytest.raises(ValidationError, match="File too large"):
            validate_file_size(".docx", 11 * 1024 * 1024)

    def test_txt_under_limit(self):
        validate_file_size(".txt", 1 * 1024 * 1024)

    def test_txt_exceeds_limit(self):
        with pytest.raises(ValidationError, match="File too large"):
            validate_file_size(".txt", 3 * 1024 * 1024)

    def test_unknown_ext_size_rejected(self):
        with pytest.raises(ValidationError, match="Cannot validate size"):
            validate_file_size(".xyz", 100)


# ═════════════════════════════════════════════════════════════════════════════
# FILENAME SANITIZATION
# ═════════════════════════════════════════════════════════════════════════════


class TestSanitizeFilename:
    def test_simple_name_preserved(self):
        assert sanitize_filename("resume.pdf") == "resume.pdf"

    def test_path_traversal_removed(self):
        assert sanitize_filename("../../../secret.pdf") == "secret.pdf"

    def test_script_tags_removed(self):
        result = sanitize_filename("resume<script>.pdf")
        assert result == "resumescript.pdf"

    def test_spaces_to_underscore(self):
        assert sanitize_filename("my cv 2026.pdf") == "my_cv_2026.pdf"

    def test_unsafe_chars_removed(self):
        assert sanitize_filename('test:file"name.pdf') == "testfilename.pdf"

    def test_pipe_removed(self):
        assert sanitize_filename("a|b.pdf") == "ab.pdf"

    def test_question_mark_removed(self):
        assert sanitize_filename("what?.pdf") == "what.pdf"

    def test_semicolon_removed(self):
        assert sanitize_filename("file;name.pdf") == "filename.pdf"

    def test_repeated_separators_collapsed(self):
        assert sanitize_filename("my___cv---test.pdf") == "my_cv_test.pdf"

    def test_trailing_dots_trimmed(self):
        assert sanitize_filename("resume.pdf.") == "resume.pdf"

    def test_empty_filename_returns_empty(self):
        assert sanitize_filename("") == ""

    def test_whitespace_only_returns_empty(self):
        assert sanitize_filename("   ") == ""

    def test_all_unsafe_returns_untitled(self):
        assert sanitize_filename("<><><>.pdf") == "untitled.pdf"

    def test_unicode_preserved(self):
        # Vietnamese characters should be preserved
        result = sanitize_filename("hồ_sơ.pdf")
        assert "hồ_sơ" in result

    def test_extension_lowercased(self):
        assert sanitize_filename("Resume.DOCX") == "Resume.docx"


# ═════════════════════════════════════════════════════════════════════════════
# FULL VALIDATE_UPLOAD INTEGRATION
# ═════════════════════════════════════════════════════════════════════════════


class TestValidateUpload:
    def test_valid_pdf_passes(self):
        f = _make_pdf("resume.pdf", 2048)
        result = asyncio.run(validate_upload(f))
        assert result == "resume.pdf"

    def test_valid_docx_passes(self):
        f = _make_docx("cv.docx")
        result = asyncio.run(validate_upload(f))
        assert result == "cv.docx"

    def test_valid_txt_passes(self):
        f = _make_txt("notes.txt")
        result = asyncio.run(validate_upload(f))
        assert result == "notes.txt"

    def test_empty_file_rejected(self):
        f = _make_file("resume.pdf", b"", "application/pdf")
        with pytest.raises(ValidationError, match="Invalid PDF signature"):
            asyncio.run(validate_upload(f))

    def test_blocked_ext_rejected(self):
        f = _make_file("malware.exe", b"x" * 100)
        with pytest.raises(ValidationError, match="Blocked file type"):
            asyncio.run(validate_upload(f))

    def test_mime_spoof_rejected(self):
        f = _make_file("resume.pdf", b"%PDF-1.4\nhello", "text/plain")
        with pytest.raises(ValidationError, match="Invalid MIME type"):
            asyncio.run(validate_upload(f))

    def test_signature_spoof_rejected(self):
        f = _make_file("resume.pdf", b"NOTAPDF" * 20, "application/pdf")
        with pytest.raises(ValidationError, match="Invalid PDF signature"):
            asyncio.run(validate_upload(f))

    def test_sanitizes_filename_on_success(self):
        f = _make_pdf("my resume (final).pdf", 2048)
        result = asyncio.run(validate_upload(f))
        # Parentheses () are not in the unsafe char list; only whitespace → underscore
        assert result == "my_resume_(final).pdf"

    def test_null_filename_rejected(self):
        f = UploadFile(filename=None, file=io.BytesIO(b"data"))
        with pytest.raises(ValidationError, match="Filename is required"):
            asyncio.run(validate_upload(f))

    def test_pointer_reset_after_validation(self):
        f = _make_pdf("resume.pdf", 5000)
        asyncio.run(validate_upload(f))
        pos = f.file.tell()
        assert pos == 0  # must be reset for downstream consumers

    def test_txt_binary_content_rejected(self):
        content = bytes(range(256)) * 2
        f = _make_file("notes.txt", content, "text/plain")
        with pytest.raises(ValidationError, match="Invalid TXT file"):
            asyncio.run(validate_upload(f))

    def test_uppercase_ext_accepted(self):
        f = _make_file("RESUME.PDF", b"%PDF-1.4\nhello", "application/pdf")
        result = asyncio.run(validate_upload(f))
        assert result == "RESUME.pdf"
