'use client';

/**
 * Utility function to normalize multirelationship values
 * This handles all the different formats that might be encountered
 */

/**
 * Parses and normalizes tag data from various formats into a standard array of strings
 * @param {any} value - The value to parse (array, string, object, etc.)
 * @returns {string[]} - Normalized array of string IDs
 */
export const normalizeMultiRelationshipValue = (value) => {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return [];
  }
  
  // Already an array
  if (Array.isArray(value)) {
    return value.map(String).filter(Boolean);
  }
  
  // Object with 'ids' property
  if (typeof value === 'object' && value !== null && Array.isArray(value.ids)) {
    return value.ids.map(String).filter(Boolean);
  }
  
  // String that looks like JSON array
  if (typeof value === 'string' && value.trim().startsWith('[') && value.trim().endsWith(']')) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map(String).filter(Boolean);
      }
    } catch (e) {
      // Not valid JSON, continue to other checks
    }
  }
  
  // Comma-separated string
  if (typeof value === 'string' && value.includes(',')) {
    return value.split(',').map(s => s.trim()).filter(Boolean);
  }
  
  // Single value (number or string)
  if (typeof value === 'string' || typeof value === 'number') {
    const str = String(value).trim();
    return str ? [str] : [];
  }
  
  // No recognized format, return empty array
  return [];
};

export default normalizeMultiRelationshipValue;