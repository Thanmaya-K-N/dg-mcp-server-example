/**
 * Tool: datagroom_aggregate_dataset
 * Perform aggregations on dataset
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
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
  server: Server, 
  client: MongoClient,
  toolHandlers: Map<string, (request: any) => Promise<any>>
) {
  toolHandlers.set('datagroom_aggregate_dataset', async (request: any) => {

    try {
      const params = AggregateDatasetInputSchema.parse(request.params.arguments);
      // Proxy to Gateway for aggregation
      const gatewayResponse = await makeAuthenticatedRequest(
        `/api/dataset/${encodeURIComponent(params.dataset_name)}/aggregate`,
        'POST',
        {
          filters: params.filters,
          aggregations: params.aggregations,
          group_by: params.group_by
        }
      );
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(gatewayResponse, null, 2)
        }]
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
