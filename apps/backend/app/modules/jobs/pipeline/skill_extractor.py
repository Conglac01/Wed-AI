"""Skill extraction — normalize existing skills, or extract from text fields."""

import re

from app.modules.jobs.schema import JobCreate

# ── Canonical IT skill dictionary ──────────────────────────────────────
# Lower-case key → canonical display name

_SKILL_DICT: dict[str, str] = {
    "python": "Python",
    "javascript": "JavaScript",
    "typescript": "TypeScript",
    "react": "React",
    "react native": "React Native",
    "vue": "Vue",
    "angular": "Angular",
    "node.js": "Node.js",
    "nodejs": "Node.js",
    "express": "Express",
    "fastapi": "FastAPI",
    "django": "Django",
    "flask": "Flask",
    "postgresql": "PostgreSQL",
    "postgres": "PostgreSQL",
    "mysql": "MySQL",
    "mongodb": "MongoDB",
    "docker": "Docker",
    "kubernetes": "Kubernetes",
    "k8s": "Kubernetes",
    "aws": "AWS",
    "git": "Git",
    "linux": "Linux",
    "tailwind": "Tailwind",
    "tailwind css": "Tailwind",
    "java": "Java",
    "c#": "C#",
    ".net": ".NET",
    "php": "PHP",
    "laravel": "Laravel",
    "flutter": "Flutter",
    "qa": "QA",
    "automation testing": "Automation Testing",
    "machine learning": "Machine Learning",
    "deep learning": "Deep Learning",
    "nlp": "NLP",
    "data analysis": "Data Analysis",
}

def _normalize_and_dedup(skills: list[str] | None) -> list[str] | None:
    """Trim, dedup case-insensitively, keep first casing. Returns None if empty."""
    if not skills:
        return None
    cleaned: list[str] = []
    for s in skills:
        t = s.strip()
        if t:
            cleaned.append(t)
    if not cleaned:
        return None

    seen: set[str] = set()
    deduped: list[str] = []
    for t in cleaned:
        key = t.lower()
        if key not in seen:
            seen.add(key)
            deduped.append(t)
    return deduped if deduped else None


def _extract_from_text(text: str) -> list[str]:
    """Scan text for known skill patterns, returning canonical names in
    first-appearance order.  Each canonical name is emitted at the position
    of the *earliest* matching pattern in the original text."""

    text_lower = text.lower()
    # (position_in_text, canonical_name)
    hits: list[tuple[int, str]] = []

    for pattern, canonical in _SKILL_DICT.items():
        pos = text_lower.find(pattern)
        if pos != -1:
            hits.append((pos, canonical))

    # Sort by position only, then build the ordered list
    hits.sort(key=lambda x: x[0])

    # Deduplicate canonical names (keep first occurrence, which is the
    # earliest position since hits are already sorted by position).
    seen: set[str] = set()
    ordered: list[str] = []
    for _pos, name in hits:
        if name not in seen:
            seen.add(name)
            ordered.append(name)

    return ordered


def extract_and_normalize_skills(jobs: list[JobCreate]) -> list[JobCreate]:
    """For each job: normalise existing skills. If none present, extract from text."""
    for job in jobs:
        # 1. Normalize existing
        if job.skills is not None and len(job.skills) > 0:
            job.skills = _normalize_and_dedup(job.skills)
            continue

        # 2. Extract from text fields
        combined = (
            (job.title or "")
            + " "
            + (job.description or "")
            + " "
            + (job.requirements or "")
        )
        found = _extract_from_text(combined)
        if found:
            job.skills = found
        else:
            job.skills = None

    return jobs
