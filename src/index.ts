/**
 * Main entry point for Datagroom MCP Server.
 * Config (and thus PAT token) is loaded from: .env, then Cursor mcp.json at ~/.cursor/mcp.json (mcpServers.datagroom.env).
 */
import express from 'express';
import { MongoClient } from 'mongodb';
import { connectToMongo, closeMongo } from './db/connection.js';
import { config } from './config.js';
import { registerAllTools, getToolHandler } from './tools/index.js';
import { toolDefinitions } from './tools/toolDefinitions.js';

async function main() {
  console.log('Starting Datagroom MCP Server...');
  console.log(`MongoDB URL: ${config.mongoUrl}`);
  console.log(`Port: ${config.port}`);
  console.log('');
  
  // Connect to MongoDB (optional: server can run without it; tools use Gateway)
  let mongoClient: MongoClient | null = null;
  try {
    mongoClient = await connectToMongo(config.mongoUrl);
  } catch (err: any) {
    console.warn('MongoDB not available (' + (err.message || err) + '). Server will start anyway; tools use Gateway.');
    console.log('');
  }

  // Tool registry (no SDK Server at runtime for Node 12 compatibility)
  const server = { name: 'datagroom-mcp-server', version: '1.0.0' as const };

  // Register all tools (they're stored in a Map; we handle MCP in this file)
  registerAllTools(server, mongoClient);
  
  // Set up Express app
  const app = express();
  
  // Middleware
  app.use(express.json());
  app.use(express.text({ type: 'application/json' }));
  
  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'datagroom-mcp-server' });
  });
  
  // MCP endpoint - handle SSE (Server-Sent Events) for Streamable HTTP
  app.post('/mcp/v1', async (req, res) => {
    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle preflight
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
    
    try {
      // Handle MCP request
      const request = req.body;
      
      if (!request || !request.method) {
        res.write(`data: ${JSON.stringify({
          jsonrpc: '2.0',
          id: request?.id || null,
          error: {
            code: -32600,
            message: 'Invalid Request'
          }
        })}\n\n`);
        res.end();
        return;
      }
      
      // Route to appropriate handler
      let response: any;
      
      if (request.method === 'initialize') {
        response = {
          jsonrpc: '2.0',
          id: request.id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: {}
            },
            serverInfo: {
              name: 'datagroom-mcp-server',
              version: '1.0.0'
            }
          }
        };
      } else {
        // For tools/list and tools/call, use the server's request handler system
        // The Server class should handle routing internally
        try {
          // Handle MCP requests directly via Express
          if (request.method === 'tools/list') {
            response = {
              jsonrpc: '2.0',
              id: request.id,
              result: {
                tools: toolDefinitions
              }
            };
          } else if (request.method === 'tools/call') {
            const toolName = request.params?.name;
            if (!toolName) {
              throw new Error('Tool name is required');
            }
            
            const handler = getToolHandler(toolName);
            if (!handler) {
              throw new Error(`Tool '${toolName}' not found`);
            }
            
            const result = await handler(request);
            response = {
              jsonrpc: '2.0',
              id: request.id,
              result
            };
          } else {
            throw new Error(`Method '${request.method}' not found`);
          }
        } catch (error: any) {
          response = {
            jsonrpc: '2.0',
            id: request.id,
            error: {
              code: -32601,
              message: error.message || 'Method not found'
            }
          };
        }
      }
      
      res.write(`data: ${JSON.stringify(response)}\n\n`);
      res.end();
    } catch (error: any) {
      console.error('Error handling MCP request:', error);
      const errorResponse = {
        jsonrpc: '2.0',
        id: req.body?.id || null,
        error: {
          code: -32603,
          message: error.message || 'Internal error'
        }
      };
      res.write(`data: ${JSON.stringify(errorResponse)}\n\n`);
      res.end();
    }
  });
  
  // Start server
  app.listen(config.port, () => {
    console.log(`Datagroom MCP Server running on port ${config.port}`);
    console.log(`Endpoint: http://localhost:${config.port}/mcp/v1`);
    console.log(`Health check: http://localhost:${config.port}/health`);
  });
  
  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\nShutting down...');
    await closeMongo();
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    console.log('\nShutting down...');
    await closeMongo();
    process.exit(0);
  });
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
