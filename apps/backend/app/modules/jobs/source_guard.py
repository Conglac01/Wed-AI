"""Source guard — captcha / anti-bot detection for web sources.

These utilities help the crawler detect when a source has deployed
anti-bot protection so it can fail safely instead of scraping garbage.
"""

from __future__ import annotations

import logging

logger = logging.getLogger(__name__)

# ── Blocked-page indicator substrings (lowercased) ──────────────────────
_BLOCKED_INDICATORS: list[str] = [
    "xác nhận bạn không phải robot",
    "không phải robot",
    "hcaptcha",
    "captcha",
]


def is_blocked_response(html: str) -> bool:
    """Return ``True`` if *html* contains known anti-bot / captcha indicators.

    Checks are case-insensitive.  Returns ``True`` as soon as ANY indicator
    is found; ``False`` otherwise.

    Usage::

        >>> is_blocked_response('<html><title>Xác nhận bạn không phải robot</title></html>')
        True
        >>> is_blocked_response('<html><head></head><body>Real content</body></html>')
        False
    """
    if not html or not html.strip():
        return False

    haystack = html.lower()
    for needle in _BLOCKED_INDICATORS:
        if needle in haystack:
            logger.warning("Blocked page detected — matched indicator: %r", needle)
            return True

    return False
