"""
Tool: datagroom_query_dataset - Query dataset with structured filters (matches TS queryDataset.ts).
"""

import logging
from urllib.parse import quote

from schemas import Filter
from utils.authenticated_request import make_authenticated_request
from utils.error_handlers import format_error
from utils.formatters import format_markdown_table, format_query_summary

logger = logging.getLogger(__name__)

QUERY_DATASET_DESCRIPTION = """Query a Datagroom dataset with structured filters and return matching rows.

This tool allows you to filter, sort, and paginate through dataset results.

Args:
  - dataset_name (string, required): Name of the dataset to query
  - filters (array, optional): Array of filter objects with:
    - field: Field name to filter on
    - type: Filter type (eq, ne, gt, lt, gte, lte, in, nin, regex)
    - value: Filter value (array for 'in'/'nin', string for 'regex')
  - sort (object, optional): Sort configuration with:
    - field: Field name to sort by
    - direction: 'asc' or 'desc'
  - max_rows (number, optional, default: 100, max: 1000): Maximum rows to return
  - offset (number, optional, default: 0): Number of rows to skip (for pagination)
  - response_format (string, optional, default: 'markdown'): 'markdown' or 'json'

Returns:
  Object containing:
  - dataset_name: Name of the dataset
  - query_summary: Formatted summary of the query
  - total_matching: Total number of rows matching filters
  - rows_returned: Number of rows in this response
  - offset: Offset used
  - has_more: Whether more rows are available
  - next_offset: Offset for next page (if has_more is true)
  - data: Array of matching rows
  - warning: Warning message if results truncated

Examples:
  - Find transactions > $1000: filters=[{field: "amount", type: "gt", value: 1000}]
  - Get active users sorted by name: filters=[{field: "status", type: "eq", value: "active"}], sort={field: "name", direction: "asc"}
  - Paginate results: offset=100, max_rows=50"""


class QueryFilterInput(BaseModel):
    field: str
    type: str  # enum validated by Gateway
    value: object = None


class SortInput(BaseModel):
    field: str
    direction: str  # 'asc' | 'desc'


async def datagroom_query_dataset(
    dataset_name: str,
    filters: list[dict] | None = None,
    sort: dict | None = None,
    max_rows: int = 100,
    offset: int = 0,
    response_format: str = "markdown",
):
    """Query a dataset via Gateway with filters, sort, and pagination."""
    if not dataset_name or not dataset_name.strip():
        raise ValueError("Dataset name is required")
    if max_rows < 1 or max_rows > 1000:
        raise ValueError("max_rows must be between 1 and 1000")
    if offset < 0:
        raise ValueError("offset must be >= 0")
    filters = filters or []
    sorters = [sort] if sort else []
    page = offset // max_rows + 1 if max_rows else 1
    try:
        response = await make_authenticated_request(
            f"/ds/viewViaPost/{quote(dataset_name, safe='')}/default/mcp",
            "POST",
            {
                "filters": filters,
                "sorters": sorters,
                "page": page,
                "per_page": max_rows,
            },
        )
    except Exception as e:
        logger.exception("query_dataset failed")
        raise RuntimeError(f"Error querying dataset: {format_error(e)}") from e
    total = response.get("total") or 0
    data = response.get("data") or []
    rows_returned = len(data)
    has_more = offset + rows_returned < total
    filter_objs = [Filter(**f) for f in filters] if filters else []
    summary = format_query_summary(
        dataset_name, total, rows_returned, filter_objs, offset, has_more
    )
    data_table = format_markdown_table(data)
    text = f"{summary}\n\n{data_table}"
    from fastmcp.tools.tool import ToolResult
    return ToolResult(
        content=text,
        structured_content=response,
    )
