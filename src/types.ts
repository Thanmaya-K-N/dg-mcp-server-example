/**
 * Type definitions for Datagroom MCP Server
 */

/** Minimal type for tool registration (replaces @modelcontextprotocol/sdk Server for Node 12 compatibility) */
export interface MCPToolRegistry {
  readonly name: string;
  readonly version: string;
}

export type FilterType = 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'nin' | 'regex';

export interface Filter {
  field: string;
  type: FilterType;
  value?: any;
}

export interface Sort {
  field: string;
  direction: 'asc' | 'desc';
}

export interface ColumnInfo {
  name: string;
  type: string;
  editable: boolean;
  visible: boolean;
  sample_values: any[];
}

export interface DatasetSchema {
  dataset_name: string;
  columns: ColumnInfo[];
  total_rows: number;
  sample_data: Array<Record<string, any>>;
  keys: string[];
}

export interface QueryResult {
  dataset_name: string;
  query_summary: string;
  total_matching: number;
  rows_returned: number;
  offset: number;
  has_more: boolean;
  next_offset?: number;
  data: Array<Record<string, any>>;
  warning?: string;
}

export interface AggregationOperation {
  operation: 'count' | 'sum' | 'avg' | 'min' | 'max';
  field?: string;
}

export interface AggregationResult {
  dataset_name: string;
  results: Array<{
    group_value?: any;
    count?: number;
    sum?: number;
    avg?: number;
    min?: any;
    max?: any;
  }>;
}

export interface DatasetInfo {
  name: string;
  collections: string[];
  row_count?: number;
}

export interface ListDatasetsResult {
  datasets: DatasetInfo[];
}

export interface SampleResult {
  dataset_name: string;
  sample_size: number;
  total_rows: number;
  data: Array<Record<string, any>>;
}
