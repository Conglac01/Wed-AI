"""Application logging foundation."""

import logging

from app.core.config import settings


def get_logger(name: str) -> logging.Logger:
    """Return a configured logger for the given module name."""
    logger = logging.getLogger(name)

    if not logger.handlers:
        handler = logging.StreamHandler()
        formatter = logging.Formatter(
            "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s"
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)

    level = logging.DEBUG if settings.ENVIRONMENT == "development" else logging.INFO
    logger.setLevel(level)

    return logger
