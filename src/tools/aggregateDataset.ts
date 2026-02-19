/**
 * Tool: datagroom_aggregate_dataset
 * Perform aggregations on dataset
 */

import { MCPToolRegistry } from '../types.js';
import { z } from 'zod';
import { MongoClient } from 'mongodb';
import { makeAuthenticatedRequest } from '../utils/authenticatedRequest.js';
import { convertFiltersToMongo } from '../utils/filterConverter.js';
import { formatAggregationResults } from '../utils/formatters.js';
import { formatError } from '../utils/errorHandlers.js';
import { Filter } from '../types.js';

const AggregationSchema = z.object({
  operation: z.enum(['count', 'sum', 'avg', 'min', 'max']),
  field: z.string().optional()
}).refine(
  (data) => {
    // Field is required for sum/avg/min/max, not for count
    if (data.operation === 'count') return true;
    return data.field !== undefined && data.field !== '';
  },
  {
    message: 'Field is required for sum, avg, min, and max operations'
  }
);

const AggregateDatasetInputSchema = z.object({
  dataset_name: z.string().min(1, 'Dataset name is required'),
  filters: z.array(z.object({
    field: z.string(),
    type: z.enum(['eq', 'ne', 'gt', 'lt', 'gte', 'lte', 'in', 'nin', 'regex']),
    value: z.any()
  })).optional().default([]),
  aggregations: z.array(AggregationSchema).min(1, 'At least one aggregation is required'),
  group_by: z.string().optional()
}).strict();

export function registerAggregateDatasetTool(
  server: MCPToolRegistry,
  client: MongoClient | null,
  toolHandlers: Map<string, (request: any) => Promise<any>>
) {
  toolHandlers.set('datagroom_aggregate_dataset', async (request: any) => {

    try {
      const params = AggregateDatasetInputSchema.parse(request.params.arguments);
      // Gateway has no aggregate endpoint yet; use viewViaPost to get data and compute client-side for count
      if (params.aggregations.length === 1 && params.aggregations[0].operation === 'count' && !params.group_by) {
        const gatewayResponse = await makeAuthenticatedRequest(
          `/ds/viewViaPost/${encodeURIComponent(params.dataset_name)}/default/mcp`,
          'POST',
          { filters: params.filters, sorters: [], page: 1, per_page: 1 }
        );
        const total = gatewayResponse.total != null ? gatewayResponse.total : (gatewayResponse.data || []).length;
        return {
          content: [{ type: 'text', text: `Count: ${total}` }],
          structuredContent: { count: total }
        };
      }
      // sum/avg/min/max and group_by require a Gateway aggregate endpoint (not yet implemented)
      return {
        content: [{
          type: 'text',
          text: 'Only count aggregation is supported via Gateway at this time. sum/avg/min/max and group_by require a future Gateway endpoint.'
        }],
        isError: true
      };
      
    } catch (error: any) {
      return {
        content: [{
          type: 'text',
          text: `Error aggregating dataset: ${formatError(error)}`
        }],
        isError: true
      };
    }
  });
}
