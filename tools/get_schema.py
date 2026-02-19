"""
Tool: datagroom_get_schema - Get dataset structure and sample data (matches TS getSchema.ts).
"""

import json
import logging
from urllib.parse import quote

from utils.authenticated_request import make_authenticated_request
from utils.error_handlers import format_error

logger = logging.getLogger(__name__)

GET_SCHEMA_DESCRIPTION = """Get comprehensive schema information for a Datagroom dataset including column names, types, sample values, and sample data.

This tool helps you understand the structure of a dataset before querying it. Use this FIRST when working with a new dataset.

Args:
  - dataset_name (string): Name of the dataset (e.g., "transactions", "users", "products")

Returns:
  JSON object containing:
  - dataset_name: Name of the dataset
  - columns: Array of column definitions with:
    - name: Column name
    - type: Inferred data type (string/number/date/boolean/array/object)
    - editable: Whether column can be edited
    - visible: Whether column is visible by default
    - sample_values: Up to 5 unique sample values from this column
  - total_rows: Total number of rows in the dataset
  - sample_data: First 5 rows of actual data
  - keys: Primary key fields for the dataset

Examples:
  - Use when: "What columns does the transactions dataset have?"
  - Use when: "Show me the structure of the users dataset"
  - Use when: "What data is in the products table?"

Error Handling:
  - Returns error if dataset doesn't exist
  - Returns error if unable to connect to MongoDB"""


async def datagroom_get_schema(dataset_name: str):
    """Get schema and sample data for a dataset via Gateway."""
    if not dataset_name or not dataset_name.strip():
        raise ValueError("Dataset name is required")
    try:
        gateway_response = await make_authenticated_request(
            f"/ds/view/columns/{quote(dataset_name, safe='')}/default/mcp",
            "GET",
        )
        text = json.dumps(gateway_response, indent=2)
        from fastmcp.tools.tool import ToolResult
        return ToolResult(
            content=text,
            structured_content=gateway_response,
        )
    except Exception as e:
        logger.exception("get_schema failed")
        raise RuntimeError(f"Error getting schema: {format_error(e)}") from e
