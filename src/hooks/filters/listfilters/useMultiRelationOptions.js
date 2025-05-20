'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/browser';
import { fetchResolvedFilter, buildTree, flattenTreeWithIndent } from '@/lib/utils/filters/listfilters/dynamicFilterUtils';

/**
 * Hook to fetch and manage options for MultiRelationship fields
 * Handles hierarchical display and filtering
 * 
 * @param {Object} param0 - Parameters
 * @param {Object} param0.field - Field configuration
 * @param {Object} param0.record - Parent record for context (optional)
 * @returns {Object} - { options, loading, setOptions, refresh }
 */
export const useMultiRelationOptions = ({ field, record }) => {
  const supabase = createClient();
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Extract necessary info from field
  const { 
    relation = {},
    parentId = record?.id,
    parentTable = '',
  } = field || {};
  
  const {
    table,
    labelField = 'title',
    filterFrom,
    filter,
    tableFields = [],
  } = relation;

  // Function to fetch options that can be called manually if needed
  const fetchOptions = useCallback(async () => {
    if (!table || !labelField) {
      console.warn('[useMultiRelationOptions] Missing table or labelField in field config');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Start with the base query
      const fields = Array.from(new Set(['id', labelField, 'parent_id', ...tableFields]));
      let query = supabase.from(table).select(fields.join(', '));
      
      // Apply dynamic filters if applicable
      let dynamicFilters = {};
      if (filterFrom && filter && parentId) {
        try {
          dynamicFilters = await fetchResolvedFilter({
            supabase,
            field: {
              ...field,
              relation: {
                ...relation,
                filterFrom,
                filter,
              },
              parentId,
              parentTable,
            },
            parentId,
          });
          
          console.log('[useMultiRelationOptions] Resolved dynamic filters:', dynamicFilters);
          
          // Apply each filter condition to the query
          Object.entries(dynamicFilters).forEach(([key, value]) => {
            if (value === null || value === undefined || value === '') {
              return; // Skip empty filters
            }
            
            if (Array.isArray(value)) {
              query = query.in(key, value);
            } else if (typeof value === 'string' && value.includes('%')) {
              query = query.ilike(key, value);
            } else {
              query = query.eq(key, value);
            }
          });
        } catch (err) {
          console.error('[useMultiRelationOptions] Error resolving dynamic filters:', err);
        }
      }
      
      // Execute the query
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      if (!data || data.length === 0) {
        console.log('[useMultiRelationOptions] No options found for', table);
        setOptions([]);
        return;
      }
      
      // Process data into hierarchical structure if parent_id exists
      const hasParentField = data.some(item => 'parent_id' in item);
      
      if (hasParentField) {
        // Build and flatten the tree for indented display
        const tree = buildTree(data);
        const flattenedTree = flattenTreeWithIndent(tree, 0, labelField);
        
        // Ensure unique options (no duplicates by ID)
        const uniqueOptions = Array.from(
          new Map(flattenedTree.map(item => [item.id, item])).values()
        );
        
        setOptions(uniqueOptions);
      } else {
        // No hierarchy, just sort by label
        const sortedOptions = [...data].sort((a, b) => 
          (a[labelField] || '').localeCompare(b[labelField] || '')
        );
        
        // Add the indentedLabel property for consistency
        const formattedOptions = sortedOptions.map(item => ({
          ...item,
          indentedLabel: item[labelField] || `ID: ${item.id}`
        }));
        
        setOptions(formattedOptions);
      }
    } catch (err) {
      console.error('[useMultiRelationOptions] Error fetching options:', err);
      setError(err.message || 'Failed to load options');
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, [table, labelField, filterFrom, filter, parentId, parentTable, tableFields]);
  
  // Fetch options on mount and when dependencies change
  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);
  
  return { 
    options, 
    loading, 
    error,
    setOptions,
    refresh: fetchOptions
  };
};

export default useMultiRelationOptions;