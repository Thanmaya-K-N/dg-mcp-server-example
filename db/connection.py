"""
MongoDB connection management (matches TS db/connection.ts).
Optional: server can run without MongoDB; tools use Gateway.
Uses sync pymongo to match TS mongodb driver behavior.
"""

import logging
from typing import Any

logger = logging.getLogger(__name__)

_client: Any = None


def connect_to_mongo(url: str):  # -> MongoClient
    """Connect to MongoDB with connection pooling (sync)."""
    global _client
    try:
        from pymongo import MongoClient
    except ImportError:
        raise RuntimeError("pymongo is not installed; pip install pymongo")
    if _client is not None:
        try:
            _client.admin.command("ping")
            return _client
        except Exception:
            _client = None
    _client = MongoClient(
        url,
        maxPoolSize=60,
        minPoolSize=3,
        serverSelectionTimeoutMS=10000,
        socketTimeoutMS=45000,
    )
    try:
        _client.admin.command("ping")
        logger.info("Connected to MongoDB successfully")
        return _client
    except Exception as e:
        _client = None
        raise RuntimeError(str(e)) from e


def get_database(client: Any, db_name: str):
    """Get a database instance from the connected client."""
    return client[db_name]


def close_mongo() -> None:
    """Close MongoDB connection."""
    global _client
    if _client is not None:
        _client.close()
        _client = None
        logger.info("MongoDB connection closed")


def is_connected() -> bool:
    """Check if MongoDB connection is active."""
    if _client is None:
        return False
    try:
        _client.admin.command("ping")
        return True
    except Exception:
        return False
