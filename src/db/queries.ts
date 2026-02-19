/**
 * Database query helper functions
 */

import { Db, Collection } from 'mongodb';
import { DatasetNotFoundError } from '../utils/errorHandlers.js';

/**
 * Check if a dataset exists (has a 'data' collection)
 */
export async function datasetExists(db: Db, datasetName: string): Promise<boolean> {
  const collections = await db.listCollections().toArray();
  return collections.some(col => col.name === 'data');
}

/**
 * Get paged results from a collection (similar to pagedFind in dbAbstraction)
 */
export async function pagedFind(
  collection: Collection,
  query: any,
  options: {
    limit?: number;
    skip?: number;
    sort?: any;
  } = {}
): Promise<any[]> {
  let cursor = collection.find(query);
  
  if (options.sort) {
    cursor = cursor.sort(options.sort);
  }
  
  if (options.skip) {
    cursor = cursor.skip(options.skip);
  }
  
  if (options.limit) {
    cursor = cursor.limit(options.limit);
  }
  
  return cursor.toArray();
}

/**
 * Get total count of documents matching a query
 */
export async function getCount(collection: Collection, query: any): Promise<number> {
  return collection.countDocuments(query);
}

/**
 * Validate that a dataset exists, throw error if not
 */
export async function validateDatasetExists(db: Db, datasetName: string): Promise<void> {
  if (!(await datasetExists(db, datasetName))) {
    throw new DatasetNotFoundError(datasetName);
  }
}
