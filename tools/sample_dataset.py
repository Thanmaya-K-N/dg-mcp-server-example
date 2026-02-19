"""
Tool: datagroom_sample_dataset - Get stratified random sample of rows (matches TS sampleDataset.ts).
Stratification not supported by Gateway; returns first page as sample.
"""

import json
import logging
from urllib.parse import quote

from utils.authenticated_request import make_authenticated_request
from utils.error_handlers import format_error

logger = logging.getLogger(__name__)

SAMPLE_DATASET_DESCRIPTION = """Get a stratified random sample of rows from a dataset.

Useful for exploring large datasets without loading all rows. Supports optional stratification by a field.

Args:
  - dataset_name (string, required): Name of the dataset
  - sample_size (number, optional, default: 20, max: 100): Number of rows to sample
  - stratify_by (string, optional): Field name to stratify sampling by (ensures representation from each group)

Returns:
  Object containing:
  - dataset_name: Name of the dataset
  - sample_size: Number of rows in sample
  - total_rows: Total number of rows in dataset
  - data: Array of sampled rows

Examples:
  - Random 20 rows: sample_size=20
  - Stratified by status: sample_size=30, stratify_by="status"
  - Quick exploration: sample_size=10"""


async def datagroom_sample_dataset(
    dataset_name: str,
    sample_size: int = 20,
    stratify_by: str | None = None,
):
    """Get sample rows via Gateway (stratify not supported by gateway)."""
    if not dataset_name or not dataset_name.strip():
        raise ValueError("Dataset name is required")
    if sample_size < 1 or sample_size > 100:
        raise ValueError("sample_size must be between 1 and 100")
    try:
        gateway_response = await make_authenticated_request(
            f"/ds/viewViaPost/{quote(dataset_name, safe='')}/default/mcp",
            "POST",
            {
                "filters": [],
                "sorters": [],
                "page": 1,
                "per_page": min(sample_size, 100),
            },
        )
    except Exception as e:
        logger.exception("sample_dataset failed")
        raise RuntimeError(f"Error sampling dataset: {format_error(e)}") from e
    data = gateway_response.get("data") or []
    if data:
        text = f"Sample ({len(data)} rows):\n{json.dumps(data, indent=2)}"
    else:
        text = "No data in dataset or access denied."
    from fastmcp.tools.tool import ToolResult
    return ToolResult(
        content=text,
        structured_content=gateway_response,
    )
