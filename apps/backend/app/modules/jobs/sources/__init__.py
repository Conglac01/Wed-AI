"""Job sources — pluggable data providers for the Jobs module."""

from app.modules.jobs.sources.base import BaseJobSource
from app.modules.jobs.sources.careerlink_source import CareerLinkSource
from app.modules.jobs.sources.csv_source import CSVJobSource
from app.modules.jobs.sources.mock_source import MockJobSource

__all__ = ["BaseJobSource", "CareerLinkSource", "CSVJobSource", "MockJobSource"]
