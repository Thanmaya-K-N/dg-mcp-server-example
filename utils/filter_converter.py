"""
Convert structured filter array to MongoDB query object (matches TS filterConverter.ts).
Used only if we ever query MongoDB directly; Gateway accepts filters as-is.
"""

from schemas import Filter


def _build_filter_condition(filter_type: str, value: object) -> dict:
    """Build a MongoDB filter condition based on filter type."""
    if filter_type == "ne":
        return {"$ne": value}
    if filter_type == "gt":
        return {"$gt": value}
    if filter_type == "lt":
        return {"$lt": value}
    if filter_type == "gte":
        return {"$gte": value}
    if filter_type == "lte":
        return {"$lte": value}
    if filter_type == "in":
        return {"$in": value if isinstance(value, list) else [value]}
    if filter_type == "nin":
        return {"$nin": value if isinstance(value, list) else [value]}
    if filter_type == "regex":
        return {"$regex": value, "$options": "i"}
    # eq or default
    return value  # type: ignore[return-value]


def convert_filters_to_mongo(filters: list[Filter]) -> dict:
    """Convert an array of filters to a MongoDB query object."""
    if not filters:
        return {}
    query: dict = {}
    for f in filters:
        field, ftype, value = f.field, f.type, f.value
        if field in query:
            existing = query[field]
            if isinstance(existing, dict) and not isinstance(existing, list):
                if "$and" not in query:
                    query["$and"] = [{field: existing}]
                query["$and"].append({field: _build_filter_condition(ftype, value)})
                del query[field]
        else:
            query[field] = (
                value if ftype == "eq" else _build_filter_condition(ftype, value)
            )
    return query
