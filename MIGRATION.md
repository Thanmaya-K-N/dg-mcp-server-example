# TypeScript → Python migration summary

This project is a **behavior-preserving** Python implementation that replaced the original TypeScript codebase.

## Module mapping

| TypeScript | Python |
|------------|--------|
| `src/index.ts` | `main.py` (FastMCP app, /health, /mcp/v1, uvicorn) |
| `src/config.ts` | `config.py` (dotenv + Cursor mcp.json) |
| `src/types.ts` | `schemas.py` (Pydantic models) |
| `src/db/connection.ts` | `db/connection.py` (sync pymongo) |
| `src/db/queries.ts` | *(unused in TS; not implemented)* |
| `src/tools/index.ts` | Tool registration in `main.py` |
| `src/tools/toolDefinitions.ts` | Descriptions in each `tools/*.py` + `@mcp.tool(description=...)` |
| `src/tools/getSchema.ts` | `tools/get_schema.py` |
| `src/tools/queryDataset.ts` | `tools/query_dataset.py` |
| `src/tools/aggregateDataset.ts` | `tools/aggregate_dataset.py` |
| `src/tools/listDatasets.ts` | `tools/list_datasets.py` |
| `src/tools/sampleDataset.ts` | `tools/sample_dataset.py` |
| `src/utils/authenticatedRequest.ts` | `utils/authenticated_request.py` (httpx) |
| `src/utils/errorHandlers.ts` | `utils/error_handlers.py` |
| `src/utils/formatters.ts` | `utils/formatters.py` |
| `src/utils/filterConverter.ts` | `utils/filter_converter.py` |
| `src/utils/typeInference.ts` | *(not used by TS tools; Gateway returns schema)* |

## Dependency mapping

| TypeScript | Python |
|------------|--------|
| express | FastMCP (Starlette) + uvicorn |
| mongodb | pymongo |
| node-fetch | httpx |
| zod | Pydantic v2 |
| dotenv | python-dotenv |

## Tool contracts (unchanged)

- **Tool names:** `datagroom_get_schema`, `datagroom_query_dataset`, `datagroom_aggregate_dataset`, `datagroom_list_datasets`, `datagroom_sample_dataset`
- **Input schemas:** Match TS `toolDefinitions.ts` (required/optional fields, types, enums)
- **Response:** MCP result with `content` (text) and, where applicable, `structured_content` (same as TS)
- **Errors:** Raised as exceptions → MCP error; message format aligned with TS `formatError`

## Behavior notes

1. **Gateway-only:** All tools call the Datagroom Gateway (PAT auth). MongoDB is optional at startup and not used by tools.
2. **Aggregate:** Only `count` (no `group_by`) is implemented; same as TS. Other ops return the same error message.
3. **Sample:** Stratification is not supported by the Gateway; Python returns first page as sample, like TS.
4. **Config:** Env load order and Cursor `mcp.json` path logic match TS.
5. **HTTP:** MCP endpoint at `/mcp/v1`, health at `/health`, same as TS.

## Running

```bash
pip install -r requirements.txt
cp .env.example .env   # set DATAGROOM_PAT_TOKEN, etc.
python main.py
# or: uvicorn main:app --reload --host 0.0.0.0 --port 3000
```

Cursor config: `"url": "http://localhost:3000/mcp/v1"` (unchanged).
