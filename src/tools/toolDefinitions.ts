/**
 * Centralized tool definitions for tools/list handler
 */

export const toolDefinitions = [
  {
    name: 'datagroom_get_schema',
    description: `Get comprehensive schema information for a Datagroom dataset including column names, types, sample values, and sample data.

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
  - Returns error if unable to connect to MongoDB`,
    inputSchema: {
      type: 'object',
      properties: {
        dataset_name: {
          type: 'string',
          description: 'Name of the dataset to get schema for'
        }
      },
      required: ['dataset_name']
    }
  },
  {
    name: 'datagroom_query_dataset',
    description: `Query a Datagroom dataset with structured filters and return matching rows.

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
  - Paginate results: offset=100, max_rows=50`,
    inputSchema: {
      type: 'object',
      properties: {
        dataset_name: { type: 'string' },
        filters: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              field: { type: 'string' },
              type: { 
                type: 'string',
                enum: ['eq', 'ne', 'gt', 'lt', 'gte', 'lte', 'in', 'nin', 'regex']
              },
              value: {}
            },
            required: ['field', 'type', 'value']
          }
        },
        sort: {
          type: 'object',
          properties: {
            field: { type: 'string' },
            direction: { type: 'string', enum: ['asc', 'desc'] }
          },
          required: ['field', 'direction']
        },
        max_rows: { type: 'number', minimum: 1, maximum: 1000 },
        offset: { type: 'number', minimum: 0 },
        response_format: { type: 'string', enum: ['markdown', 'json'] }
      },
      required: ['dataset_name']
    }
  },
  {
    name: 'datagroom_aggregate_dataset',
    description: `Perform aggregations on a Datagroom dataset without fetching all rows.

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
  - Average order value by customer: aggregations=[{operation: "avg", field: "order_value"}], group_by="customer_id"`,
    inputSchema: {
      type: 'object',
      properties: {
        dataset_name: { type: 'string' },
        filters: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              field: { type: 'string' },
              type: { 
                type: 'string',
                enum: ['eq', 'ne', 'gt', 'lt', 'gte', 'lte', 'in', 'nin', 'regex']
              },
              value: {}
            },
            required: ['field', 'type', 'value']
          }
        },
        aggregations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              operation: {
                type: 'string',
                enum: ['count', 'sum', 'avg', 'min', 'max']
              },
              field: { type: 'string' }
            },
            required: ['operation']
          },
          minItems: 1
        },
        group_by: { type: 'string' }
      },
      required: ['dataset_name', 'aggregations']
    }
  },
  {
    name: 'datagroom_list_datasets',
    description: `List all available datasets in the MongoDB instance.

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
  - "Show me all the datasets"`,
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'datagroom_sample_dataset',
    description: `Get a stratified random sample of rows from a dataset.

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
  - Quick exploration: sample_size=10`,
    inputSchema: {
      type: 'object',
      properties: {
        dataset_name: { type: 'string' },
        sample_size: { type: 'number', minimum: 1, maximum: 100 },
        stratify_by: { type: 'string' }
      },
      required: ['dataset_name']
    }
  }
];
