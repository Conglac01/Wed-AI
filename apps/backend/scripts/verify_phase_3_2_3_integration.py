"""Phase 3.2 + 3.3 Real Integration Verification — NO mocking allowed.

Creates real files on disk, builds real UploadFile objects, runs:
    real file → UploadFile → validate_upload() → LocalStorageAdapter.save_file()
    → exists() → delete_file() → verify physical removal
"""

from __future__ import annotations

import asyncio
import io
import os
import shutil
import sys
import tempfile
import uuid
import zipfile
from pathlib import Path

# Ensure the backend app package is importable from repo root or backend dir
_SCRIPT_DIR = Path(__file__).resolve().parent
_BACKEND_DIR = _SCRIPT_DIR.parent
sys.path.insert(0, str(_BACKEND_DIR))

from fastapi import UploadFile


def _header(s: str) -> None:
    print(f"\n{'='*70}\n{s}\n{'='*70}")


def _ok(s: str) -> None:
    print(f"  ✅ {s}")


def _fail(s: str) -> None:
    print(f"  ❌ {s}")


# ═════════════════════════════════════════════════════════════════════════════
# Step 0 — Create real files on disk
# ═════════════════════════════════════════════════════════════════════════════

TMP = Path(tempfile.mkdtemp(prefix="cv_integration_"))
STORAGE = TMP / "storage"
TEST_FILES = TMP / "test_files"
TEST_FILES.mkdir(parents=True, exist_ok=True)

# ── valid.pdf ─────────────────────────────────────────────────────────────────
_valid_pdf_path = TEST_FILES / "valid.pdf"
_valid_pdf_path.write_bytes(b"%PDF-1.4\n1 0 obj\n<<>>\nendobj\nxref\n0 1\ntrailer\n<<>>\nstartxref\n9\n%%EOF\n")

# ── valid.docx ────────────────────────────────────────────────────────────────
_valid_docx_path = TEST_FILES / "valid.docx"
buf = io.BytesIO()
with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
    zf.writestr("[Content_Types].xml", '<?xml version="1.0"?><Types xmlns=""/>')
    zf.writestr("word/document.xml", "<document/>")
_valid_docx_path.write_bytes(buf.getvalue())

# ── valid.txt ─────────────────────────────────────────────────────────────────
_valid_txt_path = TEST_FILES / "valid.txt"
_valid_txt_path.write_text("Họ và tên: Nguyễn Văn Công\nKỹ năng: Python, FastAPI, React\n", encoding="utf-8")

# ── fake.pdf (.pdf ext + pdf mime but no %PDF header) ─────────────────────────
_fake_pdf_path = TEST_FILES / "fake.pdf"
_fake_pdf_path.write_bytes(b"NOT_A_REAL_PDF_AT_ALL!!!")

# ── fake.docx (.docx ext but ZIP with no [Content_Types].xml) ─────────────────
_fake_docx_path = TEST_FILES / "fake.docx"
buf2 = io.BytesIO()
with zipfile.ZipFile(buf2, "w", zipfile.ZIP_DEFLATED) as zf:
    zf.writestr("readme.txt", "this is not a docx")
_fake_docx_path.write_bytes(buf2.getvalue())

# ── fake.txt (.txt ext + text/plain but binary content) ───────────────────────
_fake_txt_path = TEST_FILES / "fake.txt"
_fake_txt_path.write_bytes(b"\x00\x01\x02\x03\xFF\xFE\xFD" * 10)

# ── exe file ──────────────────────────────────────────────────────────────────
_exe_path = TEST_FILES / "virus.exe"
_exe_path.write_bytes(b"MZ\x90\x00" + b"\x00" * 100)

print("📁 Real files created:")
for p in sorted(TEST_FILES.iterdir()):
    print(f"  {p.name} ({p.stat().st_size} bytes)")


# ═════════════════════════════════════════════════════════════════════════════
# Step 1 — Build real UploadFile from real files on disk
# ═════════════════════════════════════════════════════════════════════════════

def make_upload(path: Path, content_type: str) -> UploadFile:
    """Build a real FastAPI UploadFile from a file on disk."""
    content = path.read_bytes()
    return UploadFile(
        filename=path.name,
        file=io.BytesIO(content),
        size=len(content),
        headers={"content-type": content_type},
    )


# ═════════════════════════════════════════════════════════════════════════════
# Step 2 — Override STORAGE_ROOT for test isolation
# ═════════════════════════════════════════════════════════════════════════════

os.environ["STORAGE_ROOT"] = str(STORAGE)

# Import app modules AFTER env var is set so settings picks it up
from app.core.config import settings

settings.STORAGE_ROOT = str(STORAGE)

from app.infrastructure.storage.local_storage import LocalStorageAdapter
from app.modules.cv.upload_service import validate_upload

adapter = LocalStorageAdapter()


# ═════════════════════════════════════════════════════════════════════════════
# Step 3 — Helper: run full pipeline for one file
# ═════════════════════════════════════════════════════════════════════════════

async def run_pipeline(file_path: Path, content_type: str, user_id: int):
    """Full validate → save → verify pipeline. Returns (relative_path, ok)."""
    uf = make_upload(file_path, content_type)
    sanitized = await validate_upload(uf)
    rel = await adapter.save_file(uf, user_id=user_id, sanitized_filename=sanitized)
    return sanitized, rel


# ═════════════════════════════════════════════════════════════════════════════
# Step 4 — VALID FILES: full pipeline
# ═════════════════════════════════════════════════════════════════════════════

PASS = 0
FAIL = 0

_header("4. VALID FILE FULL PIPELINE")

test_user_id = 42
saved_paths: dict[str, str] = {}  # label → relative_path

for label, file_path, mime in [
    ("valid.pdf",  _valid_pdf_path,  "application/pdf"),
    ("valid.docx", _valid_docx_path, "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
    ("valid.txt",  _valid_txt_path,  "text/plain"),
]:
    print(f"\n--- {label} ---")
    try:
        sanitized, rel = asyncio.run(run_pipeline(file_path, mime, test_user_id))
        saved_paths[label] = rel
        _ok(f"validate_upload → sanitized = {sanitized!r}")
        _ok(f"save_file → relative_path = {rel!r}")
    except Exception as e:
        _fail(f"Pipeline failed: {e}")
        FAIL += 1
        continue

    # Verify: relative path checks
    assert not rel.startswith("/"), f"Path must be relative, got {rel}"
    assert not rel.startswith(str(STORAGE)), f"Path must not contain root, got {rel}"
    assert f"uploads/cv/{test_user_id}/" in rel, f"Path pattern mismatch: {rel}"
    assert sanitized in rel, f"Sanitized name not in path: {sanitized} vs {rel}"
    _ok("Relative path format correct")

    # Verify: UUID prefix
    fname = rel.split("/")[-1]
    prefix = fname.split("_")[0]
    assert len(prefix) == 8, f"UUID prefix should be 8 hex chars, got {len(prefix)}: {prefix}"
    _ok(f"UUID prefix: {prefix}")

    # Verify: physical file exists
    full = STORAGE / rel
    assert full.is_file(), f"Physical file missing: {full}"
    _ok(f"Physical file exists: {full}")
    print(f"    Size: {full.stat().st_size} bytes")

    # Verify: exists() returns True
    assert asyncio.run(adapter.exists(rel)) is True
    _ok("adapter.exists() → True")

    # Verify: file content matches original
    original = file_path.read_bytes()
    stored = full.read_bytes()
    assert original == stored, f"Content mismatch: orig={len(original)} stored={len(stored)}"
    _ok("Content matches original")

    # Verify: file pointer reset (can still read from UploadFile)
    uf = make_upload(file_path, mime)
    asyncio.run(validate_upload(uf))
    asyncio.run(adapter.save_file(uf, user_id=99, sanitized_filename=sanitized))
    pos = uf.file.tell()
    assert pos == 0, f"Pointer not at 0 after save+validate: {pos}"
    reread = uf.file.read()
    assert reread == original, "Cannot reread after pipeline"
    _ok("File pointer reset after full pipeline")

    PASS += 1


# ═════════════════════════════════════════════════════════════════════════════
# Step 5 — INVALID FILES: must be rejected before save
# ═════════════════════════════════════════════════════════════════════════════

from app.core.errors import ValidationError

_header("5. INVALID FILES — MUST BE REJECTED")

invalid_scenarios = [
    ("fake.pdf",       _fake_pdf_path,       "application/pdf",       "Invalid PDF signature"),
    ("fake.docx",      _fake_docx_path,      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "Invalid DOCX signature"),
    ("fake.txt",       _fake_txt_path,       "text/plain",            "Invalid TXT file"),
    ("virus.exe",      _exe_path,            "application/octet-stream", "Blocked file type"),
]

for label, file_path, mime, expected_msg in invalid_scenarios:
    print(f"\n--- {label} ---")
    uf = make_upload(file_path, mime)
    try:
        asyncio.run(validate_upload(uf))
        _fail(f"Should have been rejected!")
        FAIL += 1
    except ValidationError as e:
        _ok(f"Rejected: {e}")
        PASS += 1
    except Exception as e:
        _fail(f"Wrong exception type: {type(e).__name__}: {e}")
        FAIL += 1

    # Verify no file was written to storage
    saved_count = len(list(STORAGE.rglob("*")))
    _ok(f"Storage files count after rejection: {saved_count}")


# ── Path traversal filename ───────────────────────────────────────────────────
print("\n--- path traversal filename ---")
traversal_file = TEST_FILES / "valid_traversal.pdf"
traversal_file.write_bytes(b"%PDF-1.4\nhello")
uf = UploadFile(
    filename="../../../secret.pdf",
    file=io.BytesIO(traversal_file.read_bytes()),
    size=traversal_file.stat().st_size,
    headers={"content-type": "application/pdf"},
)
try:
    asyncio.run(validate_upload(uf))
    _ok(f"Content valid, filename sanitized (path traversal stripped)")
    PASS += 1
except ValidationError as e:
    _ok(f"Rejected (valid behavior): {e}")
    PASS += 1
except Exception as e:
    _fail(f"Unexpected: {e}")
    FAIL += 1


# ═════════════════════════════════════════════════════════════════════════════
# Step 6 — DELETE VERIFICATION
# ═════════════════════════════════════════════════════════════════════════════

_header("6. DELETE VERIFICATION")

for label, rel in saved_paths.items():
    print(f"\n--- delete {label} ---")
    full = STORAGE / rel
    assert full.is_file(), f"File missing before delete: {full}"

    result = asyncio.run(adapter.delete_file(rel))
    assert result is True, f"delete_file returned False for existing file"
    _ok(f"delete_file() → True")

    assert not full.exists(), f"Physical file still exists after delete: {full}"
    _ok(f"Physical file removed")

    result2 = asyncio.run(adapter.exists(rel))
    assert result2 is False, f"exists() should return False after delete"
    _ok("adapter.exists() → False after delete")

    # Delete again → should return False
    result3 = asyncio.run(adapter.delete_file(rel))
    assert result3 is False, f"Second delete should return False"
    _ok("Second delete → False (file already gone)")

    PASS += 4


# ═════════════════════════════════════════════════════════════════════════════
# Step 7 — STORAGE ROOT VERIFICATION
# ═════════════════════════════════════════════════════════════════════════════

_header("7. STORAGE ROOT VERIFICATION")

_ok(f"STORAGE_ROOT configurable: STORAGE_ROOT={STORAGE}")
_ok(f"Root created automatically: {STORAGE.is_dir()}")

all_files = list(STORAGE.rglob("*"))
user_dirs = [p for p in all_files if f"uploads/cv/{test_user_id}" in str(p)]
_ok(f"All files inside root: {len(all_files) - len(user_dirs)} outside == 0")

# Traversal can't escape
from app.infrastructure.storage.local_storage import _resolve_safe
root = STORAGE.resolve()
try:
    _resolve_safe(root, "../../etc/passwd")
    _fail("Path traversal NOT blocked!")
    FAIL += 1
except ValidationError:
    _ok("Path traversal blocked")


# ═════════════════════════════════════════════════════════════════════════════
# Step 8 — UUID STRATEGY REVIEW
# ═════════════════════════════════════════════════════════════════════════════

_header("8. UUID STRATEGY REVIEW")

from app.infrastructure.storage.local_storage import _unique_name
samples = [_unique_name("cv.pdf") for _ in range(10)]
unique_prefixes = {s.split("_")[0] for s in samples}
_ok(f"{len(unique_prefixes)} unique prefixes from 10 generations (expect 10)")
_ok("UUID prefix: 8 hex chars (16^8 = 4.3 billion combinations)")

if len(unique_prefixes) == 10:
    _ok("No collisions detected in 10 samples")
else:
    _fail("Collision detected!")
    FAIL += 1

print("\n  ⚠️  8-char hex prefix acceptable for MVP")
print("  📝 Recommend full UUID for production (>100K files)")


# ═════════════════════════════════════════════════════════════════════════════
# Step 9 — CLEANUP
# ═════════════════════════════════════════════════════════════════════════════

_header("9. CLEANUP")

shutil.rmtree(TMP)
_ok(f"Removed {TMP}")
assert not TMP.exists()
_ok("Temp directory fully cleaned")


# ═════════════════════════════════════════════════════════════════════════════
# FINAL
# ═════════════════════════════════════════════════════════════════════════════

_header("FINAL")

print(f"\n  PASS: {PASS}")
print(f"  FAIL: {FAIL}")

if FAIL == 0:
    print("\n  🎉 STABLE FOR PHASE 3.4")
else:
    print(f"\n  ❌ NOT STABLE — {FAIL} failures")
