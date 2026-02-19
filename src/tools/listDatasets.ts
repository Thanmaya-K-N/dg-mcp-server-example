/**
 * Tool: datagroom_list_datasets
 * List all available datasets
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { MongoClient } from 'mongodb';
import { makeAuthenticatedRequest } from '../utils/authenticatedRequest.js';
import { formatError } from '../utils/errorHandlers.js';

export function registerListDatasetsTool(
  server: Server, 
  client: MongoClient,
  toolHandlers: Map<string, (request: any) => Promise<any>>
) {
  toolHandlers.set('datagroom_list_datasets', async (request: any) => {

    try {
      // Proxy to Gateway for dataset list
      const gatewayResponse = await makeAuthenticatedRequest(
        `/api/datasets`,
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
          text: `Error listing datasets: ${formatError(error)}`
        }],
        isError: true
      };
    }
  });
}
