"""Base source contract — all job sources must implement this interface."""

from abc import ABC, abstractmethod

from app.modules.jobs.schema import JobCreate


class BaseJobSource(ABC):
    """Abstract base for pluggable job data providers.

    Future sources (CareerLinkSource, TopCVSource, ITviecSource, CrawlerSource)
    must implement this contract.
    """

    @property
    @abstractmethod
    def source_name(self) -> str:
        """Human-readable name for this source (e.g. 'Mock', 'CSV', 'CareerLink')."""
        ...

    @abstractmethod
    def fetch_jobs(self) -> list[JobCreate]:
        """Return a list of validated JobCreate payloads.

        Must NOT write to the database.
        """
        ...
