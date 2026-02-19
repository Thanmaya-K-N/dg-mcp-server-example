/**
 * Centralized error handling utilities
 */

export class DatagroomError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'DatagroomError';
  }
}

export class DatasetNotFoundError extends DatagroomError {
  constructor(datasetName: string) {
    super(
      `Dataset '${datasetName}' not found`,
      'DATASET_NOT_FOUND',
      404
    );
    this.name = 'DatasetNotFoundError';
  }
}

export class InvalidFilterError extends DatagroomError {
  constructor(message: string) {
    super(
      `Invalid filter: ${message}`,
      'INVALID_FILTER',
      400
    );
    this.name = 'InvalidFilterError';
  }
}

export class FieldNotFoundError extends DatagroomError {
  constructor(fieldName: string, datasetName: string) {
    super(
      `Field '${fieldName}' does not exist in dataset '${datasetName}'`,
      'FIELD_NOT_FOUND',
      400
    );
    this.name = 'FieldNotFoundError';
  }
}

export class DatabaseConnectionError extends DatagroomError {
  constructor(message: string) {
    super(
      `Unable to connect to database: ${message}`,
      'DATABASE_CONNECTION_ERROR',
      503
    );
    this.name = 'DatabaseConnectionError';
  }
}

/**
 * Format error for MCP tool response
 */
export function formatError(error: unknown): string {
  if (error instanceof DatagroomError) {
    return `${error.name}: ${error.message}`;
  }
  
  if (error instanceof Error) {
    return `Error: ${error.message}`;
  }
  
  return `Unknown error: ${String(error)}`;
}
