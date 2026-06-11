"""CareerLink job source — fetch IT jobs from careerlink.vn.

Follows the BaseJobSource contract: source_name property + fetch_jobs() returning
list[JobCreate].  Uses Crawl4AI for the JS-rendered listing page and requests
for detail pages.  Never writes to DB.
"""

import logging
import time

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from app.modules.jobs.parsers.detail_parser import parse_job_detail
from app.modules.jobs.parsers.listing_parser import extract_job_links
from app.modules.jobs.schema import JobCreate
from app.modules.jobs.sources.base import BaseJobSource

logger = logging.getLogger(__name__)

# ── CareerLink listing page for IT software jobs ──────────────────────
_DEFAULT_LISTING_URL = "https://careerlink.vn/viec-lam/cntt-phan-mem/19"

# ── Sensible defaults for polite scraping ──────────────────────────────
_DEFAULT_TIMEOUT = 30
_MAX_RETRIES = 3
_BACKOFF_FACTOR = 1.0  # 1s, 2s between retries
_USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/120.0.0.0 Safari/537.36"
)
_MAX_JOBS = 5


def _build_session() -> requests.Session:
    """Create a requests.Session with retry policy and User-Agent."""
    session = requests.Session()
    session.headers.update(
        {
            "User-Agent": _USER_AGENT,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8",
        }
    )

    retry_strategy = Retry(
        total=_MAX_RETRIES,
        backoff_factor=_BACKOFF_FACTOR,
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["GET"],
        raise_on_status=False,
    )
    adapter = HTTPAdapter(max_retries=retry_strategy)
    session.mount("https://", adapter)
    session.mount("http://", adapter)

    return session


class CareerLinkSource(BaseJobSource):
    """Fetches IT job listings from CareerLink.vn.

    Flow:
        1. Fetch the IT software listing page (Crawl4AI for JS rendering).
        2. Extract up to ``max_jobs`` detail URLs.
        3. Fetch each detail page (requests — JSON-LD is in static HTML).
        4. Parse each detail page through ``parse_job_detail``.
        5. Return valid ``JobCreate`` payloads (failed parsings are skipped).
    """

    def __init__(
        self,
        listing_url: str = _DEFAULT_LISTING_URL,
        max_jobs: int = _MAX_JOBS,
    ) -> None:
        self._listing_url = listing_url
        self._max_jobs = max_jobs
        self._session = _build_session()

    # ── BaseJobSource contract ────────────────────────────────────────

    @property
    def source_name(self) -> str:
        return "CareerLink"

    def fetch_jobs(self) -> list[JobCreate]:
        """Fetch and parse CareerLink jobs.  Never writes to the database."""
        jobs: list[JobCreate] = []

        # 1. Fetch listing page via Crawl4AI (JS-rendered React SPA)
        listing_html = self._fetch_listing(self._listing_url)
        if not listing_html:
            logger.warning("CareerLink listing page returned empty body")
            return jobs

        # 2. Extract detail URLs
        urls = extract_job_links(listing_html)
        logger.info("Extracted %d job URLs from listing page", len(urls))
        if not urls:
            logger.warning("No job links extracted from CareerLink listing")
            return jobs

        # 3. Limit
        urls = urls[: self._max_jobs]

        # 4. Fetch and parse each detail page
        for url in urls:
            try:
                detail_html = self._fetch_detail(url)
                if not detail_html:
                    logger.warning("Empty response for %s — skipping", url)
                    continue
                job = parse_job_detail(detail_html, source_url=url)
                jobs.append(job)
                logger.info("Parsed job: %s @ %s", job.title, job.company_name)
            except ValueError as exc:
                logger.warning("Parse failed for %s: %s — skipping", url, exc)
            except Exception:
                logger.exception("Unexpected error parsing %s — skipping", url)

        return jobs

    # ── Internal helpers ──────────────────────────────────────────────

    def _fetch_listing(self, url: str) -> str | None:
        """Fetch the listing page via Crawl4AI for JS rendering."""
        try:
            from app.infrastructure.external.crawl4ai_client import (  # noqa: PLC0415
                Crawl4AIClient,
            )

            client = Crawl4AIClient()
            page = client.fetch_page_sync(url)
            if page.success and page.html:
                return page.html
            logger.warning("Crawl4AI listing fetch failed for %s: %s", url, page.error)
            return None
        except Exception:
            logger.exception("Crawl4AI fetch error for listing %s", url)
            return None

    def _fetch_detail(self, url: str) -> str | None:
        """GET *url* via requests and return the response text, or None on failure."""
        try:
            resp = self._session.get(url, timeout=_DEFAULT_TIMEOUT)
            resp.raise_for_status()
            return resp.text
        except requests.RequestException:
            logger.exception("HTTP request failed for %s", url)
            return None
