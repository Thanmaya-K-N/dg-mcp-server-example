"""
Formatting utilities for tool responses (matches TS formatters.ts).
"""

from typing import Any

from schemas import Filter


def _format_cell_value(value: Any) -> str:
    """Format a single cell value for markdown table."""
    if value is None:
        return ""
    if isinstance(value, (dict, list)):
        import json

        return json.dumps(value)
    if isinstance(value, str) and "|" in value:
        return value.replace("|", "\\|")
    return str(value)


def format_markdown_table(data: list[dict[str, Any]]) -> str:
    """Format data as a markdown table."""
    if not data or len(data) == 0:
        return "No data"
    columns = list(data[0].keys())
    header = "| " + " | ".join(columns) + " |"
    separator = "| " + " | ".join("---" for _ in columns) + " |"
    rows = [
        "| " + " | ".join(_format_cell_value(row.get(col)) for col in columns) + " |"
        for row in data
    ]
    return "\n".join([header, separator] + rows)


def format_query_summary(
    dataset_name: str,
    total_matching: int,
    rows_returned: int,
    filters: list[Filter],
    offset: int,
    has_more: bool,
) -> str:
    """Format query summary with statistics and filters."""
    lines = [
        f"# Query Results: {dataset_name}",
        "",
        f"**Total Matching Rows**: {total_matching:,}",
        f"**Rows Returned**: {rows_returned:,}",
        f"**Offset**: {offset:,}",
        f"**Has More**: {'Yes' if has_more else 'No'}",
    ]
    if filters:
        lines.extend(["", "**Applied Filters**:"])
        for f in filters:
            val = f.value
            value_str = (
                ""
                if val is None
                else (str(val) if not isinstance(val, (dict, list)) else str(val))
            )
            try:
                import json

                if isinstance(val, (dict, list)):
                    value_str = json.dumps(val)
            except Exception:
                value_str = str(val)
            lines.append(f"- `{f.field}` {f.type} `{value_str}`")
    return "\n".join(lines)


def format_aggregation_results(
    dataset_name: str,
    results: list[dict[str, Any]],
    group_by: str | None = None,
) -> str:
    """Format aggregation results as markdown."""
    lines = [f"# Aggregation Results: {dataset_name}", ""]
    if group_by:
        lines.extend([f"**Grouped by**: `{group_by}`", ""])
    if not results:
        lines.append("No results found.")
        return "\n".join(lines)
    first = results[0]
    headers: list[str] = []
    if group_by and "group_value" in first:
        headers.append(group_by)
    if "count" in first:
        headers.append("Count")
    if "sum" in first:
        headers.append("Sum")
    if "avg" in first:
        headers.append("Average")
    if "min" in first:
        headers.append("Min")
    if "max" in first:
        headers.append("Max")
    header_row = "| " + " | ".join(headers) + " |"
    separator_row = "| " + " | ".join("---" for _ in headers) + " |"
    lines.append(header_row)
    lines.append(separator_row)
    for result in results:
        row: list[str] = []
        if group_by and "group_value" in result:
            row.append(_format_cell_value(result["group_value"]))
        if "count" in result:
            row.append(_format_cell_value(result.get("count")))
        if "sum" in result:
            row.append(_format_cell_value(result.get("sum")))
        if "avg" in result:
            avg_val = result.get("avg")
            row.append(
                _format_cell_value(
                    f"{avg_val:.2f}" if isinstance(avg_val, (int, float)) else avg_val
                )
            )
        if "min" in result:
            row.append(_format_cell_value(result.get("min")))
        if "max" in result:
            row.append(_format_cell_value(result.get("max")))
        lines.append("| " + " | ".join(row) + " |")
    return "\n".join(lines)
