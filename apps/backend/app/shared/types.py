"""Shared type aliases used across modules."""

from typing import Any

JSONValue = str | int | float | bool | None | list[Any] | dict[str, Any]
JSONObject = dict[str, JSONValue]
