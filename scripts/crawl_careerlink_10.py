#!/usr/bin/env python3
"""Polite CareerLink crawler — limit jobs → CSV → optional DB import."""

from __future__ import annotations

import argparse, csv, logging, random, sys, time
from pathlib import Path

import requests

_REPO = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_REPO / "apps" / "backend"))

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s", datefmt="%H:%M:%S")
log = logging.getLogger("crawl")

LISTING_URL = "https://careerlink.vn/viec-lam/cntt-phan-mem/19"
CSV_PATH = _REPO / "data" / "sample" / "careerlink_jobs_10.csv"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"
FIELDS = [
    "title", "company_name", "company_logo_url", "location",
    "salary_text", "salary_min", "salary_max", "skills",
    "description", "requirements", "benefits", "deadline",
    "source_name", "source_url", "quality_score", "is_active",
]


def _session():
    s = requests.Session()
    s.headers.update({"User-Agent": UA, "Accept": "text/html,application/xhtml+xml,*/*", "Accept-Language": "vi-VN,vi;q=0.9"})
    return s


def _blocked(html: str) -> bool:
    from app.modules.jobs.source_guard import is_blocked_response
    return is_blocked_response(html)


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--limit", type=int, default=10)
    p.add_argument("--csv-only", action="store_true")
    p.add_argument("--skip-import", action="store_true")
    args = p.parse_args()
    limit = min(args.limit, 20)
    skip_import = args.csv_only or args.skip_import

    # Bootstrap
    try:
        from app.modules.jobs.parsers.listing_parser import extract_job_links
        from app.modules.jobs.parsers.detail_parser import parse_job_detail
        from app.modules.jobs.source_guard import is_blocked_response
        from app.modules.jobs.pipeline.quality_score import calculate_quality_score
    except ImportError as e:
        print(f"FATAL: {e}", file=sys.stderr)
        return 1

    s = _session()

    # 1. Listing via Crawl4AI
    log.info("Fetching listing via Crawl4AI...")
    try:
        from app.infrastructure.external.crawl4ai_client import Crawl4AIClient
        page = Crawl4AIClient().fetch_page_sync(LISTING_URL)
        if not page.success or not page.html:
            print("ERROR: Listing fetch failed", file=sys.stderr)
            return 1
        listing_html = page.html
        log.info("Listing OK (%d chars)", len(listing_html))
    except Exception as e:
        print(f"ERROR: Crawl4AI: {e}", file=sys.stderr)
        return 1

    if _blocked(listing_html):
        print("BLOCKED: Listing page has captcha. Aborting.", file=sys.stderr)
        return 1

    # 2. Extract URLs
    urls = extract_job_links(listing_html)[:limit]
    log.info("%d URLs (limit=%d)", len(urls), limit)
    if not urls:
        print("ERROR: No job links found.", file=sys.stderr)
        return 1

    # 3. Crawl details
    jobs: list[dict] = []
    failed: list[str] = []
    blocked = False

    for i, url in enumerate(urls, 1):
        log.info("[%d/%d] %s", i, len(urls), url)
        time.sleep(random.uniform(3.0, 5.0))

        try:
            r = s.get(url, timeout=30)
        except Exception as e:
            log.error("HTTP error: %s", e)
            failed.append(url)
            continue

        if r.status_code in (403, 429):
            log.warning("BLOCKED - HTTP %d", r.status_code)
            blocked = True
            break
        if not r.ok:
            log.warning("HTTP %d - skip", r.status_code)
            failed.append(url)
            continue

        html = r.text
        if _blocked(html):
            log.warning("CAPTCHA detected")
            blocked = True
            break

        try:
            jc = parse_job_detail(html, source_url=url)
        except Exception as e:
            log.warning("Parse failed: %s", e)
            failed.append(url)
            continue

        qs = calculate_quality_score(jc)
        jobs.append({
            "title": jc.title,
            "company_name": jc.company_name,
            "company_logo_url": jc.company_logo_url or "",
            "location": jc.location,
            "salary_text": jc.salary_text or "",
            "salary_min": str(jc.salary_min) if jc.salary_min is not None else "",
            "salary_max": str(jc.salary_max) if jc.salary_max is not None else "",
            "skills": ";".join(jc.skills) if jc.skills else "",
            "description": jc.description,
            "requirements": jc.requirements or "",
            "benefits": jc.benefits or "",
            "deadline": jc.deadline or "",
            "source_name": "CareerLink",
            "source_url": url,
            "quality_score": str(round(qs, 4)),
            "is_active": "true",
        })
        log.info("OK: %s @ %s (score=%.2f)", jc.title, jc.company_name, qs)

    # 4. Save CSV
    if jobs:
        CSV_PATH.parent.mkdir(parents=True, exist_ok=True)
        with open(CSV_PATH, "w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=FIELDS)
            w.writeheader()
            for row in jobs:
                w.writerow(row)
        log.info("Saved %d jobs -> %s", len(jobs), CSV_PATH)
    else:
        print("WARNING: No jobs parsed.", file=sys.stderr)
        return 1 if blocked else 0

    # 5. Import via pipeline
    imported = skipped = failed_imp = 0
    errors: list[str] = []
    if not skip_import:
        log.info("Importing via pipeline...")
        from app.db.session import SessionLocal
        from app.modules.jobs.pipeline.import_pipeline import JobImportPipeline
        from app.modules.jobs.sources.csv_source import CSVJobSource
        db = SessionLocal()
        try:
            result = JobImportPipeline(db).run(CSVJobSource(CSV_PATH), dry_run=False)
            imported = result.inserted_count
            skipped = result.skipped_duplicate_count
            failed_imp = result.failed_count
            errors = result.errors
            log.info("Import: %d ins, %d skip, %d fail", imported, skipped, failed_imp)
        finally:
            db.close()

    # Summary
    print()
    print("=" * 60)
    print("CRAWL SUMMARY")
    print("=" * 60)
    print(f"  URLs found : {len(urls)}")
    print(f"  Crawled    : {len(jobs)}")
    print(f"  CSV        : {CSV_PATH}")
    if not skip_import:
        print(f"  Imported   : {imported}")
        print(f"  Skipped    : {skipped}")
        print(f"  Failed     : {failed_imp}")
    print(f"  Bad URLs   : {len(failed)}")
    for u in failed:
        print(f"    - {u}")
    print(f"  Blocked    : {'YES' if blocked else 'No'}")
    if blocked:
        print("  CareerLink blocked further requests. Partial data saved.")
    print("=" * 60)
    return 0 if jobs else 1


if __name__ == "__main__":
    sys.exit(main())
