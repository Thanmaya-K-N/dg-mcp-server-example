/**
 * Configuration management for Datagroom MCP Server
 */

import dotenv from 'dotenv';

dotenv.config();


export const config = {
  mongoUrl: process.env.MONGODB_URL || 'mongodb://localhost:27017',
  mcpServerPort: parseInt(process.env.MCP_SERVER_PORT || '3000', 10),
  datagramGatewayUrl: process.env.DATAGROOM_GATEWAY_URL || 'http://localhost:8887',
  patToken: process.env.DATAGROOM_PAT_TOKEN || '',
  nodeEnv: process.env.NODE_ENV || 'development',
} as const;

// Validate configuration
if (!config.patToken) {
  console.warn('WARNING: DATAGROOM_PAT_TOKEN not set. MCP server will not be able to authenticate with Gateway.');
}
