"""External infrastructure clients — reusable, source-agnostic wrappers."""

from app.infrastructure.external.crawl4ai_client import Crawl4AIClient, RawPage

__all__ = ["Crawl4AIClient", "RawPage"]
