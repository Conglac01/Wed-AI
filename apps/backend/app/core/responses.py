"""Standard API response helpers."""


def success_response(data: dict | list | None = None, *, message: str = "OK") -> dict:
    """Return a standard success envelope."""
    return {
        "status": "success",
        "message": message,
        "data": data,
    }


def error_response(message: str, *, code: str = "ERROR") -> dict:
    """Return a standard error envelope."""
    return {
        "status": "error",
        "message": message,
        "code": code,
    }
