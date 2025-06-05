'use client';

import { useEffect, useState } from 'react';
import { Typography } from '@mui/material';
import { MultiRelationshipField } from '@/components/fields/relationships/multi/MultiRelationshipField';
// Fix import method
import { normalizeMultiRelationshipValue } from '@/lib/utils/filters/listfilters/normalizeMultiRelationshipValue';

/**
 * Multi-Relationship Field Renderer with improved change detection
 * Specifically designed to ensure save button activation
 */
export const MultiRelationshipFieldRenderer = ({
  value,
  field,
  record,
  config,
  editable = false,
  isEditing = false,
  onChange = () => {},
  // Special prop to access the useCollectionSave hook directly
  collectionSave = null
}) => {
  const labelField = field.relation?.labelField || 'title';
  const details = record?.[`${field.name}_details`] || [];

  // Store both original and current values for comparison
  const [originalValue, setOriginalValue] = useState([]);
  const [currentValue, setCurrentValue] = useState([]);
  const [initialized, setInitialized] = useState(false);

  // Initialize on mount
  useEffect(() => {
    if (!initialized) {
      const normalized = normalizeMultiRelationshipValue(value);
      console.log(`[MultiRelationshipFieldRenderer] ${field.name} initializing:`, {
        raw: value,
        normalized
      });
      
      setOriginalValue(normalized);
      setCurrentValue(normalized);
      setInitialized(true);
    }
  }, [field.name, value, initialized]);

  // Read-only display
  if (!editable) {
    if (!Array.isArray(details) || details.length === 0) {
      return <Typography variant="body2">—</Typography>;
    }

    const labels = details
      .filter(item => item)
      .map((item) => item[labelField] || `ID: ${item.id}`);

    return (
      <Typography variant="body2">
        {labels.join(', ')}
      </Typography>
    );
  }

  // Handle change with explicit save button activation
  const handleChange = (newValue) => {
    let selectedIds;
    let selectedDetails;
    
    // Handle various input formats
    if (typeof newValue === 'object' && newValue !== null && Array.isArray(newValue.ids)) {
      selectedIds = newValue.ids.map(String);
      selectedDetails = newValue.details || [];
    } else {
      selectedIds = normalizeMultiRelationshipValue(newValue);
      
      // Create details from existing or placeholder
      const detailsMap = new Map(details.map(d => [String(d.id), d]));
      selectedDetails = selectedIds.map(id => {
        if (detailsMap.has(String(id))) {
          return detailsMap.get(String(id));
        }
        return { id, [labelField]: `ID: ${id}` };
      });
    }

    // Update local state
    setCurrentValue(selectedIds);
    
    // Check if value has actually changed
    // Convert to sets for comparison since order doesn't matter
    const originalSet = new Set(originalValue);
    const newSet = new Set(selectedIds);
    
    // If lengths differ or any item is not in the original set, changes detected
    const hasChanges = 
      originalSet.size !== newSet.size || 
      selectedIds.some(id => !originalSet.has(id));
    
    console.log(`[MultiRelationshipFieldRenderer] ${field.name} changed:`, {
      originalValue,
      newValue: selectedIds,
      hasChanges
    });

    // CRITICAL: Force setHasChanges in multiple ways to ensure save button activation
    
    // 1. Call onChange with complete object
    if (typeof onChange === 'function') {
      onChange({
        ids: selectedIds,
        details: selectedDetails
      });
    }
    
    // 2. If collectionSave is available, call setHasChanges directly
    if (collectionSave && typeof collectionSave.setHasChanges === 'function') {
      collectionSave.setHasChanges(true);
    }
    
    // 3. If changes detected, update the record directly with both values
    if (hasChanges && record && config) {
      // Update both the field and _details fields
      if (typeof window !== 'undefined') {
        // Trigger a custom event to notify parent components
        const event = new CustomEvent('multiRelationshipChanged', {
          detail: {
            fieldName: field.name,
            value: {
              ids: selectedIds,
              details: selectedDetails
            }
          }
        });
        window.dispatchEvent(event);
      }
    }
  };


  return (
    <MultiRelationshipField
      field={{ ...field, parentId: record?.id, parentTable: config?.name }}
      value={currentValue}
      onChange={handleChange}
      record={record}
    />
  );
};

/**
 * Event listener to force save button activation
 * Add this to your page component
 */
export const useMultiRelationshipChangeDetection = (setHasChanges) => {
  useEffect(() => {
    const handleMultiRelationshipChange = () => {
      if (typeof setHasChanges === 'function') {
        setHasChanges(true);
      }
    };
    
    window.addEventListener('multiRelationshipChanged', handleMultiRelationshipChange);
    
    return () => {
      window.removeEventListener('multiRelationshipChanged', handleMultiRelationshipChange);
    };
  }, [setHasChanges]);
};

export default MultiRelationshipFieldRenderer;

export const MultiRelationshipFieldCase = {
  type: 'multiRelationship',
  Component: MultiRelationshipFieldRenderer
};