import { config } from '../config.js';
import fetch from 'node-fetch';

/**
 * Make authenticated request to Datagroom Gateway
 * Adds PAT token to Authorization header
 * 
 * @param endpoint - Gateway endpoint (e.g., '/api/pats')
 * @param method - HTTP method
 * @param body - Request body (for POST/PUT)
 * @returns Response JSON
 */
export async function makeAuthenticatedRequest(
  endpoint: string,
  method: string = 'GET',
  body?: any
): Promise<any> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  // Add PAT to Authorization header
  if (config.patToken) {
    headers['Authorization'] = `Bearer ${config.patToken}`;
  } else {
    throw new Error(
      'DATAGROOM_PAT_TOKEN not configured. Please set the environment variable.'
    );
  }
  
  const url = `${config.datagramGatewayUrl}${endpoint}`;
  
  console.log(`Making authenticated request to: ${url}`);
  
  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Gateway request failed (${response.status}): ${errorText}`
    );
  }
  
  return response.json();
}
