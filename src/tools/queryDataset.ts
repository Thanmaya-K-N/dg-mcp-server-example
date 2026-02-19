/**
 * Tool: datagroom_query_dataset
 * Query dataset with structured filters
 */

import { MCPToolRegistry } from '../types.js';
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
  server: MCPToolRegistry,
  client: MongoClient | null,
  toolHandlers: Map<string, (request: any) => Promise<any>>
) {
  toolHandlers.set('datagroom_query_dataset', async (request: any) => {
    try {
      const params = QueryDatasetInputSchema.parse(request.params.arguments);
      
      // Route through Gateway (PAT sets req.user; ACLs enforced)
      const maxRows = params.max_rows || 100;
      const page = Math.floor((params.offset || 0) / maxRows) + 1;
      const response = await makeAuthenticatedRequest(
        `/ds/viewViaPost/${encodeURIComponent(params.dataset_name)}/default/mcp`,
        'POST',
        {
          filters: params.filters || [],
          sorters: params.sort ? [params.sort] : [],
          page,
          per_page: maxRows
        }
      );
      
      const total = response.total || 0;
      const rowsReturned = (response.data || []).length;
      const hasMore = (params.offset || 0) + rowsReturned < total;
      const summary = formatQuerySummary(
        params.dataset_name,
        total,
        rowsReturned,
        params.filters || [],
        params.offset || 0,
        hasMore
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
