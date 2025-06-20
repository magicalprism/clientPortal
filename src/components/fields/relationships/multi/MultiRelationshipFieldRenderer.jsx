'use client';

// DEBUG VERSION - With extensive logging to track infinite loop
// IMPORTANT: Infinite loops with this component are often caused by duplicate value combinations 
// in the pivot/junction table. If you experience infinite loops, check for duplicate entries
// in the junction table (e.g., duplicate task_id + resource_id combinations).

import { useEffect, useState, useRef } from 'react';
import { Typography } from '@mui/material';
import { MultiRelationshipField } from '@/components/fields/relationships/multi/MultiRelationshipField';
import { RelatedTagsField } from '@/components/fields/relationships/multi/RelatedTagsField';
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
  
  // Debounce reference for onChange
  const debounceTimerRef = useRef(null);

  // Initialize and update when value changes
  useEffect(() => {
    const normalized = normalizeMultiRelationshipValue(value);
    
    // Only log on first initialization
    if (currentValue.length === 0 && originalValue.length === 0) {
      console.log(`[MultiRelationshipFieldRenderer] ${field.name} initializing:`, {
        raw: value,
        normalized
      });
      setOriginalValue(normalized);
    }
    
    // Always update currentValue when value prop changes
    setCurrentValue(normalized);
  }, [field.name, value]);

  // Read-only display
  if (!editable) {
    if (!Array.isArray(details) || details.length === 0) {
      return <Typography variant="body2">—</Typography>;
    }

    // Use RelatedTagsField for clickable tags in read-only mode
    if (field.relation?.table) {
      return (
        <RelatedTagsField
          field={field}
          parentId={record?.id}
          hideLabel={true}
          relatedItems={details}
        />
      );
    }

    // Fallback to plain text if no table is defined
    const labels = details
      .filter(item => item)
      .map((item) => item[labelField] || `ID: ${item.id}`);

    return (
      <Typography variant="body2">
        {labels.join(', ')}
      </Typography>
    );
  }

  // Handle change with explicit save button activation and debouncing
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

    // Check if value has actually changed from current value
    // Convert to sets for comparison since order doesn't matter
    const currentSet = new Set(currentValue);
    const newSet = new Set(selectedIds);
    
    // Skip update if values are the same (prevents infinite loop)
    if (currentSet.size === newSet.size && 
        [...currentSet].every(id => newSet.has(id))) {
      console.log(`[MultiRelationshipFieldRenderer] ${field.name} no change detected, skipping update`);
      return;
    }
    
    // Update local state immediately for UI responsiveness
    setCurrentValue(selectedIds);
    
    // Check if value has changed from original value
    const originalSet = new Set(originalValue);
    
    // If lengths differ or any item is not in the original set, changes detected
    const hasChanges = 
      originalSet.size !== newSet.size || 
      selectedIds.some(id => !originalSet.has(id));
    
    console.log(`[MultiRelationshipFieldRenderer] ${field.name} changed:`, {
      originalValue,
      currentValue,
      newValue: selectedIds,
      hasChanges
    });

    // Clear any existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Debounce the update operations to prevent infinite loops
    debounceTimerRef.current = setTimeout(() => {
      // 1. Call onChange with complete object
      if (typeof onChange === 'function') {
        onChange({
          ids: selectedIds,
          details: selectedDetails
        });
      }
      
      // 2. If collectionSave is available, call setHasChanges directly
      if (hasChanges && collectionSave && typeof collectionSave.setHasChanges === 'function') {
        collectionSave.setHasChanges(true);
      }
      
      // 3. If changes detected, dispatch event (but only if really needed)
      if (hasChanges && record && config && typeof window !== 'undefined') {
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
      
      // Clear the timer reference
      debounceTimerRef.current = null;
    }, 300); // 300ms debounce
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