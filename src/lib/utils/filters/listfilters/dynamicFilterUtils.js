'use client';

/**
 * Core utilities for handling dynamic filters in relationship fields
 */

/**
 * Resolves template variables in filter definitions
 * Replaces {{record.field}} patterns with actual values from the record
 * 
 * @param {Object} filter - Filter object with keys and templates
 * @param {Object} record - Record object containing values to inject
 * @returns {Object} - Filter with resolved values
 */
export function resolveDynamicFilter(filter = {}, record = {}) {
  if (!filter || typeof filter !== 'object') return {};
  if (!record || typeof record !== 'object') return filter;

  const resolved = {};

  for (const [key, val] of Object.entries(filter)) {
    if (typeof val === 'string') {
      // Replace template variables {{record.fieldName}}
      const actualValue = val.replace(/{{[\s]*record\.([\w]+)[\s]*}}/g, (_, fieldName) => {
        const fieldValue = record?.[fieldName];
        return fieldValue ?? '';
      });
      resolved[key] = actualValue;
    } else {
      resolved[key] = val;
    }
  }

  return resolved;
}

/**
 * Fetches and resolves a filter based on a related record
 * Used for filtering options in relationship fields based on parent context
 * 
 * @param {Object} params - Parameters
 * @param {Object} params.supabase - Supabase client
 * @param {Object} params.field - Field configuration
 * @param {string|number} params.parentId - ID of the parent record
 * @returns {Promise<Object>} - Resolved filter object
 */
export async function fetchResolvedFilter({ supabase, field, parentId }) {
  if (!supabase) {
    console.error('[fetchResolvedFilter] Missing supabase client');
    return {};
  }

  if (!field?.relation) {
    console.error('[fetchResolvedFilter] Missing field relation config');
    return {};
  }

  // Early validation
  if (!parentId) {
    console.warn('[fetchResolvedFilter] Missing parentId - filtering will fail');
    return {};
  }

  const {
    filterFrom, 
    filter: rawFilter,
    filterReferenceKey,
    junctionTable,
    targetKey,
    sourceKey
  } = field.relation;

  if (!filterFrom || !rawFilter) {
    console.warn('[fetchResolvedFilter] Missing filterFrom or filter definition');
    return {};
  }

  // Debug info
  console.log('[fetchResolvedFilter] Processing filter:', {
    filterFrom,
    parentId,
    rawFilter
  });

  // Determine if we need to lookup through a junction table
  // This happens when filtering needs data from a different entity than the parent
  let lookupId = parentId;
  const shouldUseJunction = 
    filterReferenceKey && 
    junctionTable && 
    sourceKey && 
    targetKey && 
    field.parentTable !== filterFrom;

  // If we need to go through a junction table to get to the reference entity
  if (shouldUseJunction) {
    try {
      const { data: junctionRows, error } = await supabase
        .from(junctionTable)
        .select(targetKey)
        .eq(sourceKey, parentId);

      if (error) {
        console.error('[fetchResolvedFilter] Junction table query failed:', error);
        return {};
      }

      if (!junctionRows || junctionRows.length === 0) {
        console.warn('[fetchResolvedFilter] No junction rows found for parent', parentId);
        return {};
      }
      
      // Use the first matching related ID from the junction table
      lookupId = junctionRows[0]?.[targetKey];
      
      if (!lookupId) {
        console.warn('[fetchResolvedFilter] No valid target ID found in junction');
        return {};
      }
    } catch (err) {
      console.error('[fetchResolvedFilter] Error querying junction table:', err);
      return {};
    }
  }

  // Now fetch the referenced entity for context
  try {
    const { data, error } = await supabase
      .from(filterFrom)
      .select('*')
      .eq('id', lookupId)
      .maybeSingle();

    if (error) {
      console.error('[fetchResolvedFilter] Failed to fetch from', filterFrom, error);
      return {};
    }

    if (!data) {
      console.warn('[fetchResolvedFilter] No data found in', filterFrom, 'with id', lookupId);
      return {};
    }

    console.log('[fetchResolvedFilter] Record data being used for filtering:', {
      filterFrom,
      recordData: data,
      recordCompanyId: data?.company_id,
      rawFilter
    });

    // Resolve the dynamic filter with the fetched context
    const resolved = resolveDynamicFilter(rawFilter, data);
    const hasUnresolved = Object.values(resolved).some(val =>
      typeof val === 'string' && val.includes('{{')
    );

    if (hasUnresolved) {
      console.warn('[fetchResolvedFilter] Unresolved placeholders in filter:', resolved);
      return {};
    }

    console.log('[fetchResolvedFilter] Successfully resolved filter:', resolved);
    return resolved;
  } catch (err) {
    console.error('[fetchResolvedFilter] Unexpected error:', err);
    return {};
  }
}

/**
 * Applies a dynamic filter to a value object
 * Used to check if an item should be included based on filter criteria
 * 
 * @param {Object} item - The item to check against the filter
 * @param {Object} record - The context record with values for filter templates
 * @param {Object} filter - The filter definition with templates
 * @returns {boolean} - Whether the item passes the filter
 */
export function itemPassesFilter(item, record, filter) {
  if (!filter || !item) return true;
  if (!record) return false;
  
  const resolvedFilter = resolveDynamicFilter(filter, record);
  
  // Check if item passes all filter conditions
  for (const [key, expectedValue] of Object.entries(resolvedFilter)) {
    const itemValue = item[key];
    
    if (itemValue === undefined) {
      return false; // Item doesn't have the required field
    }
    
    // Handle different types of comparisons
    if (Array.isArray(expectedValue)) {
      // Check if itemValue is in the array
      if (!expectedValue.includes(itemValue)) {
        return false;
      }
    } else if (typeof expectedValue === 'string' && expectedValue.includes('%')) {
      // Handle LIKE/ILIKE queries (basic implementation)
      const regex = new RegExp(
        expectedValue.replace(/%/g, '.*'),
        'i'
      );
      if (!regex.test(String(itemValue))) {
        return false;
      }
    } else {
      // Direct equality comparison
      if (String(itemValue) !== String(expectedValue)) {
        return false;
      }
    }
  }
  
  return true;
}

/**
 * Utility to build a hierarchical tree from flat items with parent_id
 * Used for creating indented option displays in MultiRelationship fields
 * 
 * @param {Array} items - Flat array of items with id and parent_id
 * @returns {Array} - Array of root items with nested children
 */
export function buildTree(items) {
  if (!Array.isArray(items)) return [];
  
  const map = new Map();
  const roots = [];
  
  // First pass: create nodes and map
  items.forEach(item => {
    if (!item || !item.id) return;
    map.set(item.id, { ...item, children: [] });
  });
  
  // Second pass: build the tree
  map.forEach(item => {
    if (item.parent_id && map.has(item.parent_id)) {
      // This is a child node, add to parent
      map.get(item.parent_id).children.push(item);
    } else {
      // This is a root node
      roots.push(item);
    }
  });
  
  return roots;
}

/**
 * Flattens a hierarchical tree into an array with indentation indicators
 * Used for creating visually indented options in dropdowns
 * 
 * @param {Array} nodes - Hierarchical tree nodes
 * @param {number} depth - Current indentation depth
 * @param {string} labelField - Field name to use for display
 * @returns {Array} - Flat array with indentation information
 */
export function flattenTreeWithIndent(nodes, depth = 0, labelField = 'title') {
  if (!Array.isArray(nodes)) return [];
  
  // Sort nodes by label for consistent display
  const sortedNodes = [...nodes].sort((a, b) => {
    const aLabel = a[labelField] || '';
    const bLabel = b[labelField] || '';
    return aLabel.localeCompare(bLabel);
  });
  
  return sortedNodes.flatMap(node => {
    const label = node[labelField]?.trim() || `ID: ${node.id}` || 'Untitled';
    const indent = '—'.repeat(depth);
    const indentedLabel = depth > 0 ? `${indent} ${label}` : label;
    
    const formatted = { 
      ...node, 
      indentedLabel,
      depth // Include depth info for styling
    };
    
    const children = flattenTreeWithIndent(
      node.children || [], 
      depth + 1,
      labelField
    );
    
    return [formatted, ...children];
  });
}