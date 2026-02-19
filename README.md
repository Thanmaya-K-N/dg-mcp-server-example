# Datagroom MCP Server

MCP (Model Context Protocol) server that enables LLMs to interact with Datagroom datasets through natural language queries in Cursor IDE.

## Overview

This server provides a bridge between LLMs (like Claude in Cursor) and your Datagroom MongoDB datasets. It translates natural language queries into structured MongoDB queries, enabling you to explore and analyze your data through conversational interfaces.

**Key Features:**
- Query datasets with natural language (translated to structured filters by Claude)
- Get dataset schemas and sample data
- Perform aggregations (count, sum, avg, min, max)
- List all available datasets
- Random sampling with optional stratification
- Pagination support for large result sets
- Markdown and JSON response formats

## Architecture

```
User in Cursor
      ↓ (Natural language: "Show me failed transactions above $1000")
Claude in Cursor (translates to structured tool call)
      ↓ (Structured JSON parameters)
MCP Server (executes query)
      ↓ (MongoDB query via connection)
MongoDB Database
      ↓ (Results)
Claude in Cursor
      ↓ (Formatted response)
User in Cursor
```

**Design Philosophy:**
- The MCP server receives **STRUCTURED parameters** (not natural language)
- Claude in Cursor does the "translation" from natural language to structured filters
- The MCP server is a "dumb executor" that converts structured filters → MongoDB queries
- **NO external LLM API calls** needed in the MCP server

## Prerequisites

- Node.js 18+ 
- MongoDB instance (local or remote)
- TypeScript 5.3+

## Installation

1. **Clone or navigate to the project directory:**
   ```bash
   cd datagroom-mcp-server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and set your MongoDB connection string:
   ```
   MONGODB_URL=mongodb://localhost:27017
   MCP_SERVER_PORT=3000
   NODE_ENV=development
   ```

4. **Build the project:**
   ```bash
   npm run build
   ```

## Running the Server

### Production Mode

```bash
npm start
```

The server will start on port 3000 (or the port specified in `.env`).

### Development Mode

For development with auto-rebuild on file changes:

```bash
npm run dev
```

### Verify Installation

Check that the server is running:

```bash
curl http://localhost:3000/health
```

You should see:
```json
{"status":"ok","service":"datagroom-mcp-server"}
```

## Cursor IDE Configuration

After starting the MCP server, configure Cursor to use it:

1. **Open Cursor Settings** (Cmd/Ctrl + ,)
2. **Navigate to MCP Servers** (or search for "MCP")
3. **Add new server configuration:**

   ```json
   {
     "mcpServers": {
       "datagroom": {
         "type": "streamable-http",
         "url": "http://localhost:3000/mcp/v1"
       }
     }
   }
   ```

4. **Restart Cursor**
5. **Test by asking:** "What datasets are available?" or "Show me the schema for [dataset_name]"

## Available Tools

### 1. `datagroom_get_schema`

Get dataset structure and sample data.

**Example usage in Cursor:**
- "What columns does the transactions dataset have?"
- "Show me the structure of the users dataset"
- "What data is in the products table?"

**Returns:**
- Column names, types, and sample values
- Total row count
- First 5 rows of actual data
- Primary key fields

---

### 2. `datagroom_query_dataset`

Query dataset with structured filters.

**Example usage in Cursor:**
- "Show me the first 10 rows of the products dataset"
- "Find all transactions where amount is greater than 1000"
- "Get users with status equal to 'active'"
- "Show me failed transactions above $1000 from the last 30 days"

**Features:**
- Filter by field values (eq, ne, gt, lt, gte, lte, in, nin, regex)
- Sort results
- Pagination (offset + max_rows)
- Markdown or JSON response format

---

### 3. `datagroom_aggregate_dataset`

Perform aggregations without fetching all rows.

**Example usage in Cursor:**
- "What's the total sum of all transaction amounts?"
- "Count how many users are in each status category"
- "What's the average order value by customer type?"

**Supported operations:**
- `count`: Count matching rows
- `sum`: Sum of a numeric field
- `avg`: Average of a numeric field
- `min`: Minimum value
- `max`: Maximum value
- Optional grouping by field

---

### 4. `datagroom_list_datasets`

List all available datasets.

**Example usage in Cursor:**
- "What datasets are available?"
- "List all datasets in my Datagroom instance"
- "Show me all the datasets"

**Returns:**
- Dataset names
- Collections per dataset
- Approximate row counts

---

### 5. `datagroom_sample_dataset`

Get random sample of rows.

**Example usage in Cursor:**
- "Give me a random sample of 20 products"
- "Show me a representative sample of transactions stratified by status"

**Features:**
- Random sampling (up to 100 rows)
- Optional stratification by field
- Useful for exploring large datasets

## Example Usage Patterns

### Exploration Workflow

1. **Discover datasets:**
   ```
   "What datasets are available?"
   ```

2. **Understand structure:**
   ```
   "Show me the schema for the transactions dataset"
   ```

3. **Explore sample data:**
   ```
   "Give me a random sample of 20 transactions"
   ```

4. **Query specific data:**
   ```
   "Find all transactions where amount > 1000 and status = 'failed'"
   ```

5. **Analyze data:**
   ```
   "What's the total transaction amount by status?"
   ```

## Project Structure

```
datagroom-mcp-server/
├── package.json
├── tsconfig.json
├── README.md
├── .env.example
├── src/
│   ├── index.ts              # Main entry point
│   ├── config.ts             # Configuration
│   ├── types.ts              # TypeScript interfaces
│   ├── db/
│   │   ├── connection.ts     # MongoDB connection
│   │   └── queries.ts        # Query helpers
│   ├── tools/
│   │   ├── index.ts          # Tool registration
│   │   ├── toolDefinitions.ts # Tool schemas
│   │   ├── getSchema.ts      # Schema tool
│   │   ├── queryDataset.ts   # Query tool
│   │   ├── aggregateDataset.ts # Aggregation tool
│   │   ├── listDatasets.ts   # List datasets tool
│   │   └── sampleDataset.ts  # Sampling tool
│   └── utils/
│       ├── filterConverter.ts    # Filter → MongoDB query
│       ├── formatters.ts         # Response formatting
│       ├── typeInference.ts      # Type inference
│       └── errorHandlers.ts      # Error handling
└── dist/                     # Built JavaScript
```

## Error Handling

The server handles common error cases:

- **Dataset Not Found**: Clear error message with dataset name
- **Invalid Filters**: Validation errors with format examples
- **MongoDB Connection Failed**: Connection error messages
- **Empty Results**: "No matching rows found" with filter summary
- **Exceeded Limits**: Warnings when results are truncated

## Performance Considerations

- **Connection Pooling**: MongoDB connection is reused (singleton pattern)
- **Pagination**: Always uses offset + limit, never loads all rows
- **Count Optimization**: Uses `countDocuments()` with filters
- **Sample Optimization**: Uses MongoDB `$sample` for random sampling
- **Hard Limits**: Maximum 1000 rows per query to prevent memory issues

## Security Considerations

- **Input Validation**: All inputs validated with Zod schemas
- **Query Injection Protection**: Uses MongoDB driver's parameterized queries
- **Row Limits**: Hard cap at 1000 rows per query
- **Future**: Token-based authentication (planned)
- **Future**: Request rate limiting (planned)

## Troubleshooting

### Server won't start

- Check MongoDB is running and accessible
- Verify `MONGODB_URL` in `.env` is correct
- Check port 3000 is not already in use

### Tools not appearing in Cursor

- Verify server is running (`curl http://localhost:3000/health`)
- Check Cursor MCP configuration JSON is valid
- Restart Cursor after configuration changes
- Check Cursor logs for connection errors

### Queries returning errors

- Verify dataset name is correct (case-sensitive)
- Check field names match schema (use `datagroom_get_schema` first)
- Ensure filter values match field types
- Check MongoDB connection is stable

### Performance issues

- Use `max_rows` parameter to limit result size
- Use `offset` for pagination instead of loading all rows
- Use `datagroom_aggregate_dataset` for statistics instead of fetching all data
- Consider adding MongoDB indexes on frequently filtered fields

## Development

### Building

```bash
npm run build
```

### Watching for changes

```bash
npm run dev
```

### Type checking

```bash
npx tsc --noEmit
```

## License

MIT

## Contributing

Contributions welcome! Please open an issue or submit a pull request.

## Support

For issues or questions:
- Open an issue on GitHub
- Check the troubleshooting section above
- Review MongoDB and MCP SDK documentation
