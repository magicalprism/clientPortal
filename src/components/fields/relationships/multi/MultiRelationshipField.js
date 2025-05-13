'use client';

import { useMemo } from 'react';
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

export const MultiRelationshipField = ({ field, value = [], onChange }) => {
  const router = useRouter();
  const { options, loading, setOptions } = useMultiRelationOptions({ field });
  const { syncMultiRelation } = useMultiRelationSync();

  const labelField = field.relation?.labelField || 'title';
  const parentId = field.parentId;

  // Make sure value is an array of strings
  const normalizedValue = useMemo(() => {
    if (!value) return [];
    if (Array.isArray(value)) return value.map(String);
    if (value.ids && Array.isArray(value.ids)) return value.ids.map(String);
    return [];
  }, [value]);

  const selectedObjects = useMemo(
    () => normalizedValue.map(id => options.find(opt => String(opt.id) === id)).filter(Boolean),
    [options, normalizedValue]
  );

  const handleChange = async (_, selectedOptionObjects) => {
    console.log('MultiRelationshipField change:', { field, selectedOptionObjects });
    
    // Extract IDs from the selected options
    const selectedIds = selectedOptionObjects.map(opt => opt.id);
    
    // Create details array for UI updates
    const selectedDetails = selectedOptionObjects.map(opt => ({
      id: opt.id,
      [labelField]: opt[labelField] || 'Untitled'
    }));
    
    // Create a standard response format
    const responseFormat = {
      ids: selectedIds.map(String),
      details: selectedDetails
    };
    
    // First update the UI
    if (typeof onChange === 'function') {
      // Try different formats to be compatible with different parent components
      onChange(responseFormat);
      
      // Some components might expect field name and value
      if (field && field.name) {
        // Don't call these if they're going to cause errors
        try {
          onChange(field.name, responseFormat);
        } catch (e) {
          console.log('Error calling onChange with field name:', e);
        }
        
        try {
          // Also try with just the array of IDs
          onChange(selectedIds);
        } catch (e) {
          console.log('Error calling onChange with selectedIds:', e);
        }
      }
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
          typeof option === 'string' ? option : `${option[labelField]} (${option.id})`
        }
        isOptionEqualToValue={(option, value) => String(option.id) === String(value.id)}
        getOptionKey={(option) => option.id}
        renderTags={(selected, getTagProps) =>
          selected.map((option, index) => {
            const { key: _, ...restChipProps } = getTagProps({ index });
            return (
              <Chip
                key={`chip-${option.id}`}
                label={`${option[labelField] || 'Untitled'} (${option.id})`}
                {...restChipProps}
              />
            );
          })
        }
        renderOption={(props, option) => (
          <li {...props} key={`opt-${option.id}`}>
            {`${option.indentedLabel || option[labelField]} (${option.id})`}
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