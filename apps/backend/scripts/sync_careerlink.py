#!/usr/bin/env python3
r"""
Manual CareerLink sync script.

Usage:
    python scripts/sync_careerlink.py
    python scripts/sync_careerlink.py --limit 10
    python scripts/sync_careerlink.py --listing-url <url>

Exit codes:
    0  sync completed (even if some jobs failed)
    1  bootstrap or setup failure
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

# Ensure the backend package is importable.
_here = Path(__file__).resolve().parent
sys.path.insert(0, str(_here.parent))


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Sync CareerLink IT jobs into the database."
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=50,
        help="Maximum number of detail pages to fetch (default: 50).",
    )
    parser.add_argument(
        "--listing-url",
        type=str,
        default=None,
        help="Override the default CareerLink IT listing URL.",
    )
    args = parser.parse_args()

    # ── Bootstrap the application ──────────────────────────────────
    try:
        from app.db.session import SessionLocal
        from app.modules.jobs.crawler_tasks import run_careerlink_crawl
        from app.core.config import settings
    except Exception as exc:
        print(f"❌ Bootstrap failed: {exc}", file=sys.stderr)
        return 1

    if not settings.DATABASE_URL:
        print("❌ DATABASE_URL is not set.", file=sys.stderr)
        return 1

    # ── Run the crawl ──────────────────────────────────────────────
    db = SessionLocal()
    try:
        summary = run_careerlink_crawl(
            db,
            listing_url=args.listing_url,
            max_jobs=args.limit,
            timeout_seconds=settings.JOBS_SYNC_TIMEOUT_SECONDS,
            request_delay_seconds=settings.CRAWLER_REQUEST_DELAY_SECONDS,
        )
    finally:
        db.close()

    # ── Print results ──────────────────────────────────────────────
    print()
    print("=" * 50)
    print(f"Source:   {summary.source}")
    print(f"Fetched:  {summary.fetched}")
    print(f"Imported: {summary.imported}")
    print(f"Skipped:  {summary.skipped}")
    print(f"Failed:   {summary.failed}")
    print(f"Errors:   {len(summary.errors)}")
    print("=" * 50)

    if summary.errors:
        print("\nErrors:")
        for err in summary.errors[:10]:
            print(f"  • {err}")
        if len(summary.errors) > 10:
            print(f"  … and {len(summary.errors) - 10} more")

    if summary.imported > 0:
        print(f"\n✅ {summary.imported} new jobs imported successfully.")
    elif summary.skipped > 0:
        print(f"\nℹ️  All {summary.skipped} fetched jobs were duplicates — no new imports.")
    else:
        print("\n⚠️  No jobs were imported.")

    return 0


if __name__ == "__main__":
    sys.exit(main())
