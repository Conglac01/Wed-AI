"""Crawl4AI wrapper — async + sync fetch returning source-agnostic RawPage.

This module wraps Crawl4AI behind a stable internal contract so that all
upstream consumers (parsers, sources, pipelines) are insulated from
Crawl4AI internals.

Design rules:
  * RawPage is the ONLY return type exposed to callers.
  * Never expose Crawl4AI response objects outside this module.
  * Never parse business fields (title, company, …) — that belongs in parsers.
  * Never write to the database.
"""

from __future__ import annotations

import asyncio
import logging

from pydantic import BaseModel

logger = logging.getLogger(__name__)


# ────────────────────────────────────────────────────────────────────────────
# RawPage — stable public contract
# ────────────────────────────────────────────────────────────────────────────


class RawPage(BaseModel):
    """Source-agnostic container for a fetched web page.

    This is the ONLY type returned by ``Crawl4AIClient``.  Upstream code
    (parsers, sources, pipelines) consumes ``RawPage`` and never sees
    Crawl4AI response objects.
    """

    url: str
    """The URL that was fetched."""

    html: str | None = None
    """Raw HTML body of the fetched page."""

    markdown: str | None = None
    """Markdown rendering of the page content, when available."""

    text: str | None = None
    """Cleaned / simplified text representation (e.g. cleaned HTML)."""

    success: bool = False
    """Whether the fetch completed without errors."""

    error: str | None = None
    """Human-readable error description when ``success`` is ``False``."""


# ────────────────────────────────────────────────────────────────────────────
# Crawl4AIClient
# ────────────────────────────────────────────────────────────────────────────


class Crawl4AIClient:
    """Thin, source-agnostic wrapper around Crawl4AI.

    Provides both an async API (``fetch_page``) and a synchronous convenience
    API (``fetch_page_sync``) so that callers using synchronous contracts
    (e.g. ``BaseJobSource.fetch_jobs()``) are not forced to adopt asyncio.

    Usage::

        # async
        client = Crawl4AIClient()
        page = await client.fetch_page("https://example.com")

        # sync (wraps the async call)
        client = Crawl4AIClient()
        page = client.fetch_page_sync("https://example.com")
    """

    # ------------------------------------------------------------------
    # Async API
    # ------------------------------------------------------------------

    async def fetch_page(self, url: str) -> RawPage:
        """Fetch *url* asynchronously and return a ``RawPage``.

        All common failures (timeout, DNS, blocked, empty response) are
        captured in ``RawPage.success`` and ``RawPage.error`` — no
        exception escapes this method.
        """
        # Late import so the module is importable even when Crawl4AI is
        # not installed (useful for environments that only run unit tests).
        from crawl4ai import AsyncWebCrawler  # noqa: PLC0415

        try:
            async with AsyncWebCrawler() as crawler:
                result = await crawler.arun(url)

            return RawPage(
                url=url,
                html=_or_none(result.html),
                markdown=_or_none(getattr(result, "markdown", None)),
                text=_or_none(result.cleaned_html),
                success=bool(result.success),
                error=_or_none(
                    getattr(result, "error_message", None) or None
                ),
            )
        except Exception as exc:
            logger.exception("Crawl4AI fetch failed for %s", url)
            return RawPage(
                url=url,
                success=False,
                error=_truncated(str(exc)),
            )

    # ------------------------------------------------------------------
    # Sync API — REQUIRED for BaseJobSource compatibility
    # ------------------------------------------------------------------

    def fetch_page_sync(self, url: str) -> RawPage:
        """Synchronous wrapper for ``fetch_page``.

        Required so that synchronous callers (e.g. ``CareerLinkSource``
        which follows the ``BaseJobSource`` contract) can use
        ``Crawl4AIClient`` without converting to async.
        """
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            # No running loop — safe to use asyncio.run()
            return asyncio.run(self.fetch_page(url))

        # A loop is already running (e.g. inside a FastAPI test or uvicorn).
        # Create a new event loop on a separate thread to avoid nesting.
        import concurrent.futures

        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(
                lambda: asyncio.run(self.fetch_page(url))
            )
            return future.result()


# ────────────────────────────────────────────────────────────────────────────
# Internal helpers
# ────────────────────────────────────────────────────────────────────────────


def _or_none(value: str | None) -> str | None:
    """Return *value* if it is a non-empty string, otherwise ``None``."""
    if isinstance(value, str) and value.strip():
        return value.strip()
    return None


def _truncated(msg: str, max_len: int = 500) -> str:
    """Truncate an error message to a reasonable length."""
    if len(msg) <= max_len:
        return msg
    return msg[: max_len - 3] + "..."
