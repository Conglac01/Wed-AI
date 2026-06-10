"""CSVJobSource — loads job listings from a CSV file."""

import csv
from pathlib import Path

from app.modules.jobs.schema import JobCreate
from app.modules.jobs.sources.base import BaseJobSource


def _normalize_skills(raw: str | None) -> list[str] | None:
    """Convert a semicolon-separated skills string to a deduplicated list.

    Rules:
      * Split on ';'
      * Trim whitespace from each token
      * Discard empty tokens
      * Deduplicate case-insensitively, keeping the casing of the *first* occurrence
      * Preserve order

    Returns None when the raw value is empty/None and no meaningful tokens remain.
    """
    if raw is None:
        return None

    tokens = [t.strip() for t in raw.split(";")]
    tokens = [t for t in tokens if t]  # remove empties

    if not tokens:
        return None

    seen: set[str] = set()
    deduped: list[str] = []
    for token in tokens:
        key = token.lower()
        if key not in seen:
            seen.add(key)
            deduped.append(token)

    return deduped if deduped else None


def _int_or_none(value: str) -> int | None:
    """Parse an integer from a CSV cell, returning None for empty strings."""
    stripped = value.strip()
    if stripped == "":
        return None
    try:
        return int(stripped)
    except ValueError:
        raise ValueError(
            f"Expected an integer or empty value, got: {stripped!r}"
        )


def _str_or_none(value: str) -> str | None:
    """Return the stripped string, or None for empty cells."""
    stripped = value.strip()
    return stripped if stripped else None


class CSVJobSource(BaseJobSource):
    """Loads and validates job listings from a semicolon-delimited CSV file."""

    def __init__(self, csv_path: str | Path) -> None:
        self._path = Path(csv_path)

    @property
    def source_name(self) -> str:
        return "CSV"

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def fetch_jobs(self) -> list[JobCreate]:
        """Read and validate every row from the CSV file.

        Raises ValueError for invalid rows or duplicate (title, company, location).
        """
        rows = self._read_rows()
        self._check_duplicates(rows)
        return [self._row_to_job(row, idx) for idx, row in enumerate(rows, start=2)]

    # ------------------------------------------------------------------
    # Internal
    # ------------------------------------------------------------------

    def _read_rows(self) -> list[dict[str, str]]:
        """Read all rows from the CSV.  Raises FileNotFoundError if missing."""
        if not self._path.exists():
            raise FileNotFoundError(f"CSV file not found: {self._path}")

        with open(self._path, newline="", encoding="utf-8-sig") as fh:
            reader = csv.DictReader(fh)
            rows = list(reader)

        if not rows:
            raise ValueError(f"CSV file is empty or has no data rows: {self._path}")

        return rows

    def _row_to_job(self, row: dict[str, str], line_number: int) -> JobCreate:
        """Convert a single CSV row into a validated JobCreate."""
        try:
            payload = {
                "title": row["title"].strip(),
                "company_name": row["company_name"].strip(),
                "location": row["location"].strip(),
                "description": row["description"].strip(),
                "company_logo_url": _str_or_none(row.get("company_logo_url", "")),
                "salary_text": _str_or_none(row.get("salary_text", "")),
                "salary_min": _int_or_none(row.get("salary_min", "")),
                "salary_max": _int_or_none(row.get("salary_max", "")),
                "skills": _normalize_skills(row.get("skills", "")),
                "requirements": _str_or_none(row.get("requirements", "")),
                "benefits": _str_or_none(row.get("benefits", "")),
                "deadline": _str_or_none(row.get("deadline", "")),
                "source_name": _str_or_none(row.get("source_name", "")) or "CSV",
                "source_url": _str_or_none(row.get("source_url", "")),
            }
        except KeyError as exc:
            raise ValueError(
                f"Row {line_number}: missing required column {exc}"
            ) from exc

        try:
            return JobCreate(**payload)
        except Exception as exc:
            raise ValueError(
                f"Row {line_number}: invalid job data — {exc}"
            ) from exc

    def _check_duplicates(self, rows: list[dict[str, str]]) -> None:
        """Raise ValueError if any rows share the same (title, company_name, location)."""
        seen: set[tuple[str, str, str]] = set()
        for idx, row in enumerate(rows, start=2):
            try:
                key = (
                    row["title"].strip().lower(),
                    row["company_name"].strip().lower(),
                    row["location"].strip().lower(),
                )
            except KeyError as exc:
                raise ValueError(
                    f"Row {idx}: missing required column {exc}"
                ) from exc
            if key in seen:
                raise ValueError(
                    f"Duplicate job found at row {idx}: "
                    f"({row['title'].strip()}, {row['company_name'].strip()}, "
                    f"{row['location'].strip()})"
                )
            seen.add(key)
