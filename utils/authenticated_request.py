"""
Make authenticated request to Datagroom Gateway (matches TS authenticatedRequest.ts).
Adds PAT token to Authorization header.
"""

import logging
from typing import Any

import httpx

# Import after config so dotenv is loaded
from config import config

logger = logging.getLogger(__name__)


async def make_authenticated_request(
    endpoint: str,
    method: str = "GET",
    body: Any = None,
) -> Any:
    """
    Make authenticated request to Datagroom Gateway.
    :param endpoint: Gateway endpoint (e.g. '/ds/dsList/mcp')
    :param method: HTTP method
    :param body: Request body (for POST/PUT)
    :returns: Response JSON
    """
    headers: dict[str, str] = {"Content-Type": "application/json"}
    if config["pat_token"]:
        headers["Authorization"] = f"Bearer {config['pat_token']}"
    else:
        raise RuntimeError(
            "DATAGROOM_PAT_TOKEN not configured. Please set the environment variable."
        )
    url = f"{config['datagram_gateway_url']}{endpoint}"
    logger.info("Making authenticated request to: %s", url)
    async with httpx.AsyncClient(timeout=60.0) as client:
        if method.upper() == "GET":
            response = await client.get(url, headers=headers)
        elif method.upper() == "POST":
            response = await client.post(url, headers=headers, json=body or {})
        else:
            response = await client.request(
                method, url, headers=headers, json=body
            )
    if not response.is_success:
        raise RuntimeError(
            f"Gateway request failed ({response.status_code}): {response.text}"
        )
    return response.json()
