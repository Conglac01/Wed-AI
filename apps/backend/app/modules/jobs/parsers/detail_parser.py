"""CareerLink job detail parser — HTML → JobCreate.

Targets the JSON-LD JobPosting block embedded in CareerLink detail pages,
supplemented by HTML elements for benefits that are not in the JSON-LD.
"""

import json
import re

from bs4 import BeautifulSoup, Tag

from app.modules.jobs.schema import JobCreate

# ── Markers that separate the job description from requirements ──────────
# CareerLink consistently uses "* Kinh nghiệm / Kỹ năng chi tiết:"
# in the JSON-LD description body to split the two sections.
_REQUIREMENTS_MARKER = re.compile(
    r"\*\s*Kinh\s+nghiệm\s*/\s*Kỹ\s+năng\s+chi\s+tiết\s*:",
    re.IGNORECASE,
)


def _extract_jsonld(soup: BeautifulSoup) -> dict:
    """Locate and parse the JSON-LD JobPosting script block.

    Raises ValueError if no JobPosting block is found.
    """
    for script in soup.find_all("script", type="application/ld+json"):
        if not script.string:
            continue
        try:
            data = json.loads(script.string)
        except (json.JSONDecodeError, TypeError):
            continue
        if isinstance(data, dict) and data.get("@type") == "JobPosting":
            return data
    raise ValueError("No JSON-LD JobPosting found in HTML")


def _clean_html(html: str) -> str:
    """Convert HTML to clean plain text with preserved whitespace."""
    soup = BeautifulSoup(html, "html.parser")
    # Replace block-level elements with newlines for readability
    for tag in soup.find_all(["p", "br", "li", "div", "tr"]):
        tag.insert_after("\n")
    text = soup.get_text()
    # Collapse multiple newlines
    text = re.sub(r"\n{3,}", "\n\n", text)
    # Collapse repeated spaces on each line
    lines = [re.sub(r" {2,}", " ", line).strip() for line in text.splitlines()]
    return "\n".join(line for line in lines if line).strip()


def _split_description(full_text: str) -> tuple[str, str | None]:
    """Split the combined description into (description, requirements | None).

    CareerLink embeds a marker "* Kinh nghiệm / Kỹ năng chi tiết:"
    that separates the job description from the requirements section.
    If the marker is not found, the whole text is treated as description
    and requirements is returned as None.
    """
    match = _REQUIREMENTS_MARKER.search(full_text)
    if not match:
        return full_text, None

    split_pos = match.start()
    description = full_text[:split_pos].strip()
    requirements = full_text[split_pos:].strip()

    # Remove the marker prefix from requirements for cleaner output
    requirements = _REQUIREMENTS_MARKER.sub("", requirements, count=1).strip()

    return description, requirements


def _extract_benefits(soup: BeautifulSoup) -> str | None:
    """Extract benefit items from the page.

    CareerLink renders benefits as <div class="job-benefit-item"> elements
    *outside* the JSON-LD description block, so we scrape them from HTML.
    """
    items: list[str] = []
    for div in soup.find_all("div", class_="job-benefit-item"):
        text = div.get_text(" ", strip=True)
        if text:
            items.append(text)
    if not items:
        return None
    return "\n".join(items)


def _get_location(data: dict) -> str:
    """Build a location string from the JSON-LD address.

    Combines streetAddress and addressLocality where available.
    """
    job_locations = data.get("jobLocation", [])
    if isinstance(job_locations, list) and job_locations:
        addr = job_locations[0].get("address", {})
    elif isinstance(job_locations, dict):
        addr = job_locations.get("address", {})
    else:
        addr = {}

    street = (addr.get("streetAddress") or "").strip()
    city = (addr.get("addressLocality") or "").strip()

    # If street and city are the same (e.g. when city is also the street),
    # just return one. Otherwise join with comma.
    if street and city and street.lower() != city.lower():
        return f"{street}, {city}"
    if city:
        return city
    if street:
        return street
    return ""


def _get_salary(data: dict) -> str | None:
    """Extract salary text from the JSON-LD baseSalary block."""
    salary = data.get("baseSalary")
    if not isinstance(salary, dict):
        return None
    value = salary.get("value")
    if isinstance(value, dict):
        raw = value.get("value", "")
        if isinstance(raw, str) and raw.strip():
            return raw.strip()
    return None


def _get_deadline(data: dict) -> str | None:
    """Extract the YYYY-MM-DD portion from the validThrough field."""
    valid = data.get("validThrough")
    if isinstance(valid, str) and valid:
        # "2026-07-02T23:59:59+00:00" → "2026-07-02"
        return valid[:10]
    return None


def parse_job_detail(html: str, source_url: str) -> JobCreate:
    """Parse a single CareerLink job detail page into a JobCreate payload.

    Args:
        html: Raw HTML of a CareerLink job detail page.
        source_url: The URL the HTML was fetched from.

    Returns:
        A validated JobCreate instance.

    Raises:
        ValueError: If any required field (title, company_name, location,
                    description) is missing or empty.
    """
    soup = BeautifulSoup(html, "html.parser")
    data = _extract_jsonld(soup)

    # ── Extract required fields ──────────────────────────────────────
    title = (data.get("title") or "").strip()
    org = data.get("hiringOrganization") or {}
    company_name = (org.get("name") or "").strip() if isinstance(org, dict) else ""
    location = _get_location(data)

    # Description from JSON-LD (HTML blob)
    raw_description = data.get("description") or ""
    full_text = _clean_html(raw_description)
    description, requirements = _split_description(full_text)

    # ── Validate required fields ─────────────────────────────────────
    missing: list[str] = []
    if not title:
        missing.append("title")
    if not company_name:
        missing.append("company_name")
    if not location:
        missing.append("location")
    if not description:
        missing.append("description")
    if missing:
        raise ValueError(
            f"Required field(s) missing: {', '.join(missing)}"
        )

    # ── Extract optional fields ──────────────────────────────────────
    salary_text = _get_salary(data)
    benefits = _extract_benefits(soup)
    deadline = _get_deadline(data)
    company_logo_url = (org.get("logo") or None) if isinstance(org, dict) else None
    if isinstance(company_logo_url, str):
        company_logo_url = company_logo_url.strip() or None

    return JobCreate(
        title=title,
        company_name=company_name,
        location=location,
        description=description,
        salary_text=salary_text,
        requirements=requirements,
        benefits=benefits,
        deadline=deadline,
        company_logo_url=company_logo_url,
        source_url=source_url,
    )
