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
  // Initialize filters with default is_client: true for company collection
  const [filters, setFilters] = useState({
    company: { is_client: true }
  });
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

      // Add collection-specific joins - only for project as it's known to work
      if (collectionName === 'project') {
        fields.push('brands:brand_project(brand(id, title))'); // join brand where brand.project_id = project.id
      }
      
      // For problematic collections, use a simpler approach
      if (['media', 'company', 'contact', 'task', 'product', 'event', 'contract', 'proposal'].includes(collectionName)) {
        // Just use basic fields for these collections to avoid join errors
        return '*';
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
      // First, get all text-type fields
      const textFields = config.fields
        .filter(field => {
          return (
            ['text', 'richText', 'email'].includes(field.type) || 
            (!field.type && ['title', 'name', 'description', 'content', 'email'].includes(field.name))
          );
        })
        .map(field => field.name);
      
      // Always include important fields if they exist in the collection
      const importantFields = ['title', 'description', 'content'];
      importantFields.forEach(fieldName => {
        if (!textFields.includes(fieldName) && config.fields.some(f => f.name === fieldName)) {
          textFields.push(fieldName);
        }
      });
      
      return textFields.length > 0 ? textFields : ['title'];
    } catch (err) {
      console.warn('[useAdvancedSearch] Error getting searchable fields:', err);
      return ['title'];
    }
  }, []);

  /**
   * Apply search and filters with better error handling and foreign relationship search
   */
  const applySearchAndFilters = useCallback((query, config, searchText, appliedFilters) => {
    if (!query || !config) return query;
    
    let modifiedQuery = query;
    const collectionName = config.tableName || '';

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
            
            console.log(`[useAdvancedSearch] Applying search conditions for ${collectionName}:`, searchConditions);
            
            // Add the basic search conditions
            modifiedQuery = modifiedQuery.or(searchConditions);
            
            // Add foreign relationship search conditions based on collection type
            
            // Project relationships
            if (collectionName === 'project') {
              try {
                // Search for projects where the author (contact) contains the search text
                modifiedQuery = modifiedQuery.or(`author_details.first_name.ilike.%${searchText.trim()}%,author_details.last_name.ilike.%${searchText.trim()}%`);
                
                // Search for projects where any associated company contains the search text
                modifiedQuery = modifiedQuery.or(`brands.brand.title.ilike.%${searchText.trim()}%`);
              } catch (err) {
                console.warn('[useAdvancedSearch] Project relationship search failed:', err);
              }
            }
            
            // Company relationships
            else if (collectionName === 'company') {
              try {
                // Search for companies where any associated contact contains the search text
                modifiedQuery = modifiedQuery.or(`contacts.contact_id.first_name.ilike.%${searchText.trim()}%,contacts.contact_id.last_name.ilike.%${searchText.trim()}%`);
              } catch (err) {
                console.warn('[useAdvancedSearch] Company relationship search failed:', err);
              }
            }
            
            // Contact relationships
            else if (collectionName === 'contact') {
              try {
                // Search for contacts where any associated company contains the search text
                modifiedQuery = modifiedQuery.or(`companies.company_id.title.ilike.%${searchText.trim()}%`);
              } catch (err) {
                console.warn('[useAdvancedSearch] Contact relationship search failed:', err);
              }
            }
            
            // Media relationships
            else if (collectionName === 'media') {
              try {
                // Search for media where the uploader (contact) contains the search text
                modifiedQuery = modifiedQuery.or(`uploader_details.first_name.ilike.%${searchText.trim()}%,uploader_details.last_name.ilike.%${searchText.trim()}%`);
              } catch (err) {
                console.warn('[useAdvancedSearch] Media relationship search failed:', err);
              }
            }
          } catch (searchErr) {
            console.warn('[useAdvancedSearch] Text search failed, skipping:', searchErr);
          }
        }
      }

      // Apply filters with individual error handling and foreign relationship consideration
      if (appliedFilters && typeof appliedFilters === 'object') {
        console.log(`[useAdvancedSearch] Applying filters for ${collectionName}:`, appliedFilters);
        
        // Always apply is_client=true filter to company collection if not explicitly set
        if (collectionName === 'company' && appliedFilters.is_client === undefined) {
          console.log(`[useAdvancedSearch] Automatically applying is_client=true filter to company collection`);
          modifiedQuery = modifiedQuery.eq('is_client', true);
        }
        
        // First, apply direct filters to the collection
        Object.entries(appliedFilters).forEach(([fieldName, value]) => {
          if (value === null || value === undefined || value === '' || value === 'all') {
            console.log(`[useAdvancedSearch] Skipping empty filter: ${fieldName}`);
            return;
          }

          try {
            // Check if this is a relationship field
            const field = config.fields?.find(f => f.name === fieldName);
            const isRelationship = field?.type === 'relationship';
            
            if (isRelationship) {
              console.log(`[useAdvancedSearch] Applying relationship filter: ${fieldName}`);
              
              // Handle relationship fields differently based on collection type
              if (collectionName === 'project' && fieldName === 'company_id') {
                // For projects, filter by company_id
                if (Array.isArray(value)) {
                  if (value.length > 0) {
                    console.log(`[useAdvancedSearch] Applying company filter to project: IN ${JSON.stringify(value)}`);
                    modifiedQuery = modifiedQuery.in('company_id', value);
                  }
                } else {
                  console.log(`[useAdvancedSearch] Applying company filter to project: = ${JSON.stringify(value)}`);
                  modifiedQuery = modifiedQuery.eq('company_id', value);
                }
              }
              else if (collectionName === 'project' && fieldName === 'author_id') {
                // For projects, filter by author_id
                if (Array.isArray(value)) {
                  if (value.length > 0) {
                    console.log(`[useAdvancedSearch] Applying author filter to project: IN ${JSON.stringify(value)}`);
                    modifiedQuery = modifiedQuery.in('author_id', value);
                  }
                } else {
                  console.log(`[useAdvancedSearch] Applying author filter to project: = ${JSON.stringify(value)}`);
                  modifiedQuery = modifiedQuery.eq('author_id', value);
                }
              }
              else if (collectionName === 'media' && fieldName === 'uploader_id') {
                // For media, filter by uploader_id
                if (Array.isArray(value)) {
                  if (value.length > 0) {
                    console.log(`[useAdvancedSearch] Applying uploader filter to media: IN ${JSON.stringify(value)}`);
                    modifiedQuery = modifiedQuery.in('uploader_id', value);
                  }
                } else {
                  console.log(`[useAdvancedSearch] Applying uploader filter to media: = ${JSON.stringify(value)}`);
                  modifiedQuery = modifiedQuery.eq('uploader_id', value);
                }
              }
              else if (collectionName === 'media' && fieldName === 'company_id') {
                // For media, filter by company_id
                if (Array.isArray(value)) {
                  if (value.length > 0) {
                    console.log(`[useAdvancedSearch] Applying company filter to media: IN ${JSON.stringify(value)}`);
                    modifiedQuery = modifiedQuery.in('company_id', value);
                  }
                } else {
                  console.log(`[useAdvancedSearch] Applying company filter to media: = ${JSON.stringify(value)}`);
                  modifiedQuery = modifiedQuery.eq('company_id', value);
                }
              }
              else if ((collectionName === 'contact' || collectionName === 'company') && fieldName.includes('_id')) {
                // For contacts and companies, handle relationship fields
                if (Array.isArray(value)) {
                  if (value.length > 0) {
                    console.log(`[useAdvancedSearch] Applying relationship filter to ${collectionName}: ${fieldName} IN ${JSON.stringify(value)}`);
                    modifiedQuery = modifiedQuery.in(fieldName, value);
                  }
                } else {
                  console.log(`[useAdvancedSearch] Applying relationship filter to ${collectionName}: ${fieldName} = ${JSON.stringify(value)}`);
                  modifiedQuery = modifiedQuery.eq(fieldName, value);
                }
              }
              else {
                // For other relationship fields, apply standard filter
                if (Array.isArray(value)) {
                  if (value.length > 0) {
                    console.log(`[useAdvancedSearch] Applying standard relationship filter: ${fieldName} IN ${JSON.stringify(value)}`);
                    modifiedQuery = modifiedQuery.in(fieldName, value);
                  }
                } else {
                  console.log(`[useAdvancedSearch] Applying standard relationship filter: ${fieldName} = ${JSON.stringify(value)}`);
                  modifiedQuery = modifiedQuery.eq(fieldName, value);
                }
              }
            } else {
              // Handle non-relationship fields
              if (Array.isArray(value)) {
                if (value.length > 0) {
                  console.log(`[useAdvancedSearch] Applying array filter: ${fieldName} IN ${JSON.stringify(value)}`);
                  modifiedQuery = modifiedQuery.in(fieldName, value);
                }
              } else {
                console.log(`[useAdvancedSearch] Applying scalar filter: ${fieldName} = ${JSON.stringify(value)}`);
                modifiedQuery = modifiedQuery.eq(fieldName, value);
              }
            }
          } catch (filterErr) {
            console.warn(`[useAdvancedSearch] Filter ${fieldName} failed, skipping:`, filterErr);
          }
        });
        
        // Now, apply special handling for cross-collection filters
        // This is where we consider foreign relationships for filters
        
        // For example, if filtering projects by status, also consider related entities
        if (collectionName === 'project' && appliedFilters.status) {
          try {
            console.log(`[useAdvancedSearch] Applying cross-collection filter for project status: ${appliedFilters.status}`);
            // Additional logic could be added here to filter related entities
          } catch (err) {
            console.warn('[useAdvancedSearch] Cross-collection filter for project status failed:', err);
          }
        }
        
        // If filtering by company, consider all related entities
        if (appliedFilters.company_id) {
          try {
            console.log(`[useAdvancedSearch] Applying cross-collection filter for company_id: ${appliedFilters.company_id}`);
            // Additional logic could be added here to filter related entities
          } catch (err) {
            console.warn('[useAdvancedSearch] Cross-collection filter for company_id failed:', err);
          }
        }
        
        // If filtering by contact, consider all related entities
        if (appliedFilters.contact_id || appliedFilters.author_id) {
          try {
            const contactId = appliedFilters.contact_id || appliedFilters.author_id;
            console.log(`[useAdvancedSearch] Applying cross-collection filter for contact: ${contactId}`);
            // Additional logic could be added here to filter related entities
          } catch (err) {
            console.warn('[useAdvancedSearch] Cross-collection filter for contact failed:', err);
          }
        }
      } else {
        console.log(`[useAdvancedSearch] No filters to apply for ${collectionName}`);
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
        // If there's no search text, sort alphabetically by title or name
        // Otherwise, sort by updated_at for relevance
        let sortField, sortOrder;
        
        if (!searchText || searchText.trim() === '') {
          // Determine which field to use for alphabetical sorting
          // Try title first, then name, then fall back to id
          const hasTitle = await supabase.from(collectionName).select('title').limit(1);
          const hasName = await supabase.from(collectionName).select('name').limit(1);
          
          if (!hasTitle.error && hasTitle.data && hasTitle.data.length > 0) {
            sortField = 'title';
          } else if (!hasName.error && hasName.data && hasName.data.length > 0) {
            sortField = 'name';
          } else {
            sortField = 'id';
          }
          
          sortOrder = 'asc'; // Alphabetical order (A-Z)
          console.log(`[useAdvancedSearch] No search query, sorting ${collectionName} alphabetically by ${sortField}`);
        } else {
          // When searching, sort by relevance (most recently updated first)
          sortField = options.sortField || 'updated_at';
          sortOrder = options.sortOrder || 'desc';
          console.log(`[useAdvancedSearch] Search query present, sorting ${collectionName} by ${sortField} ${sortOrder}`);
        }
        
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
   * Search all target collections with a simplified approach for foreign relationships
   */
  const searchAllCollections = useCallback(async (searchText = searchQuery, allFilters = filters) => {
    if (!isInitialized || targetCollections.length === 0) {
      return { results: {}, counts: {} };
    }

      console.log('[useAdvancedSearch] Searching collections:', { searchText, allFilters, targetCollections });

      try {
        // Use filters as they are, without applying them across collections
        console.log('[useAdvancedSearch] Using collection-specific filters only');
        
        // Standard search for all collections with their specific filters
        const searchPromises = targetCollections.map(async (collectionName) => {
          // Only use filters specifically set for this collection
          const collectionFilters = allFilters[collectionName] || {};
          console.log(`[useAdvancedSearch] Applying filters for ${collectionName}:`, collectionFilters);
          
          const result = await searchCollection(collectionName, searchText, collectionFilters);
          return { collectionName, ...result };
        });

      const allResults = await Promise.all(searchPromises);
      
      const newResults = {};
      const newCounts = {};
      
      // Process standard search results
      allResults.forEach(({ collectionName, data, count }) => {
        newResults[collectionName] = data || [];
        newCounts[collectionName] = count || 0;
      });
      
      // If searching for a specific term, add special cases for projects and companies
      if (searchText?.trim()) {
        // Special case for projects
        if (targetCollections.includes('project')) {
        try {
          console.log(`[useAdvancedSearch] Performing simplified project search for "${searchText}"`);
          
          // STEP 1: Get all projects that directly match the search text
          const { data: directProjectResults } = await supabase
            .from('project')
            .select('*')
            .or(`title.ilike.%${searchText.trim()}%,description.ilike.%${searchText.trim()}%,site_name.ilike.%${searchText.trim()}%,site_tagline.ilike.%${searchText.trim()}%`)
            .eq('is_deleted', false);
          
          console.log(`[useAdvancedSearch] Found ${directProjectResults?.length || 0} projects with direct match`);
          
          // STEP 2: Get all contacts that match the search text
          const { data: matchingContacts } = await supabase
            .from('contact')
            .select('id, first_name, last_name, email')
            .or(`first_name.ilike.%${searchText.trim()}%,last_name.ilike.%${searchText.trim()}%,email.ilike.%${searchText.trim()}%`)
            .eq('is_deleted', false);
          
          console.log(`[useAdvancedSearch] Found ${matchingContacts?.length || 0} contacts matching "${searchText}"`);
          
          // STEP 3: Get all projects where these contacts are authors
          let authorProjects = [];
          if (matchingContacts?.length > 0) {
            const contactIds = matchingContacts.map(contact => contact.id);
            const { data: projects } = await supabase
              .from('project')
              .select('*')
              .in('author_id', contactIds)
              .eq('is_deleted', false);
            
            authorProjects = projects || [];
            console.log(`[useAdvancedSearch] Found ${authorProjects.length} projects where matching contacts are authors`);
          }
          
          // STEP 4: Get all projects associated with these contacts through the pivot table
          let relatedProjects = [];
          if (matchingContacts?.length > 0) {
            const contactIds = matchingContacts.map(contact => contact.id);
            
            // First get the project IDs from the pivot table
            const { data: pivotData } = await supabase
              .from('contact_project')
              .select('project_id')
              .in('contact_id', contactIds);
            
            if (pivotData?.length > 0) {
              const projectIds = pivotData.map(item => item.project_id);
              
              // Then get the actual projects
              const { data: projects } = await supabase
                .from('project')
                .select('*')
                .in('id', projectIds)
                .eq('is_deleted', false);
              
              relatedProjects = projects || [];
              console.log(`[useAdvancedSearch] Found ${relatedProjects.length} projects related to matching contacts via pivot table`);
            }
          }
          
          // STEP 5: Get all projects where the company name matches the search text
          let companyProjects = [];
          const { data: matchingCompanies } = await supabase
            .from('company')
            .select('id')
            .ilike('title', `%${searchText.trim()}%`)
            .eq('is_deleted', false);
          
          if (matchingCompanies?.length > 0) {
            const companyIds = matchingCompanies.map(company => company.id);
            const { data: projects } = await supabase
              .from('project')
              .select('*')
              .in('company_id', companyIds)
              .eq('is_deleted', false);
            
            companyProjects = projects || [];
            console.log(`[useAdvancedSearch] Found ${companyProjects.length} projects for companies matching "${searchText}"`);
          }
          
          // STEP 6: Get all projects associated with companies that are associated with matching contacts
          let contactCompanyProjects = [];
          if (matchingContacts?.length > 0) {
            try {
              const contactIds = matchingContacts.map(contact => contact.id);
              
              // First get the company IDs from the company_contact pivot table
              const { data: companyContactPivots } = await supabase
                .from('company_contact')
                .select('company_id')
                .in('contact_id', contactIds);
              
              if (companyContactPivots?.length > 0) {
                const companyIds = companyContactPivots.map(item => item.company_id);
                
                // Then get the projects associated with these companies
                const { data: projects } = await supabase
                  .from('project')
                  .select('*')
                  .in('company_id', companyIds)
                  .eq('is_deleted', false);
                
                contactCompanyProjects = projects || [];
                console.log(`[useAdvancedSearch] Found ${contactCompanyProjects.length} projects for companies associated with matching contacts`);
              }
            } catch (error) {
              console.error('[useAdvancedSearch] Error finding projects via contact->company relationship:', error);
            }
          }
          
          // STEP 7: Combine all project results and remove duplicates
          const allProjects = [
            ...(directProjectResults || []),
            ...(authorProjects || []),
            ...(relatedProjects || []),
            ...(companyProjects || []),
            ...(contactCompanyProjects || [])
          ];
          
          // Remove duplicates by creating a map keyed by project ID
          const uniqueProjects = {};
          allProjects.forEach(project => {
            if (project && project.id) {
              uniqueProjects[project.id] = project;
            }
          });
          
          const uniqueProjectsArray = Object.values(uniqueProjects);
          console.log(`[useAdvancedSearch] Total unique projects found for "${searchText}": ${uniqueProjectsArray.length}`);
          
          // Replace the project results with our comprehensive results
          newResults.project = uniqueProjectsArray;
          newCounts.project = uniqueProjectsArray.length;
        } catch (error) {
          console.error('[useAdvancedSearch] Error in comprehensive project search:', error);
          // Keep the original results if the comprehensive search fails
        }
        }
        
        // Special case for companies
        if (targetCollections.includes('company')) {
          try {
            console.log(`[useAdvancedSearch] Performing comprehensive company search for "${searchText}"`);
            
            // STEP 1: Get all companies that directly match the search text
            const { data: directCompanyResults } = await supabase
              .from('company')
              .select('*')
              .or(`title.ilike.%${searchText.trim()}%,description.ilike.%${searchText.trim()}%`)
              .eq('is_deleted', false);
            
            console.log(`[useAdvancedSearch] Found ${directCompanyResults?.length || 0} companies with direct match`);
            
            // STEP 2: Get all contacts that match the search text
            const { data: matchingContacts } = await supabase
              .from('contact')
              .select('id, first_name, last_name, email')
              .or(`first_name.ilike.%${searchText.trim()}%,last_name.ilike.%${searchText.trim()}%,email.ilike.%${searchText.trim()}%`)
              .eq('is_deleted', false);
            
            // STEP 3: Get all companies associated with these contacts through the pivot table
            let contactCompanies = [];
            if (matchingContacts?.length > 0) {
              try {
                const contactIds = matchingContacts.map(contact => contact.id);
                
                // First get the company IDs from the company_contact pivot table
                const { data: companyContactPivots } = await supabase
                  .from('company_contact')
                  .select('company_id')
                  .in('contact_id', contactIds);
                
                if (companyContactPivots?.length > 0) {
                  const companyIds = companyContactPivots.map(item => item.company_id);
                  
                  // Then get the actual companies
                  const { data: companies } = await supabase
                    .from('company')
                    .select('*')
                    .in('id', companyIds)
                    .eq('is_deleted', false);
                  
                  contactCompanies = companies || [];
                  console.log(`[useAdvancedSearch] Found ${contactCompanies.length} companies associated with matching contacts`);
                }
              } catch (error) {
                console.error('[useAdvancedSearch] Error finding companies via contact relationship:', error);
              }
            }
            
            // STEP 4: Combine all company results and remove duplicates
            const allCompanies = [
              ...(directCompanyResults || []),
              ...(contactCompanies || [])
            ];
            
            // Remove duplicates by creating a map keyed by company ID
            const uniqueCompanies = {};
            allCompanies.forEach(company => {
              if (company && company.id) {
                uniqueCompanies[company.id] = company;
              }
            });
            
            const uniqueCompaniesArray = Object.values(uniqueCompanies);
            console.log(`[useAdvancedSearch] Total unique companies found for "${searchText}": ${uniqueCompaniesArray.length}`);
            
            // Replace the company results with our comprehensive results
            newResults.company = uniqueCompaniesArray;
            newCounts.company = uniqueCompaniesArray.length;
          } catch (error) {
            console.error('[useAdvancedSearch] Error in comprehensive company search:', error);
            // Keep the original results if the comprehensive search fails
          }
        }
        
        // Special case for media
        if (targetCollections.includes('media')) {
          try {
            console.log(`[useAdvancedSearch] Performing comprehensive media search for "${searchText}"`);
            
            // STEP 1: Get all media that directly match the search text
            const { data: directMediaResults } = await supabase
              .from('media')
              .select('*')
              .or(`title.ilike.%${searchText.trim()}%,description.ilike.%${searchText.trim()}%,alt_text.ilike.%${searchText.trim()}%,filename.ilike.%${searchText.trim()}%`)
              .eq('is_deleted', false);
            
            console.log(`[useAdvancedSearch] Found ${directMediaResults?.length || 0} media with direct match`);
            
            // STEP 2: Get all contacts that match the search text
            const { data: matchingContacts } = await supabase
              .from('contact')
              .select('id, first_name, last_name, email')
              .or(`first_name.ilike.%${searchText.trim()}%,last_name.ilike.%${searchText.trim()}%,email.ilike.%${searchText.trim()}%`)
              .eq('is_deleted', false);
            
            // STEP 3: Get all media uploaded by these contacts
            let contactMedia = [];
            if (matchingContacts?.length > 0) {
              try {
                const contactIds = matchingContacts.map(contact => contact.id);
                
                const { data: media } = await supabase
                  .from('media')
                  .select('*')
                  .in('uploader_id', contactIds)
                  .eq('is_deleted', false);
                
                contactMedia = media || [];
                console.log(`[useAdvancedSearch] Found ${contactMedia.length} media uploaded by matching contacts`);
              } catch (error) {
                console.error('[useAdvancedSearch] Error finding media via contact relationship:', error);
              }
            }
            
            // STEP 4: Get all companies that match the search text
            const { data: matchingCompanies } = await supabase
              .from('company')
              .select('id')
              .ilike('title', `%${searchText.trim()}%`)
              .eq('is_deleted', false);
            
            // STEP 5: Get all companies associated with matching contacts
            let contactCompanies = [];
            if (matchingContacts?.length > 0) {
              try {
                const contactIds = matchingContacts.map(contact => contact.id);
                
                // Get the company IDs from the company_contact pivot table
                const { data: companyContactPivots } = await supabase
                  .from('company_contact')
                  .select('company_id')
                  .in('contact_id', contactIds);
                
                if (companyContactPivots?.length > 0) {
                  const companyIds = companyContactPivots.map(item => item.company_id);
                  
                  // Get the actual companies
                  const { data: companies } = await supabase
                    .from('company')
                    .select('id')
                    .in('id', companyIds)
                    .eq('is_deleted', false);
                  
                  contactCompanies = companies || [];
                }
              } catch (error) {
                console.error('[useAdvancedSearch] Error finding companies via contact relationship:', error);
              }
            }
            
            // Combine all company IDs
            const allCompanyIds = [
              ...(matchingCompanies?.map(company => company.id) || []),
              ...(contactCompanies?.map(company => company.id) || [])
            ];
            
            // Remove duplicate company IDs
            const uniqueCompanyIds = [...new Set(allCompanyIds)];
            
            // STEP 6: Get all media associated with these companies
            let companyMedia = [];
            if (uniqueCompanyIds.length > 0) {
              try {
                // Get media directly associated with companies
                const { data: media } = await supabase
                  .from('media')
                  .select('*')
                  .in('company_id', uniqueCompanyIds)
                  .eq('is_deleted', false);
                
                companyMedia = media || [];
                console.log(`[useAdvancedSearch] Found ${companyMedia.length} media associated with matching companies`);
              } catch (error) {
                console.error('[useAdvancedSearch] Error finding media via company relationship:', error);
              }
            }
            
            // STEP 7: Get all projects associated with these companies
            let companyProjects = [];
            if (uniqueCompanyIds.length > 0) {
              try {
                const { data: projects } = await supabase
                  .from('project')
                  .select('id')
                  .in('company_id', uniqueCompanyIds)
                  .eq('is_deleted', false);
                
                companyProjects = projects || [];
              } catch (error) {
                console.error('[useAdvancedSearch] Error finding projects via company relationship:', error);
              }
            }
            
            // STEP 8: Get all media associated with these projects
            let projectMedia = [];
            if (companyProjects.length > 0) {
              try {
                const projectIds = companyProjects.map(project => project.id);
                
                // Get media associated with projects through the media_project pivot table
                const { data: mediaPivots } = await supabase
                  .from('media_project')
                  .select('media_id')
                  .in('project_id', projectIds);
                
                if (mediaPivots?.length > 0) {
                  const mediaIds = mediaPivots.map(pivot => pivot.media_id);
                  
                  const { data: media } = await supabase
                    .from('media')
                    .select('*')
                    .in('id', mediaIds)
                    .eq('is_deleted', false);
                  
                  projectMedia = media || [];
                  console.log(`[useAdvancedSearch] Found ${projectMedia.length} media associated with projects of matching companies`);
                }
              } catch (error) {
                console.error('[useAdvancedSearch] Error finding media via project relationship:', error);
              }
            }
            
            // STEP 9: Combine all media results and remove duplicates
            const allMedia = [
              ...(directMediaResults || []),
              ...(contactMedia || []),
              ...(companyMedia || []),
              ...(projectMedia || [])
            ];
            
            // Remove duplicates by creating a map keyed by media ID
            const uniqueMedia = {};
            allMedia.forEach(media => {
              if (media && media.id) {
                uniqueMedia[media.id] = media;
              }
            });
            
            const uniqueMediaArray = Object.values(uniqueMedia);
            console.log(`[useAdvancedSearch] Total unique media found for "${searchText}": ${uniqueMediaArray.length}`);
            
            // Replace the media results with our comprehensive results
            newResults.media = uniqueMediaArray;
            newCounts.media = uniqueMediaArray.length;
          } catch (error) {
            console.error('[useAdvancedSearch] Error in comprehensive media search:', error);
            // Keep the original results if the comprehensive search fails
          }
        }
      }
      
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