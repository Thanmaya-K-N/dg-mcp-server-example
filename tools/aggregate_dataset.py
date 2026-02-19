"""
Tool: datagroom_aggregate_dataset - Perform aggregations on dataset (matches TS aggregateDataset.ts).
Only count (without group_by) is supported via Gateway; sum/avg/min/max require future Gateway endpoint.
"""

import logging
from urllib.parse import quote

from utils.authenticated_request import make_authenticated_request
from utils.error_handlers import format_error

logger = logging.getLogger(__name__)

AGGREGATE_DATASET_DESCRIPTION = """Perform aggregations on a Datagroom dataset without fetching all rows.

Use this for statistics, counts, sums, averages, min/max values. Supports optional grouping.

Args:
  - dataset_name (string, required): Name of the dataset
  - filters (array, optional): Array of filter objects (same format as query_dataset)
  - aggregations (array, required): Array of aggregation objects with:
    - operation: 'count', 'sum', 'avg', 'min', or 'max'
    - field: Field name (required for sum/avg/min/max, not for count)
  - group_by (string, optional): Field name to group results by

Returns:
  Object containing:
  - dataset_name: Name of the dataset
  - results: Array of aggregation results, each containing:
    - group_value: Group value (if group_by was used)
    - count: Count value (if count aggregation requested)
    - sum: Sum value (if sum aggregation requested)
    - avg: Average value (if avg aggregation requested)
    - min: Minimum value (if min aggregation requested)
    - max: Maximum value (if max aggregation requested)

Examples:
  - Total sum: aggregations=[{operation: "sum", field: "amount"}]
  - Count by status: aggregations=[{operation: "count"}], group_by="status"
  - Average order value by customer: aggregations=[{operation: "avg", field: "order_value"}], group_by="customer_id\""""


async def datagroom_aggregate_dataset(
    dataset_name: str,
    aggregations: list[dict],
    filters: list[dict] | None = None,
    group_by: str | None = None,
):
    """Run aggregations; only count (no group_by) is supported via Gateway."""
    if not dataset_name or not dataset_name.strip():
        raise ValueError("Dataset name is required")
    if not aggregations or len(aggregations) < 1:
        raise ValueError("At least one aggregation is required")
    for agg in aggregations:
        op = agg.get("operation")
        if op != "count" and (not agg.get("field") or not str(agg.get("field", "")).strip()):
            raise ValueError("Field is required for sum, avg, min, and max operations")
    filters = filters or []
    # Only count without group_by is implemented via Gateway (viewViaPost with per_page=1)
    if len(aggregations) == 1 and aggregations[0].get("operation") == "count" and not group_by:
        try:
            gateway_response = await make_authenticated_request(
                f"/ds/viewViaPost/{quote(dataset_name, safe='')}/default/mcp",
                "POST",
                {"filters": filters, "sorters": [], "page": 1, "per_page": 1},
            )
            total = gateway_response.get("total")
            if total is None:
                total = len(gateway_response.get("data") or [])
            from fastmcp.tools.tool import ToolResult
            return ToolResult(
                content=f"Count: {total}",
                structured_content={"count": total},
            )
        except Exception as e:
            logger.exception("aggregate_dataset failed")
            raise RuntimeError(f"Error aggregating dataset: {format_error(e)}") from e
    # sum/avg/min/max and group_by require a Gateway aggregate endpoint (not yet implemented)
    raise RuntimeError(
        "Only count aggregation is supported via Gateway at this time. "
        "sum/avg/min/max and group_by require a future Gateway endpoint."
    )
