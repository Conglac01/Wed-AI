"""CareerLink HTML parsers — detail and listing."""

from app.modules.jobs.parsers.detail_parser import parse_job_detail
from app.modules.jobs.parsers.listing_parser import extract_job_links

__all__ = ["extract_job_links", "parse_job_detail"]
