"""
Tool: datagroom_list_datasets - List all available datasets (matches TS listDatasets.ts).
"""

import logging

from utils.authenticated_request import make_authenticated_request
from utils.error_handlers import format_error

logger = logging.getLogger(__name__)

LIST_DATASETS_DESCRIPTION = """List all available datasets in the MongoDB instance.

Returns information about each dataset including:
- Dataset name
- Collections (data, metaData, editlog, attachments)
- Approximate row count

Use this tool to discover what datasets are available before querying them.

Returns:
  Object containing:
  - datasets: Array of dataset objects, each containing:
    - name: Dataset name
    - collections: Array of collection names
    - row_count: Approximate number of rows (if available)

Examples:
  - "What datasets are available?"
  - "List all datasets in my Datagroom instance"
  - "Show me all the datasets\""""


async def datagroom_list_datasets():
    """List datasets via Gateway."""
    try:
        gateway_response = await make_authenticated_request("/ds/dsList/mcp", "GET")
        db_list = gateway_response.get("dbList") or []
        names = [d.get("name", "") for d in db_list if isinstance(d, dict)]
        text = f"Datasets ({len(names)}): {', '.join(names) or 'none'}"
        from fastmcp.tools.tool import ToolResult
        return ToolResult(
            content=text,
            structured_content={"datasets": names, "dbList": gateway_response.get("dbList")},
        )
    except Exception as e:
        logger.exception("list_datasets failed")
        raise RuntimeError(f"Error listing datasets: {format_error(e)}") from e
