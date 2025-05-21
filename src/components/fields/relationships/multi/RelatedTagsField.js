'use client';

import { useEffect, useState } from 'react';
import { Box, Typography, Chip, CircularProgress, Autocomplete, TextField } from '@mui/material';
import { useRelatedRecords } from '@/hooks/useRelatedRecords';
import { createClient } from '@/lib/supabase/browser';
import { useRouter } from 'next/navigation';
import { fetchResolvedFilter } from '@/lib/utils/filters/listfilters/dynamicFilterUtils';
import { normalizeMultiRelationshipValue } from '@/lib/utils/filters/listfilters/normalizeMultiRelationshipValue';

/**
 * A field for displaying and editing tags (multirelationship) in a more
 * user-friendly format with chips
 */
export const RelatedTagsField = ({ 
  field, 
  parentId, 
  hideLabel = false,
  value,
  onChange
}) => {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [allOptions, setAllOptions] = useState([]);
  const [localSelectedItems, setLocalSelectedItems] = useState([]);
  const [resolvedFilter, setResolvedFilter] = useState({});
  const [filterError, setFilterError] = useState(null);
  
    // Configuration for relationship
  const {
    relation: { 
      table, 
      labelField = 'title', 
      sourceKey, 
      junctionTable, 
      isOneToMany,
      targetKey,
      filterFrom,
      filter,
      relatedItems
    } = {} // Add default empty object to prevent null/undefined errors
  } = field || {};
  // Fetch related records if we're in read-only mode (no onChange)
  const [fetchedOneToManyItems, setFetchedOneToManyItems] = useState(null);

useEffect(() => {
  if (onChange && isOneToMany && !junctionTable && parentId && targetKey && table) {
    const fetchRelated = async () => {
      const { data, error } = await supabase
        .from(table)
        .select(`id, ${labelField}, parent_id`)
        .eq(targetKey, parentId);

      if (error) {
        console.error('[RelatedTagsField] Error fetching one-to-many data:', error);
      } else {
        setFetchedOneToManyItems(data);
      }
    };

    fetchRelated();
  }
}, [onChange, isOneToMany, junctionTable, parentId, targetKey, table, labelField, supabase]);

  


  // Add this right after the start of your component
  useEffect(() => {
    console.log(`[RelatedTagsField] ${field?.name} initialized with:`, {
      valueType: typeof value,
      valueIsArray: Array.isArray(value),
      valueIsObject: typeof value === 'object' && value !== null && !Array.isArray(value),
      hasIds: value?.ids ? value.ids.length : 'no ids',
      hasDetails: value?.details ? value.details.length : 'no details',
      rawValue: value
    });
  }, [field?.name, value]);

  console.log('[RelatedTagsField] parentId:', parentId);

  // Resolve dynamic filter
  useEffect(() => {
    const resolveFilter = async () => {
      // Skip if missing required fields
      if (!filterFrom || !filter || !parentId) {
        console.log('[RelatedTagsField] Skipping filter resolution - missing required fields');
        return;
      }
      
      try {
        setFilterError(null);
        
        const result = await fetchResolvedFilter({
          supabase,
          field: {
            ...field,
            parentId
          },
          parentId
        });
        
        console.log('[RelatedTagsField] Resolved filter:', result);
        setResolvedFilter(result);
      } catch (err) {
        console.error('[RelatedTagsField] Error resolving filter:', err);
        setFilterError(err.message || 'Error resolving filter');
      }
    };
    
    resolveFilter();
  }, [filterFrom, filter, parentId, field, supabase]);

  // Custom function to build a sorted tree
  const buildSortedTree = (items, parentId = null) => {
    // Find all items with the given parentId
    const children = items
      .filter(item => item.parent_id === parentId)
      // Sort children alphabetically by labelField
      .sort((a, b) => (a[labelField] || '').localeCompare(b[labelField] || ''));
    
    // For each child, recursively build its own subtree
    return children.map(child => ({
      ...child,
      children: buildSortedTree(items, child.id)
    }));
  };

  // Custom function to flatten a tree with proper indentation
  const flattenSortedTree = (tree, depth = 0) => {
    return tree.reduce((acc, node) => {
      // Add current node with its depth
      const indentedLabel = depth > 0 
        ? `${'—'.repeat(depth)} ${node[labelField] || ''}`.trim() 
        : node[labelField] || '';
      
      acc.push({
        ...node, 
        indentedLabel,
        depth // Store depth for rendering
      });
      
      // Recursively add children
      if (node.children && node.children.length) {
        acc.push(...flattenSortedTree(node.children, depth + 1));
      }
      
      return acc;
    }, []);
  };

  // Fetch all tag options with filtering
  useEffect(() => {
    const fetchOptions = async () => {
      if (!table) {
        console.log('[RelatedTagsField] No table specified, skipping options fetch');
        setLoading(false);
        return;
      }
      
      setLoading(true);
      
      try {
        let query = supabase.from(table).select(`id, ${labelField}, parent_id`);

        // Apply resolved filter to query
        if (resolvedFilter && Object.keys(resolvedFilter).length > 0) {
          for (const [key, val] of Object.entries(resolvedFilter)) {
            if (val === null || val === undefined || val === '') continue;
            
            if (Array.isArray(val)) {
              query = query.in(key, val);
            } else if (typeof val === 'string' && val.includes('%')) {
              query = query.ilike(key, val);
            } else {
              query = query.eq(key, val);
            }
          }
        }

        const { data, error } = await query;

        if (error) {
          console.error('[RelatedTagsField] Failed to load options:', error);
          setAllOptions([]);
        } else {
          // Check if we have a parent_id field for hierarchical display
          const hasParentField = data.some(item => 'parent_id' in item);
          
          if (hasParentField) {
            console.log('[RelatedTagsField] Using hierarchical display for options');
            
            // Use our custom sorted tree builder
            const sortedTree = buildSortedTree(data, null);
            const flattenedTree = flattenSortedTree(sortedTree);
            
            console.log('[RelatedTagsField] Built hierarchical options:', {
              rawCount: data.length,
              rootCount: sortedTree.length,
              flattenedCount: flattenedTree.length
            });
            
            setAllOptions(flattenedTree);
          } else {
            // Simple flat list sorted alphabetically
            const sortedOptions = [...data]
              .sort((a, b) => (a[labelField] || '').localeCompare(b[labelField] || ''))
              .map(opt => ({
                ...opt,
                indentedLabel: opt[labelField] || `ID: ${opt.id}`
              }));
              
            setAllOptions(sortedOptions);
          }
        }
      } catch (err) {
        console.error('[RelatedTagsField] Error fetching options:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOptions();
  }, [table, labelField, resolvedFilter, supabase]);

  // Initialize from value or related items
  useEffect(() => {
    console.log(`[RelatedTagsField] Initializing ${field?.name} with value:`, value);
    
    if (onChange && value && (value.ids?.length > 0 || value.details?.length > 0)) {
      // Extract IDs from value
     const normalizedIds = normalizeMultiRelationshipValue(value);
    let details = [];

    if (value && typeof value === 'object' && Array.isArray(value.details)) {
      details = value.details;
    } else if (value && typeof value === 'object' && value.ids && !Array.isArray(value)) {
      details = allOptions.filter(opt => 
        normalizedIds.includes(String(opt.id))
      );
    } else if (Array.isArray(value)) {
      details = allOptions.filter(opt => 
        normalizedIds.includes(String(opt.id))
      );
    }

    const selectedItems = details.map(item => ({
      ...item,
      id: item.id,
      [labelField]: item[labelField] || item.title || item.name || `ID: ${item.id}`,
      indentedLabel: item.indentedLabel || item[labelField]
    }));

    setLocalSelectedItems(selectedItems);

  } else if (relatedItems) {
    // ... read-only logic
    const selectedItems = relatedItems.map(item => ({
      ...item,
      id: item.id,
      [labelField]: item[labelField] || item.title || item.name || `ID: ${item.id}`,
      indentedLabel: item.indentedLabel || item[labelField]
    }));

    setLocalSelectedItems(selectedItems);

  } else if (fetchedOneToManyItems) {
    // ✅ Your new one-to-many fallback
    const selectedItems = fetchedOneToManyItems.map(item => ({
      ...item,
      id: item.id,
      [labelField]: item[labelField],
      indentedLabel: item[labelField]
    }));
    console.log('[RelatedTagsField] One-to-many fallback selected items:', selectedItems);
    setLocalSelectedItems(selectedItems);
  }

}, [value, relatedItems, allOptions, labelField, onChange, field?.name, fetchedOneToManyItems]);

  // Handle selection changes
  const handleChange = async (event, selectedItems) => {
    if (!Array.isArray(selectedItems)) {
      console.log('[RelatedTagsField] Invalid selectedItems, not an array');
      return;
    }

    console.log(`[RelatedTagsField] ${field.name} handleChange triggered`, {
      selectedItemsCount: selectedItems.length,
      originalItemsCount: localSelectedItems.length,
      onChange: typeof onChange === 'function' ? 'defined' : 'undefined'
    });
    
    // Prepare the selected items for display
    const enrichedItems = selectedItems.map(item => ({
      ...item,
      id: item.id, // Ensure ID is present
      [labelField]: item[labelField] || item.title || item.name || `ID: ${item.id}`,
      indentedLabel: item.indentedLabel || item[labelField] || item.title || item.name || `ID: ${item.id}`
    }));
    
    // Update local UI state
    setLocalSelectedItems(enrichedItems);
    
    if (onChange) {
      // We're in controlled mode with onChange
      // FIXED: Define selectedIds here BEFORE using it
      const selectedIds = selectedItems.map(item => item.id);
      
      // Create a consistent response format
      const responseValue = {
        ids: selectedIds,
        details: enrichedItems
      };
      
      console.log(`[RelatedTagsField] ${field.name} calling onChange with:`, {
        idsCount: selectedIds.length,
        detailsCount: enrichedItems.length
      });
      
      // Call parent onChange with the full structure
      onChange(responseValue);
    } else {
      // We're in direct database mode
      const selectedIds = selectedItems.map(item => item.id);
      const currentIds = relatedItems.map(item => item.id);

      const toAdd = selectedIds.filter(id => !currentIds.includes(id));
      const toRemove = currentIds.filter(id => !selectedIds.includes(id));

      // Add new tags
      if (toAdd.length && junctionTable) {
        const insertData = toAdd.map(id => ({
          [sourceKey]: parentId,
          [targetKey]: id
        }));
        
        const { error } = await supabase.from(junctionTable).insert(insertData);
        
        if (error) {
          console.error('[RelatedTagsField] Error adding relationships:', error);
        }
      }

      // Remove deselected tags
      if (toRemove.length && junctionTable) {
        for (const id of toRemove) {
          const { error } = await supabase
            .from(junctionTable)
            .delete()
            .match({ [sourceKey]: parentId, [targetKey]: id });
            
          if (error) {
            console.error('[RelatedTagsField] Error removing relationship:', error);
          }
        }
      }
    }
  };

  // Handle tag click for navigation
  const handleTagClick = (e, tagId) => {
    // Avoid navigation when clicking delete icon
    if (e.target.tagName === 'svg' || 
        e.target.tagName === 'path' || 
        e.target.classList.contains('MuiChip-deleteIcon') ||
        e.target.classList.contains('MuiSvgIcon-root')) {
      return;
    }
    
    // Navigate to tag detail
    router.push(`/dashboard/${table}/${tagId}`);
  };

  return (
    <Box>
      {!hideLabel && (
        <Typography variant="subtitle2" gutterBottom>
          {field.label}
        </Typography>
      )}

      {filterError && (
        <Typography variant="caption" color="error" sx={{ display: 'block', mb: 1 }}>
          Filter error: {filterError}
        </Typography>
      )}

      {loading ? (
        <CircularProgress size={20} />
      ) : (
        <Autocomplete
          multiple
          size="small"
          options={allOptions}
          value={localSelectedItems}
          getOptionLabel={option =>
            option.indentedLabel || option[labelField] || `ID: ${option.id}`
          }
          isOptionEqualToValue={(option, value) => String(option.id) === String(value.id)}
          onChange={handleChange}
          renderOption={(props, option) => (
            <li 
              {...props} 
              key={`option-${option.id}`}
              style={{ 
                paddingLeft: option.depth ? `${(option.depth * 16) + 16}px` : undefined 
              }}
            >
              {option.indentedLabel || option[labelField] || `ID: ${option.id}`}
            </li>
          )}
          renderInput={params => (
            <TextField 
              {...params} 
              variant="outlined" 
              size="small" 
              placeholder={`Add ${field.label || 'tags'}`} 
            />
          )}
          renderTags={(tagValues, getTagProps) =>
            tagValues.map((option, index) => {
              const { key, ...tagPropsWithoutKey } = getTagProps({ index });
              
              return (
                <Chip
                  key={key}
                  label={option.indentedLabel || option[labelField]}
                  {...tagPropsWithoutKey}
                  onClick={(e) => handleTagClick(e, option.id)}
                  sx={{
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'primary.light',
                      color: 'primary.contrastText',
                      borderColor: 'primary.main'
                    },
                    '& .MuiChip-label': {
                      cursor: 'pointer',
                    },
                    '&:hover .MuiChip-deleteIcon': {
                      color: 'primary.contrastText',
                    }
                  }}
                />
              );
            })
          }
        />
      )}
    </Box>
  );
};

export default RelatedTagsField;