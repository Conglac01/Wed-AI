"""Tests for LocalStorageAdapter — all save/delete/exists/path-safety scenarios."""

import asyncio
import io
import os
from pathlib import Path
from unittest.mock import patch

import pytest
from fastapi import UploadFile

from app.core.errors import ValidationError
from app.infrastructure.storage.local_storage import (
    LocalStorageAdapter,
    _safe_storage_dir,
    _resolve_safe,
    _unique_name,
)


# ═════════════════════════════════════════════════════════════════════════════
# Helpers
# ═════════════════════════════════════════════════════════════════════════════

def _make_file(filename: str = "resume.pdf", content: bytes | None = None) -> UploadFile:
    if content is None:
        content = b"%PDF-1.4\nreal pdf content\n"
    return UploadFile(
        filename=filename,
        file=io.BytesIO(bytes(content)),
        size=len(content),
    )


def _make_adapter(root: str | Path) -> LocalStorageAdapter:
    adapter = LocalStorageAdapter()
    adapter._root = Path(root).resolve()
    return adapter


# ═════════════════════════════════════════════════════════════════════════════
# _unique_name
# ═════════════════════════════════════════════════════════════════════════════


class TestUniqueName:
    def test_prefix_added(self):
        name = _unique_name("resume.pdf")
        # format: {8_hex}_{name}.ext
        parts = name.split("_", 1)
        assert len(parts) == 2
        assert len(parts[0]) == 8  # 8-char hex
        assert parts[1] == "resume.pdf"

    def test_collision_impossible(self):
        """Two calls must produce different names."""
        n1 = _unique_name("cv.pdf")
        n2 = _unique_name("cv.pdf")
        assert n1 != n2

    def test_preserves_extension(self):
        name = _unique_name("my_cv.docx")
        assert name.endswith(".docx")


# ═════════════════════════════════════════════════════════════════════════════
# _resolve_safe
# ═════════════════════════════════════════════════════════════════════════════


class TestResolveSafe:
    def test_normal_path_ok(self, tmp_path):
        root = tmp_path.resolve()
        file = root / "uploads" / "cv" / "resume.pdf"
        file.parent.mkdir(parents=True, exist_ok=True)
        file.write_text("hello")
        result = _resolve_safe(root, "uploads/cv/resume.pdf")
        assert result == file

    def test_traversal_blocked(self, tmp_path):
        root = tmp_path / "storage"
        root.mkdir()
        with pytest.raises(ValidationError, match="Path traversal denied"):
            _resolve_safe(root, "../../etc/passwd")

    def test_absolute_path_blocked(self, tmp_path):
        # /etc is outside the root
        root = tmp_path / "storage"
        root.mkdir()
        with pytest.raises(ValidationError, match="Path traversal denied"):
            _resolve_safe(root, "/etc/passwd")

    def test_leading_slash_is_treated_as_absolute(self, tmp_path):
        root = tmp_path.resolve()
        with pytest.raises(ValidationError, match="Path traversal denied"):
            _resolve_safe(root, "/uploads/test.txt")


# ═════════════════════════════════════════════════════════════════════════════
# save_file
# ═════════════════════════════════════════════════════════════════════════════


class TestSaveFile:
    def test_save_valid_file(self, tmp_path):
        adapter = _make_adapter(tmp_path)
        f = _make_file("resume.pdf")
        rel = asyncio.run(adapter.save_file(f, user_id=123, sanitized_filename="resume.pdf"))
        assert rel.startswith("uploads/cv/123/")
        assert rel.endswith(".pdf")
        full = tmp_path / rel
        assert full.is_file()

    def test_creates_user_dir_automatically(self, tmp_path):
        adapter = _make_adapter(tmp_path)
        user_dir = tmp_path / "uploads" / "cv" / "456"
        assert not user_dir.exists()
        f = _make_file()
        asyncio.run(adapter.save_file(f, user_id=456, sanitized_filename="cv.pdf"))
        assert user_dir.is_dir()

    def test_stores_relative_path(self, tmp_path):
        adapter = _make_adapter(tmp_path)
        f = _make_file()
        rel = asyncio.run(adapter.save_file(f, user_id=1, sanitized_filename="cv.pdf"))
        # Must be relative, not absolute
        assert not rel.startswith("/")
        assert not rel.startswith(str(tmp_path))

    def test_uuid_filename_generated(self, tmp_path):
        adapter = _make_adapter(tmp_path)
        f = _make_file()
        rel = asyncio.run(adapter.save_file(f, user_id=1, sanitized_filename="resume.pdf"))
        fname = rel.split("/")[-1]
        # must match {8_hex}_{name}.ext pattern
        assert "_" in fname
        uuid_part = fname.split("_")[0]
        assert len(uuid_part) == 8

    def test_pointer_reset_after_save(self, tmp_path):
        adapter = _make_adapter(tmp_path)
        content = b"%PDF-1.4\ntest pdf"
        f = _make_file("resume.pdf", content=content)
        asyncio.run(adapter.save_file(f, user_id=1, sanitized_filename="resume.pdf"))
        # After save, pointer should be back at 0 for downstream
        pos = f.file.tell()
        assert pos == 0
        # Content should still be readable
        reread = f.file.read()
        assert reread == content

    def test_different_users_separate_dirs(self, tmp_path):
        adapter = _make_adapter(tmp_path)
        f1 = _make_file("a.pdf")
        f2 = _make_file("b.pdf")
        r1 = asyncio.run(adapter.save_file(f1, user_id=1, sanitized_filename="a.pdf"))
        r2 = asyncio.run(adapter.save_file(f2, user_id=2, sanitized_filename="b.pdf"))
        assert "uploads/cv/1/" in r1
        assert "uploads/cv/2/" in r2
        assert r1 != r2

    def test_same_filename_does_not_overwrite(self, tmp_path):
        adapter = _make_adapter(tmp_path)
        f1 = _make_file("cv.pdf", content=b"content_1")
        f2 = _make_file("cv.pdf", content=b"content_2")
        r1 = asyncio.run(adapter.save_file(f1, user_id=1, sanitized_filename="cv.pdf"))
        r2 = asyncio.run(adapter.save_file(f2, user_id=1, sanitized_filename="cv.pdf"))
        assert r1 != r2
        assert (tmp_path / r1).read_bytes() == b"content_1"
        assert (tmp_path / r2).read_bytes() == b"content_2"


# ═════════════════════════════════════════════════════════════════════════════
# exists
# ═════════════════════════════════════════════════════════════════════════════


class TestExists:
    def test_file_exists(self, tmp_path):
        adapter = _make_adapter(tmp_path)
        f = _make_file()
        rel = asyncio.run(adapter.save_file(f, user_id=1, sanitized_filename="cv.pdf"))
        assert asyncio.run(adapter.exists(rel)) is True

    def test_file_missing(self, tmp_path):
        adapter = _make_adapter(tmp_path)
        assert asyncio.run(adapter.exists("uploads/cv/1/nonexistent.pdf")) is False

    def test_traversal_returns_false(self, tmp_path):
        adapter = _make_adapter(tmp_path)
        assert asyncio.run(adapter.exists("../../etc/passwd")) is False


# ═════════════════════════════════════════════════════════════════════════════
# delete_file
# ═════════════════════════════════════════════════════════════════════════════


class TestDeleteFile:
    def test_delete_existing(self, tmp_path):
        adapter = _make_adapter(tmp_path)
        f = _make_file()
        rel = asyncio.run(adapter.save_file(f, user_id=1, sanitized_filename="cv.pdf"))
        assert (tmp_path / rel).is_file()
        result = asyncio.run(adapter.delete_file(rel))
        assert result is True
        assert not (tmp_path / rel).is_file()

    def test_delete_missing_returns_false(self, tmp_path):
        adapter = _make_adapter(tmp_path)
        result = asyncio.run(adapter.delete_file("uploads/cv/1/nope.pdf"))
        assert result is False

    def test_delete_twice_returns_false(self, tmp_path):
        adapter = _make_adapter(tmp_path)
        f = _make_file()
        rel = asyncio.run(adapter.save_file(f, user_id=1, sanitized_filename="cv.pdf"))
        assert asyncio.run(adapter.delete_file(rel)) is True
        assert asyncio.run(adapter.delete_file(rel)) is False

    def test_traversal_rejected_for_delete(self, tmp_path):
        adapter = _make_adapter(tmp_path)
        # Must not delete files outside storage root
        assert asyncio.run(adapter.delete_file("../../etc/passwd")) is False


# ═════════════════════════════════════════════════════════════════════════════
# Edge cases
# ═════════════════════════════════════════════════════════════════════════════


class TestEdgeCases:
    def test_empty_file_saved(self, tmp_path):
        adapter = _make_adapter(tmp_path)
        f = _make_file("empty.pdf", content=b"")
        rel = asyncio.run(adapter.save_file(f, user_id=1, sanitized_filename="empty.pdf"))
        full = tmp_path / rel
        assert full.is_file()
        assert full.read_bytes() == b""

    def test_no_extension_filename(self, tmp_path):
        adapter = _make_adapter(tmp_path)
        f = _make_file("noext", content=b"some pdf data")
        rel = asyncio.run(adapter.save_file(f, user_id=1, sanitized_filename="noext"))
        assert "noext" in rel

    def test_large_file(self, tmp_path):
        adapter = _make_adapter(tmp_path)
        content = b"x" * (2 * 1024 * 1024)  # 2 MB
        f = _make_file("big.pdf", content=content)
        rel = asyncio.run(adapter.save_file(f, user_id=1, sanitized_filename="big.pdf"))
        full = tmp_path / rel
        assert full.is_file()
        assert full.stat().st_size == len(content)

    def test_special_chars_sanitized_filename(self, tmp_path):
        adapter = _make_adapter(tmp_path)
        # sanitized name already cleaned by upload_service
        f = _make_file()
        rel = asyncio.run(adapter.save_file(f, user_id=1, sanitized_filename="my_cv.pdf"))
        assert "my_cv" in rel

    def test_user_dir_permissions(self, tmp_path):
        adapter = _make_adapter(tmp_path)
        f = _make_file()
        rel = asyncio.run(adapter.save_file(f, user_id=12345, sanitized_filename="cv.pdf"))
        full = tmp_path / rel
        assert os.access(full, os.R_OK)
        assert os.access(full, os.W_OK)
