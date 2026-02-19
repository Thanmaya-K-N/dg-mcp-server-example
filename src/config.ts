/**
 * Configuration management for Datagroom MCP Server.
 * Order: process.env (and .env) first, then Cursor mcp.json so "npm start" can use token from mcp.json.
 */

import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

/** Load DATAGROOM_PAT_TOKEN and DATAGROOM_GATEWAY_URL from Cursor mcp.json if not in env (e.g. when running npm start). */
function loadFromCursorMcpJson(): void {
  if (process.env.DATAGROOM_PAT_TOKEN) return;

  const baseDir = process.env.USERPROFILE || process.env.HOME || process.env.HOMEPATH;
  if (!baseDir) return;

  const mcpPath = process.env.CURSOR_MCP_JSON_PATH || path.join(baseDir, '.cursor', 'mcp.json');
  let raw: string;
  try {
    raw = fs.readFileSync(mcpPath, 'utf8');
  } catch {
    return;
  }

  let json: { mcpServers?: { datagroom?: { env?: Record<string, string> } } };
  try {
    json = JSON.parse(raw);
  } catch {
    return;
  }

  const env = json.mcpServers?.datagroom?.env;
  if (!env || typeof env !== 'object') return;

  if (env.DATAGROOM_PAT_TOKEN) process.env.DATAGROOM_PAT_TOKEN = env.DATAGROOM_PAT_TOKEN;
  if (env.DATAGROOM_GATEWAY_URL) process.env.DATAGROOM_GATEWAY_URL = env.DATAGROOM_GATEWAY_URL;
}

loadFromCursorMcpJson();

export const config = {
  mongoUrl: process.env.MONGODB_URL || 'mongodb://localhost:27017',
  mcpServerPort: parseInt(process.env.MCP_SERVER_PORT || '3000', 10),
  port: parseInt(process.env.MCP_SERVER_PORT || '3000', 10),
  datagramGatewayUrl: process.env.DATAGROOM_GATEWAY_URL || 'http://localhost:8887',
  patToken: process.env.DATAGROOM_PAT_TOKEN || '',
  nodeEnv: process.env.NODE_ENV || 'development',
} as const;

if (!config.patToken) {
  console.warn('WARNING: DATAGROOM_PAT_TOKEN not set (not in .env and not in ~/.cursor/mcp.json under mcpServers.datagroom.env).');
}
