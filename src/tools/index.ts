/**
 * Central tool registration
 */

import { MCPToolRegistry } from '../types.js';
import { MongoClient } from 'mongodb';
import { registerGetSchemaTool } from './getSchema.js';
import { registerQueryDatasetTool } from './queryDataset.js';
import { registerAggregateDatasetTool } from './aggregateDataset.js';
import { registerListDatasetsTool } from './listDatasets.js';
import { registerSampleDatasetTool } from './sampleDataset.js';

// Store handlers for unified routing
const toolHandlers = new Map<string, (request: any) => Promise<any>>();

export function registerAllTools(server: MCPToolRegistry, client: MongoClient | null) {
  // Register individual tool handlers (they'll store themselves in toolHandlers)
  registerGetSchemaTool(server, client, toolHandlers);
  registerQueryDatasetTool(server, client, toolHandlers);
  registerAggregateDatasetTool(server, client, toolHandlers);
  registerListDatasetsTool(server, client, toolHandlers);
  registerSampleDatasetTool(server, client, toolHandlers);
}

// Export toolHandlers so Express can use them
export function getToolHandler(toolName: string): ((request: any) => Promise<any>) | undefined {
  return toolHandlers.get(toolName);
}

export function getAllToolHandlers(): Map<string, (request: any) => Promise<any>> {
  return toolHandlers;
}
