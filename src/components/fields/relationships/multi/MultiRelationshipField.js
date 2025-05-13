'use client';

import { useMemo, useEffect } from 'react';
import {
  FormControl,
  Autocomplete,
  TextField,
  Chip,
  CircularProgress,
  IconButton
} from '@mui/material';
import { Plus } from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';

import { useMultiRelationOptions } from './useMultiRelationOptions';
import { useMultiRelationSync } from './useMultiRelationSync';
import normalizeMultiRelationshipValue from '@/lib/utils/normalizeMultiRelationshipValue';

export const MultiRelationshipField = ({ field, value = [], onChange }) => {
  const router = useRouter();
  const { options, loading, setOptions } = useMultiRelationOptions({ field });
  const { syncMultiRelation } = useMultiRelationSync();

  const labelField = field.relation?.labelField || 'title';
  const parentId = field.parentId;

  // Make sure value is normalized to an array of strings using our helper
  const normalizedValue = useMemo(() => {
    return normalizeMultiRelationshipValue(value);
  }, [value]);
  
  // Log initial value for debugging
  useEffect(() => {
    console.log(`[MultiRelationshipField] Field: ${field.name}, Initial value:`, { 
      rawValue: value, 
      normalizedValue 
    });
  }, [field.name, value, normalizedValue]);

  // Get selected option objects based on the normalized value IDs
  const selectedObjects = useMemo(() => {
    // Match normalized value IDs to options 
    const result = normalizedValue
      .map(id => options.find(opt => String(opt.id) === id))
      .filter(Boolean);
      
    return result;
  }, [options, normalizedValue]);

  const handleChange = async (_, selectedOptionObjects) => {
    console.log('[MultiRelationshipField] Change:', { 
      field: field.name, 
      selectedOptionObjects 
    });
    
    // Extract IDs from the selected options
    const selectedIds = selectedOptionObjects.map(opt => String(opt.id)).filter(Boolean);
    
    // Create details array for UI updates
    const selectedDetails = selectedOptionObjects.map(opt => ({
      id: opt.id,
      [labelField]: opt[labelField] || 'Untitled'
    }));
    
    // Create a standard response format
    const responseFormat = {
      ids: selectedIds,
      details: selectedDetails
    };
    
    // First update the UI
    if (typeof onChange === 'function') {
      // Use the standard response format that includes both IDs and details
      onChange(responseFormat);
    }
    
    // Then sync with the database if we have a parentId
    if (parentId) {
      const linkedData = await syncMultiRelation({
        field,
        parentId,
        selectedIds,
        options,
        // Don't call onChange here to avoid duplicates
        onChange: () => {}
      });
      
      if (linkedData) {
        const newOptions = Array.from(
          new Map([...options, ...linkedData].map(item => [item.id, item])).values()
        );
        setOptions(newOptions);
      }
    }
  };

  return (
    <FormControl fullWidth size="small" sx={{ display: 'flex', flexDirection: 'row', gap: 1 }}>
      <Autocomplete
        multiple
        loading={loading}
        options={options}
        value={selectedObjects}
        onChange={handleChange}
        getOptionLabel={(option) =>
          typeof option === 'string' ? option : option[labelField] ? `${option[labelField]} (${option.id})` : `ID: ${option.id}`
        }
        isOptionEqualToValue={(option, value) => {
          return String(option.id) === String(value.id);
        }}
        getOptionKey={(option) => `opt-${option.id}`}
        renderTags={(selected, getTagProps) =>
          selected.map((option, index) => {
            const { key: _, ...restChipProps } = getTagProps({ index });
            return (
              <Chip
                key={`chip-${option.id}`}
                label={option[labelField] ? `${option[labelField]} (${option.id})` : `ID: ${option.id}`}
                {...restChipProps}
              />
            );
          })
        }
        renderOption={(props, option) => (
          <li {...props} key={`opt-${option.id}`}>
            {option.indentedLabel || option[labelField] ? 
              `${option.indentedLabel || option[labelField]} (${option.id})` : 
              `ID: ${option.id}`}
          </li>
        )}
        renderInput={(params) => (
          <TextField
            {...params}
            label={`Select ${field.label}`}
            placeholder="Search..."
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
        sx={{ flexGrow: 1, minWidth: 300 }}
      />

      {!!field.relation?.linkTo && (
        <IconButton
          size="small"
          onClick={() =>
            router.push(`?modal=create&refField=${field.name}`, { scroll: false })
          }
          title={`Create new ${field.label}`}
        >
          <Plus size={16} />
        </IconButton>
      )}
    </FormControl>
  );
};