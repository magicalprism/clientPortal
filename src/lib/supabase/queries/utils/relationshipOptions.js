import { createClient } from '@/lib/supabase/browser';

const supabase = createClient();

/**
 * Fetch options for a relationship filter
 * @param {string} table - The table to fetch options from
 * @param {string} labelField - The field to use as the label
 * @param {Object} filters - Optional filters to apply to the query
 * @returns {Promise<{data: Array, error: Object}>} - The query result
 */
export const fetchRelationshipOptions = async (table, labelField, filters = {}) => {
  try {
    let query = supabase.from(table).select(`id, ${labelField}`);
    
    // Apply any filters
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        query = query.eq(key, val);
      }
    });
    
    const { data, error } = await query;
    
    if (error) {
      return { data: null, error };
    }
    
    // Sort the data by the label field
    const sortedData = data ? [...data].sort((a, b) => 
      (a[labelField] || '').localeCompare(b[labelField] || '')
    ) : [];
    
    return { data: sortedData, error: null };
  } catch (err) {
    return { data: null, error: err };
  }
};