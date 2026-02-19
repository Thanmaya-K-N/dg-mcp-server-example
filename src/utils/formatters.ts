/**
 * Formatting utilities for tool responses
 */

import { Filter } from '../types.js';

/**
 * Format data as a markdown table
 */
export function formatMarkdownTable(data: any[]): string {
  if (!data || data.length === 0) return 'No data';
  
  const columns = Object.keys(data[0]);
  const header = `| ${columns.join(' | ')} |`;
  const separator = `| ${columns.map(() => '---').join(' | ')} |`;
  
  const rows = data.map(row => 
    `| ${columns.map(col => formatCellValue(row[col])).join(' | ')} |`
  );
  
  return [header, separator, ...rows].join('\n');
}

/**
 * Format a single cell value for markdown table
 */
function formatCellValue(value: any): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  if (typeof value === 'string' && value.includes('|')) {
    // Escape pipe characters in markdown tables
    return value.replace(/\|/g, '\\|');
  }
  return String(value);
}

/**
 * Format query summary with statistics and filters
 */
export function formatQuerySummary(
  datasetName: string,
  totalMatching: number,
  rowsReturned: number,
  filters: Filter[],
  offset: number,
  hasMore: boolean
): string {
  const lines = [
    `# Query Results: ${datasetName}`,
    '',
    `**Total Matching Rows**: ${totalMatching.toLocaleString()}`,
    `**Rows Returned**: ${rowsReturned.toLocaleString()}`,
    `**Offset**: ${offset.toLocaleString()}`,
    `**Has More**: ${hasMore ? 'Yes' : 'No'}`,
  ];
  
  if (filters.length > 0) {
    lines.push('', '**Applied Filters**:');
    filters.forEach(f => {
      const valueStr = typeof f.value === 'object' 
        ? JSON.stringify(f.value) 
        : String(f.value);
      lines.push(`- \`${f.field}\` ${f.type} \`${valueStr}\``);
    });
  }
  
  return lines.join('\n');
}

/**
 * Format aggregation results as markdown
 */
export function formatAggregationResults(
  datasetName: string,
  results: any[],
  groupBy?: string
): string {
  const lines = [
    `# Aggregation Results: ${datasetName}`,
    '',
  ];
  
  if (groupBy) {
    lines.push(`**Grouped by**: \`${groupBy}\``, '');
  }
  
  if (results.length === 0) {
    lines.push('No results found.');
    return lines.join('\n');
  }
  
  // Build table headers from first result
  const firstResult = results[0];
  const headers: string[] = [];
  if (groupBy && 'group_value' in firstResult) {
    headers.push(groupBy);
  }
  if ('count' in firstResult) headers.push('Count');
  if ('sum' in firstResult) headers.push('Sum');
  if ('avg' in firstResult) headers.push('Average');
  if ('min' in firstResult) headers.push('Min');
  if ('max' in firstResult) headers.push('Max');
  
  const headerRow = `| ${headers.join(' | ')} |`;
  const separatorRow = `| ${headers.map(() => '---').join(' | ')} |`;
  lines.push(headerRow);
  lines.push(separatorRow);
  
  // Build data rows
  for (const result of results) {
    const row: string[] = [];
    if (groupBy && 'group_value' in result) {
      row.push(formatCellValue(result.group_value));
    }
    if ('count' in result) row.push(formatCellValue(result.count));
    if ('sum' in result) row.push(formatCellValue(result.sum));
    if ('avg' in result) row.push(formatCellValue(result.avg?.toFixed(2)));
    if ('min' in result) row.push(formatCellValue(result.min));
    if ('max' in result) row.push(formatCellValue(result.max));
    lines.push(`| ${row.join(' | ')} |`);
  }
  
  return lines.join('\n');
}
