'use client';

import { useMemo, useEffect, useCallback, useState } from 'react';
import {
  FormControl,
  Autocomplete,
  TextField,
  Chip,
  CircularProgress,
  IconButton,
  Box,
  Typography,
  Button,
} from '@mui/material';
import { Plus, ArrowsClockwise, Bug } from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';
import { useMultiRelationOptions } from '@/hooks/filters/listfilters/useMultiRelationOptions';
import { useMultiRelationSync } from '@/hooks/filters/listfilters/useMultiRelationSync';
import { normalizeMultiRelationshipValue } from '@/lib/utils/filters/listfilters/normalizeMultiRelationshipValue';
import * as collections from '@/collections';

/**
 * Enhanced MultiRelationshipField component with better debugging
 * Supports hierarchical display, filtering, and proper synchronization
 */
export const MultiRelationshipField = ({ 
  field, 
  value = [], 
  onChange, 
  record,
  config,

  refreshRecord, 
  debug = false 
}) => {
  const router = useRouter();
  const [internalValue, setInternalValue] = useState([]);
  const [debugInfo, setDebugInfo] = useState({});
  const [showDebug, setShowDebug] = useState(false);
  
  // Enhanced options hook with proper filtering
  const { 
    options, 
    loading, 
    setOptions, 
    refresh: refreshOptions,
    error 
  } = useMultiRelationOptions({ 
    field: {
      ...field,
      parentId: record?.id,
      parentTable: field.parentTable || field.relation?.sourceTable
    },
    record
  });
  
  // Sync hook for database operations
  const { syncMultiRelation } = useMultiRelationSync();

  // Get field configuration
  const labelField = field.relation?.labelField || 'title';
  const parentId = field.parentId || record?.id;
  const hasCreateAccess = !!field.relation?.linkTo;

  // Normalize value to handle different formats
  const normalizedValue = useMemo(() => {
    const normalized = normalizeMultiRelationshipValue(value);
    
    // Update debug info
    setDebugInfo(prev => ({
      ...prev,
      normalizedValue: normalized,
      rawValue: value
    }));
    
    return normalized;
  }, [value]);
  
  // Initialize internal value from props
  useEffect(() => {
    setInternalValue(normalizedValue);
    
    // Extended debug info if enabled
    if (debug) {
      console.log(`[MultiRelationshipField] ${field.name} initialized:`, { 
        rawValue: value, 
        normalizedValue,
        options: options.length,
        parentId
      });
    }
  }, [normalizedValue, field.name, options.length, parentId, debug, value]);

  // Get selected option objects based on the normalized value IDs
  const selectedObjects = useMemo(() => {
    const ids = new Set(normalizedValue.map(String));
    
    // First try to find options in the fetched options
    let enriched = options
      .filter(opt => ids.has(String(opt.id)))
      .map(opt => ({
        ...opt,
        indentedLabel: opt.indentedLabel || opt[labelField] || `ID: ${opt.id}`
      }));
    
    // If we're missing any, create placeholder objects
    const foundIds = new Set(enriched.map(obj => String(obj.id)));
    const missingIds = [...ids].filter(id => !foundIds.has(id));
    
    if (missingIds.length > 0) {
      // Check if we have details available
      const details = record?.[`${field.name}_details`] || [];
      const detailsMap = new Map(details.map(d => [String(d.id), d]));
      
      // Create placeholder objects for missing IDs
      const placeholders = missingIds.map(id => {
        const detail = detailsMap.get(id);
        return {
          id,
          [labelField]: detail?.[labelField] || `ID: ${id}`,
          indentedLabel: detail?.[labelField] || `ID: ${id}`
        };
      });
      
      enriched = [...enriched, ...placeholders];
    }
    
    // Update debug info
    setDebugInfo(prev => ({
      ...prev,
      selectedObjects: enriched.map(o => ({ id: o.id, label: o[labelField] })),
      selectedCount: enriched.length
    }));
    
    return enriched;
  }, [options, normalizedValue, labelField, field.name, record]);

  // Handle selection changes
  const handleChange = useCallback(async (_, selectedOptionObjects) => {
    if (!selectedOptionObjects) return;
    
    // Extract IDs from the selected options
    const selectedIds = selectedOptionObjects
      .map(opt => String(opt.id))
      .filter(Boolean);
    
    // Create details array for UI updates
    const selectedDetails = selectedOptionObjects.map(opt => ({
      id: opt.id,
      [labelField]: opt[labelField] || opt.indentedLabel || 'Untitled',
      indentedLabel: opt.indentedLabel || opt[labelField] || `ID: ${opt.id}`
    }));
    
    // Log change info
    console.log(`[MultiRelationshipField] ${field.name} selection changed:`, {
      prevCount: normalizedValue.length,
      newCount: selectedIds.length,
      selectedIds: selectedIds.length > 0 ? selectedIds : '(empty)'
    });
    
    // Update internal state
    setInternalValue(selectedIds);
    
    // Update debug info
    setDebugInfo(prev => ({
      ...prev,
      lastChange: {
        timestamp: new Date().toISOString(),
        newIds: selectedIds,
        newIdsCount: selectedIds.length,
        newDetails: selectedDetails.length
      }
    }));
    
    // Create a standard response format
    const responseFormat = {
      ids: selectedIds,
      details: selectedDetails
    };
    
    // First update the UI
    if (typeof onChange === 'function') {
      onChange(responseFormat);
    }
    
    // Then sync with the database if we have a parentId
    if (parentId) {
      try {
        const linkedData = await syncMultiRelation({
          field,
          parentId,
          selectedIds,
          options,
          onChange: () => {} // Avoid duplicate callbacks
        });
        
        if (linkedData?.length > 0) {
          const enriched = linkedData
            .filter(item => item && item.id)
            .map(item => ({
              ...item,
              indentedLabel: item.indentedLabel || item[labelField] || `ID: ${item.id}`
            }));

          // Update options with any new data
          setOptions(prev => {
            const map = new Map([...prev, ...enriched].map(item => [item.id, item]));
            return Array.from(map.values());
          });
        }
        
        // Refresh the parent record to ensure sync
        if (refreshRecord && typeof refreshRecord === 'function') {
          refreshRecord();
        }
      } catch (err) {
        console.error(`[MultiRelationshipField] Error syncing ${field.name}:`, err);
      }
    }
  }, [field, parentId, labelField, onChange, options, refreshRecord, syncMultiRelation, normalizedValue]);

  // Handle refreshing the options list
  const handleRefresh = () => {
    refreshOptions();
  };

  // Toggle debug panel
  const toggleDebug = () => {
    setShowDebug(prev => !prev);
  };

  // Add this to your component that edits records
useEffect(() => {
  if (!config) return;
  console.log('Current record state:', record);
  
  // Check multi fields specifically
  const multiFields = config.fields
    .filter(f => f.type === 'multiRelationship')
    .map(f => f.name);
    
  multiFields.forEach(fieldName => {
    console.log(`Field ${fieldName}:`, {
      value: record[fieldName],
      details: record[`${fieldName}_details`]
    });
  });
}, [record]);

console.log('Raw value:', value);
console.log('Normalized:', normalizeMultiRelationshipValue(value));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      <FormControl fullWidth size="small" sx={{ display: 'flex', flexDirection: 'row', gap: 1 }}>
        <Autocomplete
          multiple
          loading={loading}
          options={options}
          value={selectedObjects}
          onChange={handleChange}
          getOptionLabel={(option) => {
            if (typeof option === 'string') return option;
            return option.indentedLabel || option[labelField] || `ID: ${option.id}`;
          }}
          isOptionEqualToValue={(option, value) => String(option.id) === String(value.id)}
          renderTags={(selected, getTagProps) =>
            selected.map((option, index) => {
              const { key, ...restChipProps } = getTagProps({ index });
              return (
                <Chip
                  key={`chip-${option.id}`}
                  label={option.indentedLabel || option[labelField] || `ID: ${option.id}`}
                  {...restChipProps}
                  size="small"
                />
              );
            })
          }
          renderOption={(props, option) => (
            <li {...props} key={`opt-${option.id}`} style={{ 
              paddingLeft: option.depth ? `${(option.depth * 16) + 16}px` : undefined 
            }}>
              {option.indentedLabel || option[labelField] || `ID: ${option.id}`}
            </li>
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder={`Search ${field.label || 'items'}...`}
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
          sx={{ flexGrow: 1, minWidth: 300 }}
        />

        {/* Refresh button */}
        <IconButton
          size="small"
          onClick={handleRefresh}
          title="Refresh options"
        >
          <ArrowsClockwise size={16} />
        </IconButton>

        {/* Create new item button (if allowed) */}
        {hasCreateAccess && (
          <IconButton
            size="small"
            onClick={() => {
              // Create navigation with appropriate context
              const url = new URL(window.location.href);
              url.searchParams.set('modal', 'create');
              url.searchParams.set('refField', field.name);
              if (record?.id) {
                url.searchParams.set('id', record.id);
              }
              router.push(url.toString(), { scroll: false });
            }}
            title={`Create new ${field.label || 'item'}`}
          >
            <Plus size={16} />
          </IconButton>
        )}
        
        {/* Debug button */}
        <IconButton
          size="small"
          onClick={toggleDebug}
          title="Toggle debug info"
          sx={{ 
            color: showDebug ? 'error.main' : 'text.secondary',
            '&:hover': { color: 'error.main' } 
          }}
        >
          <Bug size={16} />
        </IconButton>
      </FormControl>

      {/* Error message */}
      {error && (
        <Box sx={{ color: 'error.main', fontSize: '0.75rem', mt: 1 }}>
          <Typography variant="caption" color="error">
            Error loading options: {error}
          </Typography>
        </Box>
      )}
      
      {/* Debug panel */}
      {showDebug && (
        <Box sx={{ 
          mt: 1, 
          p: 1, 
          border: '1px dashed #f00', 
          borderRadius: 1,
          backgroundColor: '#fff8f8',
          fontSize: '12px',
          width: '100%'
        }}>
          <Typography variant="caption" fontWeight="bold" sx={{ color: 'error.main' }}>
            MultiRelationshipField Debug — {field.name}
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 1 }}>
            <Typography variant="caption">
              <strong>Selected:</strong> {selectedObjects.length} items | 
              <strong>Available:</strong> {options.length} options
            </Typography>
            
            <Typography variant="caption">
              <strong>Value Format:</strong> {Array.isArray(value) ? 'Array' : 
                typeof value === 'object' && value !== null ? (
                  value.ids ? 'Object with IDs/details' : 'Object'
                ) : (
                  typeof value
                )}
            </Typography>
            
            <Typography variant="caption">
              <strong>Raw Value Type:</strong> {debugInfo.rawValue === null ? 'null' : 
                Array.isArray(debugInfo.rawValue) ? `Array[${debugInfo.rawValue?.length || 0}]` : 
                typeof debugInfo.rawValue}
            </Typography>
            
            <Typography variant="caption">
              <strong>IDs (normalized):</strong> {debugInfo.normalizedValue?.join(', ') || '(none)'}
            </Typography>
            
            {debugInfo.lastChange && (
              <Typography variant="caption">
                <strong>Last Change:</strong> {debugInfo.lastChange.timestamp} — 
                Selected {debugInfo.lastChange.newIdsCount} items
              </Typography>
            )}
            
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <Button 
                size="small" 
                variant="outlined" 
                color="error"
                onClick={() => console.log(`[DEBUG] ${field.name} full state:`, { 
                  field, value, record, selectedObjects, options, debugInfo 
                })}
              >
                Log State
              </Button>
              
              <Button 
                size="small" 
                variant="outlined" 
                color="error"
                onClick={() => {
                  // Force selection update
                  if (typeof onChange === 'function') {
                    const selectedIds = selectedObjects.map(opt => String(opt.id));
                    onChange({
                      ids: selectedIds,
                      details: selectedObjects
                    });
                    console.log(`[DEBUG] ${field.name} force update triggered with:`, selectedIds);
                  }
                }}
              >
                Force Update
              </Button>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default MultiRelationshipField;