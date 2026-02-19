/**
 * MongoDB connection management
 */

import { MongoClient, Db } from 'mongodb';

let client: MongoClient | null = null;

/**
 * Connect to MongoDB with connection pooling
 */
export async function connectToMongo(url: string): Promise<MongoClient> {
  // Check if client exists and try to ping to verify connection
  if (client) {
    try {
      await client.db().admin().ping();
      return client;
    } catch (error) {
      // Connection lost, create new one
      client = null;
    }
  }
  
  client = new MongoClient(url, {
    maxPoolSize: 60,
    minPoolSize: 3,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000
  });
  
  try {
    await client.connect();
    // Verify connection with a ping
    await client.db().admin().ping();
    console.log('✓ Connected to MongoDB successfully');
    return client;
  } catch (error: any) {
    client = null;
    const errorMessage = error.message || 'Unknown error';
    console.error('✗ Failed to connect to MongoDB:');
    console.error(`  URL: ${url}`);
    console.error(`  Error: ${errorMessage}`);
    console.error('');
    console.error('Please ensure:');
    console.error('  1. MongoDB is running');
    console.error('  2. The connection URL is correct');
    console.error('  3. MongoDB is accessible from this machine');
    console.error('');
    console.error('To start MongoDB locally:');
    console.error('  - Windows: net start MongoDB');
    console.error('  - Linux/Mac: sudo systemctl start mongod');
    console.error('  - Docker: docker run -d -p 27017:27017 mongo');
    throw new Error(`MongoDB connection failed: ${errorMessage}`);
  }
}

/**
 * Get a database instance from the connected client
 */
export function getDatabase(client: MongoClient, dbName: string): Db {
  return client.db(dbName);
}

/**
 * Close MongoDB connection
 */
export async function closeMongo(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    console.log('MongoDB connection closed');
  }
}

/**
 * Check if MongoDB connection is active
 */
export async function isConnected(): Promise<boolean> {
  if (!client) return false;
  try {
    await client.db().admin().ping();
    return true;
  } catch {
    return false;
  }
}
