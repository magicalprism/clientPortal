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
  
  // Fetch related records if we're in read-only mode (no onChange)
  const relatedItems = !onChange ? useRelatedRecords({ parentId, field }) : null;
  
  // Configuration for relationship
  const {
    relation: { 
      table, 
      labelField = 'title', 
      sourceKey, 
      junctionTable, 
      targetKey,
      filterFrom,
      filter
    } = {} // Add default empty object to prevent null/undefined errors
  } = field || {};

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
            // Build a hierarchical tree
            const map = new Map();
            const roots = [];
            
            // Create nodes
            data.forEach(item => map.set(item.id, { ...item, children: [] }));
            
            // Build the tree
            map.forEach(item => {
              if (item.parent_id && map.has(item.parent_id)) {
                map.get(item.parent_id).children.push(item);
              } else {
                roots.push(item);
              }
            });
            
            // Flatten with indentation
            const flatten = (nodes, depth = 0) => {
              return nodes.flatMap(node => {
                const prefix = '—'.repeat(depth);
                const formatted = { 
                  ...node, 
                  indentedLabel: depth > 0 ? `${prefix} ${node[labelField] || ''}`.trim() : node[labelField] || ''
                };
                return [formatted, ...flatten(node.children || [], depth + 1)];
              });
            };
            
            const flattened = flatten(roots);
            setAllOptions(flattened);
          } else {
            // Simple flat list
            setAllOptions(
              (data || []).map(opt => ({
                ...opt,
                indentedLabel: opt[labelField] || `ID: ${opt.id}`
              }))
            );
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
    if (onChange && value) {
      // Extract IDs from value
      const ids = normalizeMultiRelationshipValue(value);
      
      // Extract details if available
      let details = [];
      
      if (value && typeof value === 'object' && Array.isArray(value.details)) {
        details = value.details;
      } else if (Array.isArray(value)) {
        // Try to match with allOptions
        details = allOptions.filter(opt => 
          ids.includes(String(opt.id))
        );
      }
      
      // Create local selected items for display
      setLocalSelectedItems(
        details.map(item => ({
          ...item,
          indentedLabel: item.indentedLabel || item[labelField] || `ID: ${item.id}`
        }))
      );
    } else if (relatedItems) {
      // We're in read-only mode, use the fetched related items
      setLocalSelectedItems(
        relatedItems.map(item => ({
          ...item,
          indentedLabel: item.indentedLabel || item[labelField] || `ID: ${item.id}`
        }))
      );
    }
  }, [value, relatedItems, allOptions, labelField, onChange]);

  // Handle selection changes
  const handleChange = async (event, selectedItems) => {
    if (!parentId || !Array.isArray(selectedItems)) return;

    // Prepare the selected items for display
    const enrichedItems = selectedItems.map(item => ({
      ...item,
      indentedLabel: item.indentedLabel || item[labelField] || `ID: ${item.id}`
    }));
    
    // Update local UI state
    setLocalSelectedItems(enrichedItems);
    
    if (onChange) {
      // We're in controlled mode with onChange
      const selectedIds = selectedItems.map(item => item.id);
      
      onChange({
        ids: selectedIds,
        details: enrichedItems
      });
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
          options={allOptions.sort((a, b) =>
            (a.indentedLabel || '').localeCompare(b.indentedLabel || '')
          )}
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