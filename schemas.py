"""
Type definitions for Datagroom MCP Server (Pydantic models matching TS types.ts).
"""

from typing import Any, Literal

from pydantic import BaseModel, Field

FilterType = Literal["eq", "ne", "gt", "lt", "gte", "lte", "in", "nin", "regex"]


class Filter(BaseModel):
    field: str
    type: FilterType
    value: Any = None


class Sort(BaseModel):
    field: str
    direction: Literal["asc", "desc"]


class ColumnInfo(BaseModel):
    name: str
    type: str
    editable: bool
    visible: bool
    sample_values: list[Any] = Field(default_factory=list)


class DatasetSchema(BaseModel):
    dataset_name: str
    columns: list[ColumnInfo]
    total_rows: int
    sample_data: list[dict[str, Any]] = Field(default_factory=list)
    keys: list[str] = Field(default_factory=list)


class QueryResult(BaseModel):
    dataset_name: str
    query_summary: str
    total_matching: int
    rows_returned: int
    offset: int
    has_more: bool
    next_offset: int | None = None
    data: list[dict[str, Any]] = Field(default_factory=list)
    warning: str | None = None


class AggregationOperation(BaseModel):
    operation: Literal["count", "sum", "avg", "min", "max"]
    field: str | None = None


class AggregationResultRow(BaseModel):
    group_value: Any = None
    count: int | None = None
    sum: float | None = None
    avg: float | None = None
    min: Any = None
    max: Any = None


class AggregationResult(BaseModel):
    dataset_name: str
    results: list[AggregationResultRow]


class DatasetInfo(BaseModel):
    name: str
    collections: list[str]
    row_count: int | None = None


class ListDatasetsResult(BaseModel):
    datasets: list[DatasetInfo]


class SampleResult(BaseModel):
    dataset_name: str
    sample_size: int
    total_rows: int
    data: list[dict[str, Any]] = Field(default_factory=list)
