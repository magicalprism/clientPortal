'use client';

// IMPORTANT: Infinite loops with multirelationship fields are often caused by duplicate value combinations 
// in the pivot/junction table. If you experience infinite loops, check for duplicate entries
// in the junction table (e.g., duplicate task_id + resource_id combinations).

import { useState, useEffect } from 'react';
import {
  FormControl,
  Autocomplete,
  TextField,
  Chip,
  CircularProgress,
  Box,
  Typography,
} from '@mui/material';
import { createClient } from '@/lib/supabase/browser';

/**
 * A simplified MultiRelationship field component to avoid infinite loops
 * This component has minimal state management and no custom events
 */
export const SimpleMultiRelationshipField = ({ 
  field, 
  value = [], 
  onChange,
  record,
  config,
}) => {

  // Initialize state
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedValues, setSelectedValues] = useState([]);
  const [instanceId] = useState(`simple-multi-${Math.random().toString(36).substring(2, 9)}`);

  // Extract field configuration
  const labelField = field?.relation?.labelField || 'title';
  const table = field?.relation?.table;
  const junctionTable = field?.relation?.junctionTable;
  const sourceKey = field?.relation?.sourceKey || `${field?.parentTable || 'parent'}_id`;
  const targetKey = field?.relation?.targetKey || `${table || 'child'}_id`;
  const parentId = field?.parentId || record?.id;

  // Normalize value to always be an array of strings
  const normalizeValue = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) {
      return val.map(v => typeof v === 'object' ? String(v.id) : String(v));
    }
    return [String(val)];
  };

  // Initialize supabase client
  const supabase = createClient();

  // Fetch options on mount
  useEffect(() => {
    const fetchOptions = async () => {
  
      
      if (!table) {

        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Fetch all options from the table
        const { data, error } = await supabase
          .from(table)
          .select(`id, ${labelField}`);
          
        if (error) {

          setLoading(false);
          return;
        }
        

        
        // Sort options alphabetically
        const sortedOptions = [...(data || [])].sort((a, b) => {
          const labelA = a[labelField]?.toLowerCase() || '';
          const labelB = b[labelField]?.toLowerCase() || '';
          return labelA.localeCompare(labelB);
        });
        
        setOptions(sortedOptions);
        setLoading(false);
      } catch (err) {

        setLoading(false);
      }
    };

    fetchOptions();
  }, [field?.name, table, labelField, instanceId]);

  // Initialize selected values from props
  useEffect(() => {
    const normalizedValue = normalizeValue(value);

    setSelectedValues(normalizedValue);
  }, [value, instanceId]);

  // Find selected option objects based on IDs
  const selectedOptionObjects = options.filter(opt => 
    selectedValues.includes(String(opt.id))
  );

  // Handle selection changes
  const handleChange = (_, newSelectedOptions) => {

    
    // Extract IDs from selected options
    const newSelectedIds = (newSelectedOptions || [])
      .filter(opt => opt && opt.id)
      .map(opt => String(opt.id));
    
    // Update internal state
    setSelectedValues(newSelectedIds);
    
    // Call parent onChange with standardized format
    if (onChange) {
      const result = {
        ids: newSelectedIds,
        details: newSelectedOptions
      };
      

      onChange(result);
    }
  };

  // Save to database directly (for testing)
  const saveToDatabase = async () => {
    if (!parentId || !junctionTable) {

      return;
    }
    

    
    try {
      // Get existing relationships
      const { data: existingRels } = await supabase
        .from(junctionTable)
        .select(targetKey)
        .eq(sourceKey, parentId);
        
      const existingIds = (existingRels || []).map(r => String(r[targetKey]));
      
      // Calculate additions and removals
      const toAdd = selectedValues.filter(id => !existingIds.includes(id));
      const toRemove = existingIds.filter(id => !selectedValues.includes(id));
      

      
      // Add new relationships
      if (toAdd.length > 0) {
        const insertData = toAdd.map(id => ({
          [sourceKey]: parentId,
          [targetKey]: id
        }));

        const { error: insertError } = await supabase
          .from(junctionTable)
          .insert(insertData);

        if (insertError) {

        }
      }

      // Remove deselected relationships
      if (toRemove.length > 0) {
        for (const id of toRemove) {
          const { error: deleteError } = await supabase
            .from(junctionTable)
            .delete()
            .match({
              [sourceKey]: parentId,
              [targetKey]: id
            });

          if (deleteError) {

          }
        }
      }
      
 
    } catch (err) {

    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      <FormControl fullWidth size="small">
        <Autocomplete
          multiple
          loading={loading}
          options={options}
          value={selectedOptionObjects}
          onChange={handleChange}
          getOptionLabel={(option) => {
            if (typeof option === 'string') return option;
            if (!option) return '';
            return option[labelField] || `ID: ${option.id}`;
          }}
          isOptionEqualToValue={(option, value) => {
            if (!option || !value) return false;
            return String(option.id) === String(value.id);
          }}
          renderTags={(selected, getTagProps) =>
            (selected || []).map((option, index) => {
              if (!option) return null;
              const { key, ...restChipProps } = getTagProps({ index });
              return (
                <Chip
                  key={`chip-${option.id || index}`}
                  label={option[labelField] || `ID: ${option.id}`}
                  {...restChipProps}
                  size="small"
                />
              );
            })
          }
          renderOption={(props, option) => {
            if (!option) return null;
            return (
              <li {...props} key={`opt-${option.id}`}>
                {option[labelField] || `ID: ${option.id}`}
              </li>
            );
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder={`Search ${field?.label || 'items'}...`}
              size="small"
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loading && <CircularProgress size={16} />}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />
      </FormControl>
      
      {/* Debug info */}
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
        Instance: {instanceId} | Selected: {selectedValues.length} | Options: {options.length}
      </Typography>
    </Box>
  );
};

export default SimpleMultiRelationshipField;