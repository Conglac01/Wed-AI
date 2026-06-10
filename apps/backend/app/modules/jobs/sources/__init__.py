"""Job sources — pluggable data providers for the Jobs module."""

from app.modules.jobs.sources.base import BaseJobSource
from app.modules.jobs.sources.mock_source import MockJobSource
from app.modules.jobs.sources.csv_source import CSVJobSource

__all__ = ["BaseJobSource", "CSVJobSource", "MockJobSource"]
