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
  const [localSelectedItems, setLocalSelectedItems] = useState([]); // Always initialized as array
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
  const [fetchedOneToManyItems, setFetchedOneToManyItems] = useState([]);

  useEffect(() => {
    if (onChange && isOneToMany && !junctionTable && parentId && targetKey && table) {
      const fetchRelated = async () => {
        const { data, error } = await supabase
          .from(table)
          .select(`id, ${labelField}, parent_id`)
          .eq(targetKey, parentId);

        if (error) {
    
          setFetchedOneToManyItems([]);
        } else {
          setFetchedOneToManyItems(data || []);
        }
      };

      fetchRelated();
    }
  }, [onChange, isOneToMany, junctionTable, parentId, targetKey, table, labelField, supabase]);

  // Add this right after the start of your component
  useEffect(() => {

  }, [field?.name, value]);



  // Resolve dynamic filter
  useEffect(() => {
    const resolveFilter = async () => {
      // Skip if missing required fields
      if (!filterFrom || !filter || !parentId) {

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
        

        setResolvedFilter(result);
      } catch (err) {
   
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

          setAllOptions([]);
        } else {
          // Check if we have a parent_id field for hierarchical display
          const hasParentField = data.some(item => 'parent_id' in item);
          
          if (hasParentField) {
   
            
            // Use our custom sorted tree builder
            const sortedTree = buildSortedTree(data, null);
            const flattenedTree = flattenSortedTree(sortedTree);
            

            
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

      } finally {
        setLoading(false);
      }
    };

    fetchOptions();
  }, [table, labelField, resolvedFilter, supabase]);

  // ✅ FIXED: Initialize from value or related items with proper undefined handling
  useEffect(() => {

    
    if (!allOptions || allOptions.length === 0) {

      return;
    }
    
    let selectedItems = [];
    
    if (onChange && value !== undefined && value !== null) {
      // ✅ Handle different value formats with proper undefined checking
      let targetIds = [];
      
      if (Array.isArray(value)) {
        // Simple array of IDs: [202, 3]
        targetIds = value
          .filter(id => id !== null && id !== undefined)
          .map(id => parseInt(id))
          .filter(id => !isNaN(id));

      } else if (value && typeof value === 'object') {
        if (value.ids && Array.isArray(value.ids)) {
          // Complex object format: {ids: [202], details: [...]}
          targetIds = value.ids
            .filter(id => id !== null && id !== undefined)
            .map(id => parseInt(id))
            .filter(id => !isNaN(id));

        } else {

        }
      }
      
      // Find matching options
      if (targetIds.length > 0) {
        selectedItems = allOptions.filter(opt => 
          targetIds.includes(parseInt(opt.id))
        ).map(item => ({
          ...item,
          id: item.id,
          [labelField]: item[labelField] || item.title || item.name || `ID: ${item.id}`,
          indentedLabel: item.indentedLabel || item[labelField] || item.title || item.name || `ID: ${item.id}`
        }));
        
        
      }
      
    } else if (relatedItems && Array.isArray(relatedItems)) {
      // Read-only mode with provided related items
      selectedItems = relatedItems.map(item => ({
        ...item,
        id: item.id,
        [labelField]: item[labelField] || item.title || item.name || `ID: ${item.id}`,
        indentedLabel: item.indentedLabel || item[labelField] || item.title || item.name || `ID: ${item.id}`
      }));
      
    } else if (fetchedOneToManyItems && Array.isArray(fetchedOneToManyItems)) {
      // One-to-many fallback
      selectedItems = fetchedOneToManyItems.map(item => ({
        ...item,
        id: item.id,
        [labelField]: item[labelField],
        indentedLabel: item[labelField]
      }));

    }
    
    // Always ensure selectedItems is an array
    setLocalSelectedItems(Array.isArray(selectedItems) ? selectedItems : []);

  }, [value, relatedItems, allOptions, labelField, onChange, field?.name, fetchedOneToManyItems]);

  // Handle selection changes with proper error handling
  const handleChange = async (event, selectedItems) => {
    // Ensure selectedItems is always an array - CRITICAL for controlled input
    const safeSelectedItems = Array.isArray(selectedItems) ? selectedItems : [];


    
    // Prepare the selected items for display
    const enrichedItems = safeSelectedItems.map(item => ({
      ...item,
      id: item.id, // Ensure ID is present
      [labelField]: item[labelField] || item.title || item.name || `ID: ${item.id}`,
      indentedLabel: item.indentedLabel || item[labelField] || item.title || item.name || `ID: ${item.id}`
    }));
    
    // Update local UI state - ALWAYS set to array
    setLocalSelectedItems(enrichedItems);
    
    if (onChange) {
      // We're in controlled mode with onChange
      const selectedIds = safeSelectedItems.map(item => item.id).filter(id => id !== null && id !== undefined);
 
      
      // ✅ FIXED: Return simple array format to match MediaEditModal expectations
      onChange(selectedIds);
      
    } else {
      // We're in direct database mode
      const selectedIds = safeSelectedItems.map(item => item.id);
      const currentIds = relatedItems?.map(item => item.id) || [];

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
          options={allOptions || []} // Ensure options is never undefined
          value={localSelectedItems || []} // Ensure value is never undefined
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
              // Ensure input is always controlled
              value={params.inputProps.value || ''}
            />
          )}
          renderTags={(tagValues, getTagProps) =>
            (tagValues || []).map((option, index) => {
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