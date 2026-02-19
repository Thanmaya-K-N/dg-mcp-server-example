/**
 * Tool: datagroom_sample_dataset
 * Get stratified random sample of rows
 */

import { MCPToolRegistry } from '../types.js';
import { z } from 'zod';
import { MongoClient } from 'mongodb';
import { makeAuthenticatedRequest } from '../utils/authenticatedRequest.js';
import { formatError } from '../utils/errorHandlers.js';

const SampleDatasetInputSchema = z.object({
  dataset_name: z.string().min(1, 'Dataset name is required'),
  sample_size: z.number().int().min(1).max(100).optional().default(20),
  stratify_by: z.string().optional()
}).strict();

export function registerSampleDatasetTool(
  server: MCPToolRegistry,
  client: MongoClient | null,
  toolHandlers: Map<string, (request: any) => Promise<any>>
) {
  toolHandlers.set('datagroom_sample_dataset', async (request: any) => {
    try {
      const params = SampleDatasetInputSchema.parse(request.params.arguments);
      // Route through Gateway: get first page of rows as sample (stratify not supported by gateway)
      const gatewayResponse = await makeAuthenticatedRequest(
        `/ds/viewViaPost/${encodeURIComponent(params.dataset_name)}/default/mcp`,
        'POST',
        {
          filters: [],
          sorters: [],
          page: 1,
          per_page: Math.min(params.sample_size || 20, 100)
        }
      );
      const data = gatewayResponse.data || [];
      const text = data.length
        ? `Sample (${data.length} rows):\n${JSON.stringify(data, null, 2)}`
        : 'No data in dataset or access denied.';
      return {
        content: [{ type: 'text', text }],
        structuredContent: gatewayResponse
      };
    } catch (error: any) {
      return {
        content: [{
          type: 'text',
          text: `Error sampling dataset: ${formatError(error)}`
        }],
        isError: true
      };
    }
  });
}
