"""CareerLink listing page parser — extract job detail URLs.

Parses CareerLink category/search listing pages to collect unique job detail
URLs from the `<a class="job-link">` elements that appear on each page.
"""

from typing import Optional
from urllib.parse import urljoin, urlparse, urlunparse

from bs4 import BeautifulSoup

_BASE_URL = "https://careerlink.vn"


def _canonical_url(href: str, base: str = _BASE_URL) -> Optional[str]:
    """Normalise a relative or absolute href into a canonical absolute URL.

    Strips query parameters (e.g. ``?source=site``) so the returned URL points
    directly to the job detail page.
    """
    if not href or not href.strip():
        return None

    # Resolve relative URLs against the base
    full = urljoin(base, href.strip())

    parsed = urlparse(full)
    # Remove query string and fragment
    clean = urlunparse(
        (parsed.scheme, parsed.netloc, parsed.path, "", "", "")
    )
    return clean


def extract_job_links(html: str, base_url: str = _BASE_URL) -> list[str]:
    """Extract unique, absolute job detail URLs from a CareerLink listing page.

    CareerLink listing pages contain ``<a class="job-link clickable-outside">``
    elements whose ``href`` points to the detail page (e.g.
    ``/tim-viec-lam/<slug>/<id>?source=site``).

    Args:
        html: Raw HTML of a CareerLink listing/category page.
        base_url: Base URL to resolve relative hrefs (default: careerlink.vn).

    Returns:
        A deduplicated list of absolute detail URLs in first-appearance order.
    """
    soup = BeautifulSoup(html, "html.parser")
    seen: set[str] = set()
    urls: list[str] = []

    for link in soup.find_all("a", class_="job-link"):
        href = link.get("href")
        if not href:
            continue
        canonical = _canonical_url(str(href), base_url)
        if canonical and canonical not in seen:
            seen.add(canonical)
            urls.append(canonical)

    return urls
