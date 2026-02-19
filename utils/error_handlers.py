"""
Centralized error handling utilities (matches TS errorHandlers.ts semantics).
"""

from typing import Any


class DatagroomError(Exception):
    """Base error for Datagroom MCP Server."""

    def __init__(
        self,
        message: str,
        code: str = "DATAGROOM_ERROR",
        status_code: int = 500,
    ):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code
        self.name = "DatagroomError"


class DatasetNotFoundError(DatagroomError):
    def __init__(self, dataset_name: str):
        super().__init__(
            f"Dataset '{dataset_name}' not found",
            code="DATASET_NOT_FOUND",
            status_code=404,
        )
        self.name = "DatasetNotFoundError"


class InvalidFilterError(DatagroomError):
    def __init__(self, message: str):
        super().__init__(
            f"Invalid filter: {message}",
            code="INVALID_FILTER",
            status_code=400,
        )
        self.name = "InvalidFilterError"


class FieldNotFoundError(DatagroomError):
    def __init__(self, field_name: str, dataset_name: str):
        super().__init__(
            f"Field '{field_name}' does not exist in dataset '{dataset_name}'",
            code="FIELD_NOT_FOUND",
            status_code=400,
        )
        self.name = "FieldNotFoundError"


class DatabaseConnectionError(DatagroomError):
    def __init__(self, message: str):
        super().__init__(
            f"Unable to connect to database: {message}",
            code="DATABASE_CONNECTION_ERROR",
            status_code=503,
        )
        self.name = "DatabaseConnectionError"


def format_error(error: BaseException | Any) -> str:
    """Format error for MCP tool response (matches TS formatError)."""
    if isinstance(error, DatagroomError):
        return f"{error.name}: {error.message}"
    if isinstance(error, Exception):
        return f"Error: {error}"
    return f"Unknown error: {str(error)}"
