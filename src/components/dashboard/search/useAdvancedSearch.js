// src/hooks/useAdvancedSearch.js
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/browser';
import * as collections from '@/collections';

/**
 * Advanced search hook for multi-collection searching with filters
 * IMPORTANT: This hook must only be used in client components
 */
export const useAdvancedSearch = (initialCollections = []) => {
  const supabase = createClient();
  
  // State - Initialize with safe defaults
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({});
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState({});
  const [resultCounts, setResultCounts] = useState({});
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Memoized collections list - ensure it's always an array
  const targetCollections = useMemo(() => {
    if (!collections || typeof collections !== 'object') {
      console.warn('[useAdvancedSearch] Collections not loaded properly');
      return [];
    }
    
    const validCollections = initialCollections.length > 0 
      ? initialCollections.filter(key => collections[key]?.fields)
      : Object.keys(collections).filter(key => collections[key]?.fields);
    
    return validCollections;
  }, [initialCollections]);

  // Initialize hook only on client
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsInitialized(true);
    }
  }, []);

  /**
   * Simplified select fields builder with error handling
   */
  const buildSelectFields = useCallback((config, collectionName) => {
    if (!config?.fields) return '*';

    try {
      // Start with basic fields
      const fields = ['*'];

          if (collectionName === 'project') {
            fields.push('brands:brand_project(brand(id, title))');// join brand where brand.project_id = project.id
          }
      
      // Only add relationship details for fields that are safe to query
      config.fields.forEach(field => {
        try {
          if (field.type === 'relationship' && field.relation?.table) {
            const relationTable = field.relation.table;
            const labelField = field.relation.labelField || 'title';
            
            // Use simpler relationship queries to avoid errors
            fields.push(`${field.name}_details:${relationTable}(id, ${labelField})`);
          }
        } catch (err) {
          console.warn(`[useAdvancedSearch] Skipping field ${field.name} due to error:`, err);
        }
      });
      
      // Only add thumbnail details if we know the field exists
      const hasThumbnailField = config.fields?.some(field => 
        field.name === 'thumbnail_id' && field.type === 'media'
      );
      
      if (hasThumbnailField) {
        try {
          fields.push('thumbnail_details:thumbnail_id(id, url, alt_text)');
        } catch (err) {
          console.warn(`[useAdvancedSearch] Skipping thumbnail for ${collectionName}:`, err);
        }
      }

      return fields.join(', ');
    } catch (err) {
      console.warn(`[useAdvancedSearch] Error building select fields for ${collectionName}, using fallback:`, err);
      return '*'; // Fallback to basic query
    }
  }, []);

  /**
   * Get searchable fields from config with safer defaults
   */
  const getSearchableFields = useCallback((config) => {
    if (!config?.fields) return ['title'];
    
    try {
      const textFields = config.fields
        .filter(field => {
          return (
            ['text', 'richText', 'email'].includes(field.type) || 
            (!field.type && ['title', 'name', 'description', 'email'].includes(field.name))
          );
        })
        .map(field => field.name);
      
      // Always include title if it exists
      if (!textFields.includes('title')) {
        textFields.push('title');
      }
      
      return textFields.length > 0 ? textFields : ['title'];
    } catch (err) {
      console.warn('[useAdvancedSearch] Error getting searchable fields:', err);
      return ['title'];
    }
  }, []);

  /**
   * Apply search and filters with better error handling
   */
  const applySearchAndFilters = useCallback((query, config, searchText, appliedFilters) => {
    if (!query || !config) return query;
    
    let modifiedQuery = query;

    try {
      // Apply text search across searchable fields
      if (searchText?.trim()) {
        const searchableFields = getSearchableFields(config);
        if (searchableFields.length > 0) {
          try {
            // Use a safer OR condition approach
            const searchConditions = searchableFields
              .map(field => `${field}.ilike.%${searchText.trim()}%`)
              .join(',');
            modifiedQuery = modifiedQuery.or(searchConditions);
          } catch (searchErr) {
            console.warn('[useAdvancedSearch] Text search failed, skipping:', searchErr);
          }
        }
      }

      // Apply filters with individual error handling
      if (appliedFilters && typeof appliedFilters === 'object') {
        Object.entries(appliedFilters).forEach(([fieldName, value]) => {
          if (value === null || value === undefined || value === '' || value === 'all') {
            return;
          }

          try {
            if (Array.isArray(value)) {
              if (value.length > 0) {
                modifiedQuery = modifiedQuery.in(fieldName, value);
              }
            } else {
              modifiedQuery = modifiedQuery.eq(fieldName, value);
            }
          } catch (filterErr) {
            console.warn(`[useAdvancedSearch] Filter ${fieldName} failed, skipping:`, filterErr);
          }
        });
      }
    } catch (err) {
      console.warn('[useAdvancedSearch] Error applying search and filters:', err);
    }

    return modifiedQuery;
  }, [getSearchableFields]);

  /**
   * Perform search for a specific collection with improved error handling
   */
  const searchCollection = useCallback(async (collectionName, searchText, appliedFilters, options = {}) => {
    // Early return if not initialized
    if (!isInitialized) {
      return { data: [], count: 0 };
    }

    const config = collections[collectionName];
    if (!config?.fields) {
      console.warn(`[useAdvancedSearch] Collection ${collectionName} not found or has no fields`);
      return { data: [], count: 0 };
    }

    // Set loading state
    setLoading(prev => ({ ...prev, [collectionName]: true }));
    setError(null);

    try {
      // Try a simple query first if complex select fields fail
      let selectFields = '*';
      try {
        selectFields = buildSelectFields(config, collectionName);
        console.log(`[useAdvancedSearch] Select fields for ${collectionName}:`, selectFields);
      } catch (selectErr) {
        console.warn(`[useAdvancedSearch] Using simple select for ${collectionName}:`, selectErr);
        selectFields = '*';
      }
      
      // Start with base query
      let query = supabase.from(collectionName).select(selectFields);

      // Apply search and filters
      query = applySearchAndFilters(query, config, searchText, appliedFilters);

      // Apply sorting with fallback
      try {
        const sortField = options.sortField || 'updated_at';
        const sortOrder = options.sortOrder || 'desc';
        query = query.order(sortField, { ascending: sortOrder === 'asc' });
      } catch (sortErr) {
        console.warn(`[useAdvancedSearch] Sorting failed for ${collectionName}, using default:`, sortErr);
        // Try with id as fallback
        query = query.order('id', { ascending: false });
      }

      // Apply pagination
      const limit = options.limit || 50;
      const offset = options.offset || 0;
      query = query.range(offset, offset + limit - 1);

      const { data, error: queryError, count } = await query;

      if (queryError) {
        console.error(`[useAdvancedSearch] Search error for ${collectionName}:`, queryError);
        
        // Try fallback query with minimal select
        console.log(`[useAdvancedSearch] Attempting fallback query for ${collectionName}`);
        try {
          const fallbackQuery = supabase
            .from(collectionName)
            .select('*')
            .order('id', { ascending: false })
            .limit(50);
            
          const { data: fallbackData, error: fallbackError } = await fallbackQuery;
          
          if (fallbackError) {
            throw fallbackError;
          }
          
          console.log(`[useAdvancedSearch] Fallback successful for ${collectionName}:`, fallbackData?.length || 0);
          return {
            data: fallbackData || [],
            count: fallbackData?.length || 0
          };
        } catch (fallbackErr) {
          console.error(`[useAdvancedSearch] Fallback also failed for ${collectionName}:`, fallbackErr);
          setError(`Search failed for ${collectionName}: ${queryError.message || 'Unknown error'}`);
          return { data: [], count: 0 };
        }
      }

      console.log(`[useAdvancedSearch] Search results for ${collectionName}:`, data?.length || 0, 'items');
      return {
        data: data || [],
        count: count || data?.length || 0
      };
    } catch (error) {
      console.error(`[useAdvancedSearch] Unexpected search error for ${collectionName}:`, error);
      setError(`Unexpected error searching ${collectionName}: ${error?.message || 'Unknown error'}`);
      return { data: [], count: 0 };
    } finally {
      setLoading(prev => ({ ...prev, [collectionName]: false }));
    }
  }, [supabase, buildSelectFields, applySearchAndFilters, isInitialized]);

  /**
   * Search all target collections
   */
  const searchAllCollections = useCallback(async (searchText = searchQuery, allFilters = filters) => {
    if (!isInitialized || targetCollections.length === 0) {
      return { results: {}, counts: {} };
    }

    console.log('[useAdvancedSearch] Searching collections:', { searchText, allFilters, targetCollections });

    try {
      const searchPromises = targetCollections.map(async (collectionName) => {
        const collectionFilters = allFilters[collectionName] || {};
        const result = await searchCollection(collectionName, searchText, collectionFilters);
        return { collectionName, ...result };
      });

      const allResults = await Promise.all(searchPromises);
      
      const newResults = {};
      const newCounts = {};
      
      allResults.forEach(({ collectionName, data, count }) => {
        newResults[collectionName] = data;
        newCounts[collectionName] = count;
      });

      setResults(newResults);
      setResultCounts(newCounts);
      
      return { results: newResults, counts: newCounts };
    } catch (error) {
      console.error('[useAdvancedSearch] Error in searchAllCollections:', error);
      setError(`Search failed: ${error?.message || 'Unknown error'}`);
      return { results: {}, counts: {} };
    }
  }, [searchQuery, filters, targetCollections, searchCollection, isInitialized]);

  /**
   * Update filters for a specific collection
   */
  const updateFilter = useCallback((collectionName, fieldName, value) => {
    setFilters(prev => ({
      ...prev,
      [collectionName]: {
        ...prev[collectionName],
        [fieldName]: value
      }
    }));
  }, []);

  /**
   * Clear all filters
   */
  const clearAllFilters = useCallback(() => {
    setFilters({});
  }, []);

  /**
   * Clear filters for a specific collection
   */
  const clearCollectionFilters = useCallback((collectionName) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[collectionName];
      return newFilters;
    });
  }, []);

  /**
   * Get filter options for relationship fields with error handling
   */
  const getFilterOptions = useCallback(async (collectionName, fieldName) => {
    if (!isInitialized) return [];
    
    const config = collections[collectionName];
    if (!config) return [];

    const field = config.fields?.find(f => f.name === fieldName);
    if (!field || field.type !== 'relationship' || !field.relation?.table) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from(field.relation.table)
        .select(`id, ${field.relation.labelField || 'title'}`)
        .order(field.relation.labelField || 'title')
        .limit(200);

      if (error) {
        console.error(`[useAdvancedSearch] Error loading filter options for ${fieldName}:`, error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error(`[useAdvancedSearch] Error loading filter options for ${fieldName}:`, error);
      return [];
    }
  }, [supabase, isInitialized]);

  /**
   * Load all filter options for all collections
   */
  const loadAllFilterOptions = useCallback(async () => {
    if (!isInitialized || targetCollections.length === 0) {
      return {};
    }
    
    const allOptions = {};
    
    for (const collectionName of targetCollections) {
      const config = collections[collectionName];
      if (!config) continue;

      allOptions[collectionName] = {};
      
      const relationshipFields = config.fields?.filter(field => 
        field.type === 'relationship' && field.relation?.table
      ) || [];

      for (const field of relationshipFields) {
        try {
          const options = await getFilterOptions(collectionName, field.name);
          allOptions[collectionName][field.name] = options;
        } catch (err) {
          console.warn(`[useAdvancedSearch] Error loading options for ${field.name}:`, err);
          allOptions[collectionName][field.name] = [];
        }
      }
    }
    
    return allOptions;
  }, [targetCollections, getFilterOptions, isInitialized]);

  // Auto-search when query or filters change (only on client)
  useEffect(() => {
    if (!isInitialized) return;
    
    const debounceTimer = setTimeout(() => {
      searchAllCollections();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, filters, isInitialized]);

  // Calculate total results across all collections
  const totalResults = useMemo(() => {
    return Object.values(resultCounts).reduce((sum, count) => sum + count, 0);
  }, [resultCounts]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return Object.values(filters).some(collectionFilters =>
      Object.values(collectionFilters || {}).some(value => 
        value !== null && value !== undefined && value !== '' && value !== 'all'
      )
    );
  }, [filters]);

  // Check if search is in progress
  const isSearching = useMemo(() => {
    return Object.values(loading).some(Boolean);
  }, [loading]);

  return {
    // State
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    results,
    loading,
    resultCounts,
    error,
    isInitialized,
    
    // Computed values
    totalResults,
    hasActiveFilters,
    isSearching,
    targetCollections,
    
    // Actions
    searchAllCollections,
    searchCollection,
    updateFilter,
    clearAllFilters,
    clearCollectionFilters,
    getFilterOptions,
    loadAllFilterOptions,
    
    // Utilities
    buildSelectFields,
    getSearchableFields,
    applySearchAndFilters
  };
};

export default useAdvancedSearch;