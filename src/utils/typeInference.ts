/**
 * Type inference utilities for dataset columns
 */

/**
 * Infer data type from a sample value
 */
export function inferType(value: any): string {
  if (value === null || value === undefined) return 'unknown';
  if (Array.isArray(value)) return 'array';
  if (value instanceof Date) return 'date';
  if (typeof value === 'object') return 'object';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  
  // Check if string looks like a date
  if (typeof value === 'string') {
    const dateCheck = new Date(value);
    if (!isNaN(dateCheck.getTime()) && value.match(/\d{4}-\d{2}-\d{2}/)) {
      return 'date';
    }
  }
  
  return 'string';
}

/**
 * Extract unique sample values from rows for a specific field
 */
export function extractSampleValues(rows: any[], field: string, limit: number = 5): any[] {
  const seenValues = new Set<string>();
  const uniqueValues: any[] = [];
  
  for (const row of rows) {
    if (row[field] !== undefined && row[field] !== null) {
      // Convert to string for Set comparison
      const valueStr = JSON.stringify(row[field]);
      if (!seenValues.has(valueStr)) {
        seenValues.add(valueStr);
        uniqueValues.push(row[field]);
        if (uniqueValues.length >= limit) break;
      }
    }
  }
  
  return uniqueValues;
}

/**
 * Infer column type from multiple sample values
 */
export function inferColumnType(values: any[]): string {
  if (values.length === 0) return 'unknown';
  
  const types = values.map(v => inferType(v));
  const typeCounts: Record<string, number> = {};
  
  for (const type of types) {
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  }
  
  // Return most common type
  return Object.entries(typeCounts)
    .sort((a, b) => b[1] - a[1])[0][0];
}
