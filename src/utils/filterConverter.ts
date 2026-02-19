/**
 * Convert structured filter array to MongoDB query object
 */

import { Filter } from '../types.js';

/**
 * Convert an array of filters to a MongoDB query object
 */
export function convertFiltersToMongo(filters: Filter[]): any {
  if (!filters || filters.length === 0) {
    return {};
  }
  
  const query: any = {};
  
  for (const filter of filters) {
    const { field, type, value } = filter;
    
    // Handle multiple filters on the same field (AND logic)
    if (query[field]) {
      // If field already has a condition, we need to merge
      if (typeof query[field] === 'object' && !Array.isArray(query[field])) {
        // Merge with existing filter for same field using $and
        if (!query.$and) {
          query.$and = [{ [field]: query[field] }];
        }
        query.$and.push({ [field]: buildFilterCondition(type, value) });
        delete query[field];
      }
    } else {
      // Simple case: first filter on this field
      query[field] = type === 'eq' ? value : buildFilterCondition(type, value);
    }
  }
  
  return query;
}

/**
 * Build a MongoDB filter condition based on filter type
 */
function buildFilterCondition(type: string, value: any): any {
  switch (type) {
    case 'ne':
      return { $ne: value };
    case 'gt':
      return { $gt: value };
    case 'lt':
      return { $lt: value };
    case 'gte':
      return { $gte: value };
    case 'lte':
      return { $lte: value };
    case 'in':
      return { $in: Array.isArray(value) ? value : [value] };
    case 'nin':
      return { $nin: Array.isArray(value) ? value : [value] };
    case 'regex':
      return { $regex: value, $options: 'i' };
    case 'eq':
    default:
      return value;
  }
}
