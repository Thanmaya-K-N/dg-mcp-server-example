/**
 * Tool: datagroom_get_schema
 * Get dataset structure and sample data
 */

import { MCPToolRegistry } from '../types.js';
import { z } from 'zod';
import { MongoClient } from 'mongodb';
import { makeAuthenticatedRequest } from '../utils/authenticatedRequest.js';
import { inferType, extractSampleValues } from '../utils/typeInference.js';
import { formatError } from '../utils/errorHandlers.js';

const GetSchemaInputSchema = z.object({
  dataset_name: z.string()
    .min(1, 'Dataset name is required')
    .describe('Name of the dataset to get schema for')
}).strict();

export function registerGetSchemaTool(
  server: MCPToolRegistry,
  client: MongoClient | null,
  toolHandlers: Map<string, (request: any) => Promise<any>>
) {
  toolHandlers.set('datagroom_get_schema', async (request: any) => {

    try {
      const params = GetSchemaInputSchema.parse(request.params.arguments);
      // Route through Gateway (PAT sets req.user)
      const gatewayResponse = await makeAuthenticatedRequest(
        `/ds/view/columns/${encodeURIComponent(params.dataset_name)}/default/mcp`,
        'GET'
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
          text: `Error getting schema: ${formatError(error)}`
        }],
        isError: true
      };
    }
  });
}
