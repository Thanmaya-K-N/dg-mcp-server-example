/**
 * Tool: datagroom_list_datasets
 * List all available datasets
 */

import { MCPToolRegistry } from '../types.js';
import { MongoClient } from 'mongodb';
import { makeAuthenticatedRequest } from '../utils/authenticatedRequest.js';
import { formatError } from '../utils/errorHandlers.js';

export function registerListDatasetsTool(
  server: MCPToolRegistry,
  client: MongoClient | null,
  toolHandlers: Map<string, (request: any) => Promise<any>>
) {
  toolHandlers.set('datagroom_list_datasets', async (request: any) => {

    try {
      // Route through Gateway (PAT sets req.user; placeholder dsUser is ignored)
      const gatewayResponse = await makeAuthenticatedRequest(
        `/ds/dsList/mcp`,
        'GET'
      );
      const dbList = gatewayResponse.dbList || [];
      const names = dbList.map((d: { name: string }) => d.name);
      return {
        content: [{
          type: 'text',
          text: `Datasets (${names.length}): ${names.join(', ') || 'none'}`
        }],
        structuredContent: { datasets: names, dbList: gatewayResponse.dbList }
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
