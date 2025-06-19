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
      
      // Handle email collection specifically for many-to-many relationships
      if (collectionName === 'email') {
        // Use basic fields for email to avoid join errors with direct relationships
        return '*';
      }
      
      // For other problematic collections, use a simpler approach
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
            
            // Special handling for many-to-many relationships
            if (collectionName === 'email' && field.name === 'contacts') {
              // For email-contact many-to-many, use the junction table
              fields.push(`contacts:contact_email(contact:contact_id(id, title))`);
            } else {
              // Use simpler relationship queries to avoid errors
              fields.push(`${field.name}_details:${relationTable}(id, ${labelField})`);
            }
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
   * Only includes fields that actually exist in the collection
   */
  const getSearchableFields = useCallback((config) => {
    if (!config?.fields) return ['title'];
    
    try {
      // Get all field names that exist in the collection
      const existingFieldNames = config.fields.map(field => field.name);
      
      // First, get all text-type fields that exist in the collection
      const textFields = config.fields
        .filter(field => {
          return (
            ['text', 'richText', 'email'].includes(field.type) || 
            (!field.type && ['title', 'name', 'description', 'content', 'email'].includes(field.name))
          );
        })
        .map(field => field.name);
      
      // Always include important fields ONLY if they exist in the collection
      const importantFields = ['title', 'description', 'content'];
      importantFields.forEach(fieldName => {
        if (!textFields.includes(fieldName) && existingFieldNames.includes(fieldName)) {
          textFields.push(fieldName);
        }
      });
      
      // If no text fields found, use 'title' if it exists, otherwise use the first field
      if (textFields.length === 0) {
        if (existingFieldNames.includes('title')) {
          return ['title'];
        } else if (existingFieldNames.length > 0) {
          return [existingFieldNames[0]];
        } else {
          return [];
        }
      }
      
      return textFields;
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
            // First, check which fields actually exist in the collection
            const existingFields = searchableFields.filter(field => 
              config.fields?.some(f => f.name === field)
            );
            
            if (existingFields.length > 0) {
              // Apply each existing field as an individual .or() condition
              // This prevents 400 Bad Request errors while still modifying the query
              existingFields.forEach(field => {
                try {
                  // Add an individual .or() condition for this field
                  modifiedQuery = modifiedQuery.or(`${field}.ilike.%${searchText.trim()}%`);
                } catch (fieldErr) {
                  console.warn(`[useAdvancedSearch] Error adding .or() condition for ${collectionName}.${field}:`, fieldErr);
                }
              });
            } else {
              // If no existing fields found, try with 'title' as a fallback
              try {
                modifiedQuery = modifiedQuery.or(`title.ilike.%${searchText.trim()}%`);
              } catch (fallbackErr) {
                console.warn(`[useAdvancedSearch] Fallback search on title failed:`, fallbackErr);
              }
            }
            
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
                // Search for media where the author (contact) contains the search text
                modifiedQuery = modifiedQuery.or(`author_details.first_name.ilike.%${searchText.trim()}%,author_details.last_name.ilike.%${searchText.trim()}%`);
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
        // Always apply is_client=true filter to company collection if not explicitly set
        if (collectionName === 'company' && appliedFilters.is_client === undefined) {
          modifiedQuery = modifiedQuery.eq('is_client', true);
        }
        
        // First, apply direct filters to the collection
        Object.entries(appliedFilters).forEach(([fieldName, value]) => {
          if (value === null || value === undefined || value === '' || value === 'all') {
            return;
          }

          try {
            // Check if this is a relationship field
            const field = config.fields?.find(f => f.name === fieldName);
            const isRelationship = field?.type === 'relationship';
            
            if (isRelationship) {
              // Handle relationship fields differently based on collection type
              if (collectionName === 'project' && fieldName === 'company_id') {
                // For projects, filter by company_id
                if (Array.isArray(value)) {
                  if (value.length > 0) {
                    modifiedQuery = modifiedQuery.in('company_id', value);
                  }
                } else {
                  modifiedQuery = modifiedQuery.eq('company_id', value);
                }
              }
              else if (collectionName === 'project' && fieldName === 'author_id') {
                // For projects, filter by author_id
                if (Array.isArray(value)) {
                  if (value.length > 0) {
                    modifiedQuery = modifiedQuery.in('author_id', value);
                  }
                } else {
                  modifiedQuery = modifiedQuery.eq('author_id', value);
                }
              }
              else if (collectionName === 'media' && fieldName === 'author_id') {
                // For media, filter by author_id
                if (Array.isArray(value)) {
                  if (value.length > 0) {
                    modifiedQuery = modifiedQuery.in('author_id', value);
                  }
                } else {
                  modifiedQuery = modifiedQuery.eq('author_id', value);
                }
              }
              else if (collectionName === 'media' && fieldName === 'company_id') {
                // For media, filter by company_id
                if (Array.isArray(value)) {
                  if (value.length > 0) {
                    modifiedQuery = modifiedQuery.in('company_id', value);
                  }
                } else {
                  modifiedQuery = modifiedQuery.eq('company_id', value);
                }
              }
              else if ((collectionName === 'contact' || collectionName === 'company') && fieldName.includes('_id')) {
                // For contacts and companies, handle relationship fields
                if (Array.isArray(value)) {
                  if (value.length > 0) {
                    modifiedQuery = modifiedQuery.in(fieldName, value);
                  }
                } else {
                  modifiedQuery = modifiedQuery.eq(fieldName, value);
                }
              }
              else {
                // For other relationship fields, apply standard filter
                if (Array.isArray(value)) {
                  if (value.length > 0) {
                    modifiedQuery = modifiedQuery.in(fieldName, value);
                  }
                } else {
                  modifiedQuery = modifiedQuery.eq(fieldName, value);
                }
              }
            } else {
              // Handle non-relationship fields
              if (Array.isArray(value)) {
                if (value.length > 0) {
                  modifiedQuery = modifiedQuery.in(fieldName, value);
                }
              } else {
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
            // Additional logic could be added here to filter related entities
          } catch (err) {
            console.warn('[useAdvancedSearch] Cross-collection filter for project status failed:', err);
          }
        }
        
        // If filtering by company, consider all related entities
        if (appliedFilters.company_id) {
          try {
            // Additional logic could be added here to filter related entities
          } catch (err) {
            console.warn('[useAdvancedSearch] Cross-collection filter for company_id failed:', err);
          }
        }
        
        // If filtering by contact, consider all related entities
        if (appliedFilters.contact_id || appliedFilters.author_id) {
          try {
            // Additional logic could be added here to filter related entities
          } catch (err) {
            console.warn('[useAdvancedSearch] Cross-collection filter for contact failed:', err);
          }
        }
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
        // If there's no search text, sort alphabetically by title
        // Otherwise, sort by updated_at for relevance
        let sortField, sortOrder;
        
        if (!searchText || searchText.trim() === '') {
          // Always use 'title' for alphabetical sorting, or fall back to 'id'
          // Note: 'name' field is never used in any tables
          try {
            // Check if the collection has a title field
            const { error } = await supabase.from(collectionName).select('title').limit(1);
            
            // If no error, use title field, otherwise fall back to id
            sortField = error ? 'id' : 'title';
          } catch (err) {
            // If any error occurs, fall back to id
            console.warn(`[useAdvancedSearch] Error checking title field for ${collectionName}:`, err);
            sortField = 'id';
          }
          
          sortOrder = 'asc'; // Alphabetical order (A-Z)
        } else {
          // When searching, sort by relevance (most recently updated first)
          sortField = options.sortField || 'updated_at';
          sortOrder = options.sortOrder || 'desc';
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

      try {
        // Use filters as they are, without applying them across collections
        
        // Standard search for all collections with their specific filters
        const searchPromises = targetCollections.map(async (collectionName) => {
          // Only use filters specifically set for this collection
          const collectionFilters = allFilters[collectionName] || {};
          
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
          
          // STEP 1: Get all projects that directly match the search text
          // Use individual queries instead of .or() to avoid 400 Bad Request
          let directProjectResults = [];
          
          // Search by title
          try {
            const { data: titleResults } = await supabase
              .from('project')
              .select('*')
              .ilike('title', `%${searchText.trim()}%`)
              .eq('is_deleted', false);
            
            if (titleResults && titleResults.length > 0) {
              directProjectResults = [...titleResults];
            }
          } catch (titleErr) {
            console.warn('[useAdvancedSearch] Error searching project title:', titleErr);
          }
          
          // Search by description
          try {
            const { data: descResults } = await supabase
              .from('project')
              .select('*')
              .ilike('description', `%${searchText.trim()}%`)
              .eq('is_deleted', false);
            
            if (descResults && descResults.length > 0) {
              // Add results that aren't already in the array
              descResults.forEach(item => {
                if (!directProjectResults.some(existing => existing.id === item.id)) {
                  directProjectResults.push(item);
                }
              });
            }
          } catch (descErr) {
            console.warn('[useAdvancedSearch] Error searching project description:', descErr);
          }
          
          // Search by site_name
          try {
            const { data: siteNameResults } = await supabase
              .from('project')
              .select('*')
              .ilike('site_name', `%${searchText.trim()}%`)
              .eq('is_deleted', false);
            
            if (siteNameResults && siteNameResults.length > 0) {
              // Add results that aren't already in the array
              siteNameResults.forEach(item => {
                if (!directProjectResults.some(existing => existing.id === item.id)) {
                  directProjectResults.push(item);
                }
              });
            }
          } catch (siteNameErr) {
            console.warn('[useAdvancedSearch] Error searching project site_name:', siteNameErr);
          }
          
          // Search by site_tagline
          try {
            const { data: taglineResults } = await supabase
              .from('project')
              .select('*')
              .ilike('site_tagline', `%${searchText.trim()}%`)
              .eq('is_deleted', false);
            
            if (taglineResults && taglineResults.length > 0) {
              // Add results that aren't already in the array
              taglineResults.forEach(item => {
                if (!directProjectResults.some(existing => existing.id === item.id)) {
                  directProjectResults.push(item);
                }
              });
            }
          } catch (taglineErr) {
            console.warn('[useAdvancedSearch] Error searching project site_tagline:', taglineErr);
          }
          
          
          // STEP 2: Get all contacts that match the search text
          // Use individual queries instead of .or() to avoid 400 Bad Request
          let matchingContacts = [];
          
          // Search by first_name
          try {
            const { data: firstNameResults } = await supabase
              .from('contact')
              .select('id, first_name, last_name, email')
              .ilike('first_name', `%${searchText.trim()}%`)
              .eq('is_deleted', false);
            
            if (firstNameResults && firstNameResults.length > 0) {
              matchingContacts = [...firstNameResults];
            }
          } catch (firstNameErr) {
            console.warn('[useAdvancedSearch] Error searching contact first_name:', firstNameErr);
          }
          
          // Search by last_name
          try {
            const { data: lastNameResults } = await supabase
              .from('contact')
              .select('id, first_name, last_name, email')
              .ilike('last_name', `%${searchText.trim()}%`)
              .eq('is_deleted', false);
            
            if (lastNameResults && lastNameResults.length > 0) {
              // Add results that aren't already in the array
              lastNameResults.forEach(item => {
                if (!matchingContacts.some(existing => existing.id === item.id)) {
                  matchingContacts.push(item);
                }
              });
            }
          } catch (lastNameErr) {
            console.warn('[useAdvancedSearch] Error searching contact last_name:', lastNameErr);
          }
          
          // Search by email
          try {
            const { data: emailResults } = await supabase
              .from('contact')
              .select('id, first_name, last_name, email')
              .ilike('email', `%${searchText.trim()}%`)
              .eq('is_deleted', false);
            
            if (emailResults && emailResults.length > 0) {
              // Add results that aren't already in the array
              emailResults.forEach(item => {
                if (!matchingContacts.some(existing => existing.id === item.id)) {
                  matchingContacts.push(item);
                }
              });
            }
          } catch (emailErr) {
            console.warn('[useAdvancedSearch] Error searching contact email:', emailErr);
          }
          
          
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
            
            // STEP 1: Get all companies that directly match the search text
            // Use individual queries instead of .or() to avoid 400 Bad Request
            let directCompanyResults = [];
            
            // Search by title
            try {
              const { data: titleResults } = await supabase
                .from('company')
                .select('*')
                .ilike('title', `%${searchText.trim()}%`)
                .eq('is_deleted', false);
              
              if (titleResults && titleResults.length > 0) {
                directCompanyResults = [...titleResults];
              }
            } catch (titleErr) {
              console.warn('[useAdvancedSearch] Error searching company title:', titleErr);
            }
            
            // Check if description field exists in company collection before searching
            const companyConfig = collections['company'];
            const companyFields = companyConfig?.fields?.map(field => field.name) || [];
            
            if (companyFields.includes('description')) {
              // Only search description if it exists in the collection
              try {
                const { data: descResults } = await supabase
                  .from('company')
                  .select('*')
                  .ilike('description', `%${searchText.trim()}%`)
                  .eq('is_deleted', false);
                
                if (descResults && descResults.length > 0) {
                  // Add results that aren't already in the array
                  descResults.forEach(item => {
                    if (!directCompanyResults.some(existing => existing.id === item.id)) {
                      directCompanyResults.push(item);
                    }
                  });
                }
              } catch (descErr) {
                console.warn('[useAdvancedSearch] Error searching company description:', descErr);
              }
            }
            
            
            // STEP 2: Get all contacts that match the search text
            // Use individual queries instead of .or() to avoid 400 Bad Request
            let matchingContacts = [];
            
            // Search by first_name
            try {
              const { data: firstNameResults } = await supabase
                .from('contact')
                .select('id, first_name, last_name, email')
                .ilike('first_name', `%${searchText.trim()}%`)
                .eq('is_deleted', false);
              
              if (firstNameResults && firstNameResults.length > 0) {
                matchingContacts = [...firstNameResults];
              }
            } catch (firstNameErr) {
              console.warn('[useAdvancedSearch] Error searching contact first_name:', firstNameErr);
            }
            
            // Search by last_name
            try {
              const { data: lastNameResults } = await supabase
                .from('contact')
                .select('id, first_name, last_name, email')
                .ilike('last_name', `%${searchText.trim()}%`)
                .eq('is_deleted', false);
              
              if (lastNameResults && lastNameResults.length > 0) {
                // Add results that aren't already in the array
                lastNameResults.forEach(item => {
                  if (!matchingContacts.some(existing => existing.id === item.id)) {
                    matchingContacts.push(item);
                  }
                });
              }
            } catch (lastNameErr) {
              console.warn('[useAdvancedSearch] Error searching contact last_name:', lastNameErr);
            }
            
            // Search by email
            try {
              const { data: emailResults } = await supabase
                .from('contact')
                .select('id, first_name, last_name, email')
                .ilike('email', `%${searchText.trim()}%`)
                .eq('is_deleted', false);
              
              if (emailResults && emailResults.length > 0) {
                // Add results that aren't already in the array
                emailResults.forEach(item => {
                  if (!matchingContacts.some(existing => existing.id === item.id)) {
                    matchingContacts.push(item);
                  }
                });
              }
            } catch (emailErr) {
              console.warn('[useAdvancedSearch] Error searching contact email:', emailErr);
            }
            
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
            
            // Replace the company results with our comprehensive results
            newResults.company = uniqueCompaniesArray;
            newCounts.company = uniqueCompaniesArray.length;
          } catch (error) {
            console.error('[useAdvancedSearch] Error in comprehensive company search:', error);
            // Keep the original results if the comprehensive search fails
          }
        }
        
        // Special case for email
        if (targetCollections.includes('email')) {
          try {
            
            // STEP 1: Get all emails that directly match the search text
            // Use individual queries instead of .or() to avoid 400 Bad Request
            let directEmailResults = [];
            
            // Search by title
            try {
              const { data: titleResults } = await supabase
                .from('email')
                .select('*')
                .ilike('title', `%${searchText.trim()}%`)
                .eq('is_deleted', false);
              
              if (titleResults && titleResults.length > 0) {
                directEmailResults = [...titleResults];
              }
            } catch (titleErr) {
              console.warn('[useAdvancedSearch] Error searching email title:', titleErr);
            }
            
            // Search by summary
            try {
              const { data: summaryResults } = await supabase
                .from('email')
                .select('*')
                .ilike('summary', `%${searchText.trim()}%`)
                .eq('is_deleted', false);
              
              if (summaryResults && summaryResults.length > 0) {
                // Add results that aren't already in the array
                summaryResults.forEach(item => {
                  if (!directEmailResults.some(existing => existing.id === item.id)) {
                    directEmailResults.push(item);
                  }
                });
              }
            } catch (summaryErr) {
              console.warn('[useAdvancedSearch] Error searching email summary:', summaryErr);
            }
            
            // Search by url
            try {
              const { data: urlResults } = await supabase
                .from('email')
                .select('*')
                .ilike('url', `%${searchText.trim()}%`)
                .eq('is_deleted', false);
              
              if (urlResults && urlResults.length > 0) {
                // Add results that aren't already in the array
                urlResults.forEach(item => {
                  if (!directEmailResults.some(existing => existing.id === item.id)) {
                    directEmailResults.push(item);
                  }
                });
              }
            } catch (urlErr) {
              console.warn('[useAdvancedSearch] Error searching email url:', urlErr);
            }
            
            
            // STEP 2: Get all contacts that match the search text
            // Use individual queries instead of .or() to avoid 400 Bad Request
            let matchingContacts = [];
            
            // Search by first_name
            try {
              const { data: firstNameResults } = await supabase
                .from('contact')
                .select('id, first_name, last_name, email')
                .ilike('first_name', `%${searchText.trim()}%`)
                .eq('is_deleted', false);
              
              if (firstNameResults && firstNameResults.length > 0) {
                matchingContacts = [...firstNameResults];
              }
            } catch (firstNameErr) {
              console.warn('[useAdvancedSearch] Error searching contact first_name:', firstNameErr);
            }
            
            // Search by last_name
            try {
              const { data: lastNameResults } = await supabase
                .from('contact')
                .select('id, first_name, last_name, email')
                .ilike('last_name', `%${searchText.trim()}%`)
                .eq('is_deleted', false);
              
              if (lastNameResults && lastNameResults.length > 0) {
                // Add results that aren't already in the array
                lastNameResults.forEach(item => {
                  if (!matchingContacts.some(existing => existing.id === item.id)) {
                    matchingContacts.push(item);
                  }
                });
              }
            } catch (lastNameErr) {
              console.warn('[useAdvancedSearch] Error searching contact last_name:', lastNameErr);
            }
            
            // Search by email
            try {
              const { data: emailResults } = await supabase
                .from('contact')
                .select('id, first_name, last_name, email')
                .ilike('email', `%${searchText.trim()}%`)
                .eq('is_deleted', false);
              
              if (emailResults && emailResults.length > 0) {
                // Add results that aren't already in the array
                emailResults.forEach(item => {
                  if (!matchingContacts.some(existing => existing.id === item.id)) {
                    matchingContacts.push(item);
                  }
                });
              }
            } catch (emailErr) {
              console.warn('[useAdvancedSearch] Error searching contact email:', emailErr);
            }
            
            // STEP 3: Get all emails associated with these contacts through the pivot table
            let contactEmails = [];
            if (matchingContacts?.length > 0) {
              try {
                const contactIds = matchingContacts.map(contact => contact.id);
                
                // First get the email IDs from the contact_email pivot table
                const { data: contactEmailPivots } = await supabase
                  .from('contact_email')
                  .select('email_id')
                  .in('contact_id', contactIds);
                
                if (contactEmailPivots?.length > 0) {
                  const emailIds = contactEmailPivots.map(item => item.email_id);
                  
                  // Then get the actual emails
                  const { data: emails } = await supabase
                    .from('email')
                    .select('*')
                    .in('id', emailIds)
                    .eq('is_deleted', false);
                  
                  contactEmails = emails || [];
                }
              } catch (error) {
                console.error('[useAdvancedSearch] Error finding emails via contact relationship:', error);
              }
            }
            
            // STEP 4: Get all emails authored by these contacts
            let authoredEmails = [];
            if (matchingContacts?.length > 0) {
              try {
                const contactIds = matchingContacts.map(contact => contact.id);
                
                const { data: emails } = await supabase
                  .from('email')
                  .select('*')
                  .in('author_id', contactIds)
                  .eq('is_deleted', false);
                
                authoredEmails = emails || [];
              } catch (error) {
                console.error('[useAdvancedSearch] Error finding emails via author relationship:', error);
              }
            }
            
            // STEP 5: Get all companies that match the search text
            const { data: matchingCompanies } = await supabase
              .from('company')
              .select('id')
              .ilike('title', `%${searchText.trim()}%`)
              .eq('is_deleted', false);
            
            // STEP 6: Get all emails associated with these companies
            let companyEmails = [];
            if (matchingCompanies?.length > 0) {
              try {
                const companyIds = matchingCompanies.map(company => company.id);
                
                // Get emails directly associated with companies
                const { data: emails } = await supabase
                  .from('email')
                  .select('*')
                  .in('company_id', companyIds)
                  .eq('is_deleted', false);
                
                companyEmails = emails || [];
              } catch (error) {
                console.error('[useAdvancedSearch] Error finding emails via company relationship:', error);
              }
            }
            
            // STEP 7: Get all projects that match the search text
            const { data: matchingProjects } = await supabase
              .from('project')
              .select('id')
              .ilike('title', `%${searchText.trim()}%`)
              .eq('is_deleted', false);
            
            // STEP 8: Get all emails associated with these projects through the pivot table
            let projectEmails = [];
            if (matchingProjects?.length > 0) {
              try {
                const projectIds = matchingProjects.map(project => project.id);
                
                // First get the email IDs from the email_project pivot table
                const { data: emailProjectPivots } = await supabase
                  .from('email_project')
                  .select('email_id')
                  .in('project_id', projectIds);
                
                if (emailProjectPivots?.length > 0) {
                  const emailIds = emailProjectPivots.map(item => item.email_id);
                  
                  // Then get the actual emails
                  const { data: emails } = await supabase
                    .from('email')
                    .select('*')
                    .in('id', emailIds)
                    .eq('is_deleted', false);
                  
                  projectEmails = emails || [];
                }
              } catch (error) {
                console.error('[useAdvancedSearch] Error finding emails via project relationship:', error);
              }
            }
            
            // STEP 9: Combine all email results and remove duplicates
            const allEmails = [
              ...(directEmailResults || []),
              ...(contactEmails || []),
              ...(authoredEmails || []),
              ...(companyEmails || []),
              ...(projectEmails || [])
            ];
            
            // Remove duplicates by creating a map keyed by email ID
            const uniqueEmails = {};
            allEmails.forEach(email => {
              if (email && email.id) {
                uniqueEmails[email.id] = email;
              }
            });
            
            const uniqueEmailsArray = Object.values(uniqueEmails);
            
            // Replace the email results with our comprehensive results
            newResults.email = uniqueEmailsArray;
            newCounts.email = uniqueEmailsArray.length;
          } catch (error) {
            console.error('[useAdvancedSearch] Error in comprehensive email search:', error);
            // Keep the original results if the comprehensive search fails
          }
        }
        
        // Special case for contact
        if (targetCollections.includes('contact')) {
          try {
            // STEP 1: Get all contacts that directly match the search text
            // Use individual queries instead of .or() to avoid 400 Bad Request
            let directContactResults = [];
            
            // Search by first_name
            try {
              const { data: firstNameResults } = await supabase
                .from('contact')
                .select('*')
                .ilike('first_name', `%${searchText.trim()}%`)
                .eq('is_deleted', false);
              
              if (firstNameResults && firstNameResults.length > 0) {
                directContactResults = [...firstNameResults];
              }
            } catch (firstNameErr) {
              console.warn('[useAdvancedSearch] Error searching contact first_name:', firstNameErr);
            }
            
            // Search by last_name
            try {
              const { data: lastNameResults } = await supabase
                .from('contact')
                .select('*')
                .ilike('last_name', `%${searchText.trim()}%`)
                .eq('is_deleted', false);
              
              if (lastNameResults && lastNameResults.length > 0) {
                // Add results that aren't already in the array
                lastNameResults.forEach(item => {
                  if (!directContactResults.some(existing => existing.id === item.id)) {
                    directContactResults.push(item);
                  }
                });
              }
            } catch (lastNameErr) {
              console.warn('[useAdvancedSearch] Error searching contact last_name:', lastNameErr);
            }
            
            // Search by email
            try {
              const { data: emailResults } = await supabase
                .from('contact')
                .select('*')
                .ilike('email', `%${searchText.trim()}%`)
                .eq('is_deleted', false);
              
              if (emailResults && emailResults.length > 0) {
                // Add results that aren't already in the array
                emailResults.forEach(item => {
                  if (!directContactResults.some(existing => existing.id === item.id)) {
                    directContactResults.push(item);
                  }
                });
              }
            } catch (emailErr) {
              console.warn('[useAdvancedSearch] Error searching contact email:', emailErr);
            }
            
            // STEP 2: Get all companies that match the search text
            const { data: matchingCompanies } = await supabase
              .from('company')
              .select('id')
              .ilike('title', `%${searchText.trim()}%`)
              .eq('is_deleted', false);
            
            // STEP 3: Get all contacts associated with these companies through the pivot table
            let companyContacts = [];
            if (matchingCompanies?.length > 0) {
              try {
                const companyIds = matchingCompanies.map(company => company.id);
                
                // First get the contact IDs from the company_contact pivot table
                const { data: companyContactPivots } = await supabase
                  .from('company_contact')
                  .select('contact_id')
                  .in('company_id', companyIds);
                
                if (companyContactPivots?.length > 0) {
                  const contactIds = companyContactPivots.map(item => item.contact_id);
                  
                  // Then get the actual contacts
                  const { data: contacts } = await supabase
                    .from('contact')
                    .select('*')
                    .in('id', contactIds)
                    .eq('is_deleted', false);
                  
                  companyContacts = contacts || [];
                }
              } catch (error) {
                console.error('[useAdvancedSearch] Error finding contacts via company relationship:', error);
              }
            }
            
            // STEP 4: Combine all contact results and remove duplicates
            const allContacts = [
              ...(directContactResults || []),
              ...(companyContacts || [])
            ];
            
            // Remove duplicates by creating a map keyed by contact ID
            const uniqueContacts = {};
            allContacts.forEach(contact => {
              if (contact && contact.id) {
                uniqueContacts[contact.id] = contact;
              }
            });
            
            const uniqueContactsArray = Object.values(uniqueContacts);
            
            // Replace the contact results with our comprehensive results
            newResults.contact = uniqueContactsArray;
            newCounts.contact = uniqueContactsArray.length;
          } catch (error) {
            console.error('[useAdvancedSearch] Error in comprehensive contact search:', error);
            // Keep the original results if the comprehensive search fails
          }
        }
        
        // Special case for media
        if (targetCollections.includes('media')) {
          try {
            
            // STEP 1: Get all media that directly match the search text
            // Use a more robust approach to handle potential field errors
            let directMediaResults = [];
            try {
              // Try searching by title only first (most reliable field)
              const { data: titleResults, error: titleError } = await supabase
                .from('media')
                .select('*')
                .ilike('title', `%${searchText.trim()}%`)
                .eq('is_deleted', false);
              
              if (!titleError && titleResults) {
                directMediaResults = [...titleResults];
              }
              
              // Try description field separately
              try {
                const { data: descResults, error: descError } = await supabase
                  .from('media')
                  .select('*')
                  .ilike('description', `%${searchText.trim()}%`)
                  .eq('is_deleted', false);
                
                if (!descError && descResults) {
                  // Add results that aren't already in the array
                  descResults.forEach(item => {
                    if (!directMediaResults.some(existing => existing.id === item.id)) {
                      directMediaResults.push(item);
                    }
                  });
                }
              } catch (descErr) {
                console.warn('[useAdvancedSearch] Error searching media description:', descErr);
              }
              
              // Skip alt_text and filename fields as they might be causing the error
              
            } catch (mediaErr) {
              console.error('[useAdvancedSearch] Error in direct media search:', mediaErr);
              directMediaResults = [];
            }
            
            
            // STEP 2: Get all contacts that match the search text
            // Use individual queries instead of .or() to avoid 400 Bad Request
            let matchingContacts = [];
            
            // Search by first_name
            try {
              const { data: firstNameResults } = await supabase
                .from('contact')
                .select('id, first_name, last_name, email')
                .ilike('first_name', `%${searchText.trim()}%`)
                .eq('is_deleted', false);
              
              if (firstNameResults && firstNameResults.length > 0) {
                matchingContacts = [...firstNameResults];
              }
            } catch (firstNameErr) {
              console.warn('[useAdvancedSearch] Error searching contact first_name:', firstNameErr);
            }
            
            // Search by last_name
            try {
              const { data: lastNameResults } = await supabase
                .from('contact')
                .select('id, first_name, last_name, email')
                .ilike('last_name', `%${searchText.trim()}%`)
                .eq('is_deleted', false);
              
              if (lastNameResults && lastNameResults.length > 0) {
                // Add results that aren't already in the array
                lastNameResults.forEach(item => {
                  if (!matchingContacts.some(existing => existing.id === item.id)) {
                    matchingContacts.push(item);
                  }
                });
              }
            } catch (lastNameErr) {
              console.warn('[useAdvancedSearch] Error searching contact last_name:', lastNameErr);
            }
            
            // Search by email
            try {
              const { data: emailResults } = await supabase
                .from('contact')
                .select('id, first_name, last_name, email')
                .ilike('email', `%${searchText.trim()}%`)
                .eq('is_deleted', false);
              
              if (emailResults && emailResults.length > 0) {
                // Add results that aren't already in the array
                emailResults.forEach(item => {
                  if (!matchingContacts.some(existing => existing.id === item.id)) {
                    matchingContacts.push(item);
                  }
                });
              }
            } catch (emailErr) {
              console.warn('[useAdvancedSearch] Error searching contact email:', emailErr);
            }
            
            // STEP 3: Get all media authored by these contacts
            let contactMedia = [];
            if (matchingContacts?.length > 0) {
              try {
                const contactIds = matchingContacts.map(contact => contact.id);
                
                const { data: media } = await supabase
                  .from('media')
                  .select('*')
                  .in('author_id', contactIds)
                  .eq('is_deleted', false);
                
                contactMedia = media || [];
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