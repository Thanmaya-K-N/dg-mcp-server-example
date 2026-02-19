/**
 * Tool: datagroom_sample_dataset
 * Get stratified random sample of rows
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
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
  server: Server, 
  client: MongoClient,
  toolHandlers: Map<string, (request: any) => Promise<any>>
) {
  toolHandlers.set('datagroom_sample_dataset', async (request: any) => {
    try {
      const params = SampleDatasetInputSchema.parse(request.params.arguments);
      const gatewayResponse = await makeAuthenticatedRequest(
        `/api/dataset/${encodeURIComponent(params.dataset_name)}/sample`,
        'POST',
        {
          sample_size: params.sample_size,
          stratify_by: params.stratify_by
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
          text: `Error sampling dataset: ${formatError(error)}`
        }],
        isError: true
      };
    }
  });
}
