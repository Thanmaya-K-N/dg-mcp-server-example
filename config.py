"""
Configuration management for Datagroom MCP Server.
Order: process.env (and .env) first, then Cursor mcp.json so "python -m" can use token from mcp.json.
"""

import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()


def _load_from_cursor_mcp_json() -> None:
    """Load DATAGROOM_PAT_TOKEN and DATAGROOM_GATEWAY_URL from Cursor mcp.json if not in env."""
    if os.environ.get("DATAGROOM_PAT_TOKEN"):
        return
    base_dir = (
        os.environ.get("USERPROFILE")
        or os.environ.get("HOME")
        or os.environ.get("HOMEPATH")
    )
    if not base_dir:
        return
    mcp_path = os.environ.get("CURSOR_MCP_JSON_PATH") or str(
        Path(base_dir) / ".cursor" / "mcp.json"
    )
    try:
        raw = Path(mcp_path).read_text(encoding="utf-8")
    except OSError:
        return
    try:
        import json

        data = json.loads(raw)
    except (json.JSONDecodeError, TypeError):
        return
    env = (data or {}).get("mcpServers", {}).get("datagroom", {}).get("env")
    if not env or not isinstance(env, dict):
        return
    if env.get("DATAGROOM_PAT_TOKEN"):
        os.environ["DATAGROOM_PAT_TOKEN"] = env["DATAGROOM_PAT_TOKEN"]
    if env.get("DATAGROOM_GATEWAY_URL"):
        os.environ["DATAGROOM_GATEWAY_URL"] = env["DATAGROOM_GATEWAY_URL"]


_load_from_cursor_mcp_json()

# Config object matching TS config.ts
MONGODB_URL = os.environ.get("MONGODB_URL", "mongodb://localhost:27017")
MCP_SERVER_PORT = int(os.environ.get("MCP_SERVER_PORT", "3000"), 10)
DATAGROOM_GATEWAY_URL = os.environ.get("DATAGROOM_GATEWAY_URL", "http://localhost:8887")
DATAGROOM_PAT_TOKEN = os.environ.get("DATAGROOM_PAT_TOKEN", "")
NODE_ENV = os.environ.get("NODE_ENV", "development")

config = {
    "mongo_url": MONGODB_URL,
    "mcp_server_port": MCP_SERVER_PORT,
    "port": MCP_SERVER_PORT,
    "datagram_gateway_url": DATAGROOM_GATEWAY_URL,
    "pat_token": DATAGROOM_PAT_TOKEN,
    "node_env": NODE_ENV,
}

if not config["pat_token"]:
    import logging

    logging.getLogger(__name__).warning(
        "WARNING: DATAGROOM_PAT_TOKEN not set (not in .env and not in ~/.cursor/mcp.json under mcpServers.datagroom.env)."
    )
