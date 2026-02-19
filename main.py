"""
Main entry point for Datagroom MCP Server.
Exposes health, /mcp/v1, optional MongoDB at startup, and MCP tool contracts.
"""

import logging
import sys

from config import config
from db.connection import close_mongo, connect_to_mongo

# Configure structured logging before other imports that log
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    stream=sys.stdout,
)
logger = logging.getLogger(__name__)


def _create_app():
    from fastmcp import FastMCP
    from tools.get_schema import GET_SCHEMA_DESCRIPTION, datagroom_get_schema
    from tools.query_dataset import QUERY_DATASET_DESCRIPTION, datagroom_query_dataset
    from tools.aggregate_dataset import AGGREGATE_DATASET_DESCRIPTION, datagroom_aggregate_dataset
    from tools.list_datasets import LIST_DATASETS_DESCRIPTION, datagroom_list_datasets
    from tools.sample_dataset import SAMPLE_DATASET_DESCRIPTION, datagroom_sample_dataset
    from starlette.responses import JSONResponse

    mcp = FastMCP(
        name="datagroom-mcp-server",
        version="1.0.0",
    )

    @mcp.tool(
        name="datagroom_get_schema",
        description=GET_SCHEMA_DESCRIPTION,
    )
    async def get_schema(dataset_name: str):
        return await datagroom_get_schema(dataset_name=dataset_name)

    @mcp.tool(
        name="datagroom_query_dataset",
        description=QUERY_DATASET_DESCRIPTION,
    )
    async def query_dataset(
        dataset_name: str,
        filters: list[dict] | None = None,
        sort: dict | None = None,
        max_rows: int = 100,
        offset: int = 0,
        response_format: str = "markdown",
    ):
        return await datagroom_query_dataset(
            dataset_name=dataset_name,
            filters=filters,
            sort=sort,
            max_rows=max_rows,
            offset=offset,
            response_format=response_format,
        )

    @mcp.tool(
        name="datagroom_aggregate_dataset",
        description=AGGREGATE_DATASET_DESCRIPTION,
    )
    async def aggregate_dataset(
        dataset_name: str,
        aggregations: list[dict],
        filters: list[dict] | None = None,
        group_by: str | None = None,
    ):
        return await datagroom_aggregate_dataset(
            dataset_name=dataset_name,
            aggregations=aggregations,
            filters=filters,
            group_by=group_by,
        )

    @mcp.tool(
        name="datagroom_list_datasets",
        description=LIST_DATASETS_DESCRIPTION,
    )
    async def list_datasets():
        return await datagroom_list_datasets()

    @mcp.tool(
        name="datagroom_sample_dataset",
        description=SAMPLE_DATASET_DESCRIPTION,
    )
    async def sample_dataset(
        dataset_name: str,
        sample_size: int = 20,
        stratify_by: str | None = None,
    ):
        return await datagroom_sample_dataset(
            dataset_name=dataset_name,
            sample_size=sample_size,
            stratify_by=stratify_by,
        )

    @mcp.custom_route("/health", methods=["GET"])
    async def health(_request):
        return JSONResponse(
            {"status": "ok", "service": "datagroom-mcp-server"}
        )

    return mcp.http_app(path="/mcp/v1")


# Expose ASGI app for uvicorn main:app (e.g. --reload)
app = _create_app()


def main():
    logger.info("Starting Datagroom MCP Server...")
    logger.info("MongoDB URL: %s", config["mongo_url"])
    logger.info("Port: %s", config["port"])
    logger.info("")

    # Optional MongoDB connection (sync; tools use Gateway)
    try:
        connect_to_mongo(config["mongo_url"])
    except Exception as e:
        logger.warning(
            "MongoDB not available (%s). Server will start anyway; tools use Gateway.",
            e,
        )
        logger.info("")

    port = config["port"]
    import uvicorn
    try:
        uvicorn.run(
            app,
            host="0.0.0.0",
            port=port,
            log_level="info",
        )
    except KeyboardInterrupt:
        logger.info("Shutting down...")
    finally:
        close_mongo()
        logger.info("Goodbye.")


if __name__ == "__main__":
    main()
