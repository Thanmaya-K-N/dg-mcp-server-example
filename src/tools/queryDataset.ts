/**
 * Tool: datagroom_query_dataset
 * Query dataset with structured filters
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { z } from 'zod';
import { MongoClient } from 'mongodb';
import { formatQuerySummary, formatMarkdownTable } from '../utils/formatters.js';
import { formatError } from '../utils/errorHandlers.js';
import { makeAuthenticatedRequest } from '../utils/authenticatedRequest.js';

const FilterSchema = z.object({
  field: z.string(),
  type: z.enum(['eq', 'ne', 'gt', 'lt', 'gte', 'lte', 'in', 'nin', 'regex']),
  value: z.any()
});

const SortSchema = z.object({
  field: z.string(),
  direction: z.enum(['asc', 'desc'])
}).optional();

const QueryDatasetInputSchema = z.object({
  dataset_name: z.string().min(1, 'Dataset name is required'),
  filters: z.array(FilterSchema).optional().default([]),
  sort: SortSchema.optional(),
  max_rows: z.number().int().min(1).max(1000).optional().default(100),
  offset: z.number().int().min(0).optional().default(0),
  response_format: z.enum(['markdown', 'json']).optional().default('markdown')
}).strict();

export function registerQueryDatasetTool(
  server: Server,
  client: MongoClient,
  toolHandlers: Map<string, (request: any) => Promise<any>>
) {
  toolHandlers.set('datagroom_query_dataset', async (request: any) => {
    try {
      const params = QueryDatasetInputSchema.parse(request.params.arguments);
      
      // Route through Gateway API (NOT direct MongoDB)
      // This ensures ACLs are enforced
      const response = await makeAuthenticatedRequest(
        `/api/dataset/${encodeURIComponent(params.dataset_name)}/query`,
        'POST',
        {
          filters: params.filters || [],
          sorters: params.sort ? [params.sort] : [],
          page: Math.floor((params.offset || 0) / (params.max_rows || 100)),
          per_page: params.max_rows || 100
        }
      );
      
      // Format response
      const summary = formatQuerySummary(
        params.dataset_name,
        response.total || 0,
        (response.data || []).length,
        params.filters || [],
        params.offset || 0,
        params.response_format || 'markdown'
      );
      
      const dataTable = formatMarkdownTable(response.data || []);
      
      return {
        content: [{
          type: 'text',
          text: `${summary}\n\n${dataTable}`
        }],
        structuredContent: response
      };
    } catch (error: any) {
      return {
        content: [{
          type: 'text',
          text: `Error querying dataset: ${formatError(error)}`
        }],
        isError: true
      };
    }
  });
}
