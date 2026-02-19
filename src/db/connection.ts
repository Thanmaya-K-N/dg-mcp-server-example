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
    throw new Error(errorMessage);
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
