'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { MultiRelationshipField } from '@/components/fields/relationships/multi/MultiRelationshipField';
// Fix: Import as named export instead of default
import { normalizeMultiRelationshipValue } from '@/lib/utils/filters/listfilters/normalizeMultiRelationshipValue';
import { useModalMultiRelationships } from '@/lib/utils/multirelationshipUtils';

/**
 * Enhanced Modal MultiRelationship Field Component
 * 
 * This component is specifically designed to handle multirelationship fields in modal contexts,
 * ensuring that existing tags are preserved when adding new ones and changes are properly tracked.
 */
export const ModalMultiRelationshipField = ({ 
  field, 
  record, 
  setRecord, 
  hideLabel = false,
  config,
  onChange // Add onChange prop to propagate changes up
}) => {
  // State to keep track of selected values
  const [selectedIds, setSelectedIds] = useState([]);
  const [initialized, setInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastChangedTimestamp, setLastChangedTimestamp] = useState(null);
  
  // Use the custom hook for multirelationship handling
  const { updateMultiRelationship } = useModalMultiRelationships({
    config,
    record,
    setRecord
  });
  
  // On mount and when record changes, initialize with existing values
  useEffect(() => {
    if (!record || !field || !field.name) return;
    
    // Normalize the value from the record using our utility
    const normalizedIds = normalizeMultiRelationshipValue(record[field.name]);
    const hasExistingDetails = Array.isArray(record[`${field.name}_details`]) && 
      record[`${field.name}_details`].length > 0;
    
    console.log(`[ModalMultiRelationshipField] ${field.name} initializing:`, {
      value: record[field.name],
      normalizedIds,
      hasExistingDetails
    });

    // Set the selected IDs
    setSelectedIds(normalizedIds);
    
    // Ensure the record has the normalized ids and details
    if (setRecord && !initialized) {
      setIsLoading(true);
      
      setRecord(prev => {
        const updatedRecord = { ...prev };
        
        // Set the normalized ids
        updatedRecord[field.name] = normalizedIds;
        
        // Preserve existing details if available
        if (hasExistingDetails) {
          updatedRecord[`${field.name}_details`] = record[`${field.name}_details`];
        }
        
        return updatedRecord;
      });
      
      setInitialized(true);
      setIsLoading(false);
    }
  }, [field, record, initialized, setRecord]);
  
  // When selections change
  const handleChange = (value) => {
    // Track change timestamp for debugging
    setLastChangedTimestamp(new Date().toISOString());
    
    // Handle different formats of value
    let newIds = [];
    let newDetails = [];
    
    if (Array.isArray(value)) {
      // It's just an array of IDs
      newIds = value.map(String).filter(Boolean);
    } else if (value && value.ids) {
      // It's the { ids, details } format
      newIds = value.ids.map(String).filter(Boolean);
      newDetails = value.details || [];
    } else if (value && typeof value === 'object') {
      // It might be a direct object reference
      newIds = Object.keys(value).map(String).filter(Boolean);
    }
    
    console.log(`[ModalMultiRelationshipField] ${field.name} changed:`, {
      newIds,
      detailsCount: newDetails.length,
      previousIds: selectedIds
    });
    
    // Update our local state
    setSelectedIds(newIds);
    
    // Instead of directly updating the record, use the specialized update function
    updateMultiRelationship(field.name, {
      ids: newIds,
      details: newDetails
    });

    // Enrich details with label field for display
    const enrichedDetails = newDetails.map(opt => ({
      id: opt.id,
      [field.relation.labelField]: opt[field.relation.labelField] || 'Untitled',
      indentedLabel: opt.indentedLabel || opt[field.relation.labelField] || `ID: ${opt.id}`
    }));
    
    // Call the parent onChange handler if provided
    // This is CRITICAL for change detection in modal forms
    if (typeof onChange === 'function') {
      onChange(field.name, {
        ids: newIds,
        details: enrichedDetails
      });
      
      // Also explicitly set hasChanges if that property exists in onChange
      if (onChange.setHasChanges) {
        onChange.setHasChanges(true);
      }
    }
  };
  
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 2 }}>
        <CircularProgress size={16} />
        <Typography variant="body2">Loading tags...</Typography>
      </Box>
    );
  }
  
  return (
    <Box sx={{ mt: 2, mb: 2 }}>
     {!hideLabel && (
      <>
        {field.label && (
          <Typography variant="subtitle2" fontWeight={500} mb={1}>
            {field.label}
          </Typography>
        )}
        {field.description && (
          <Typography variant="caption" color="text.secondary" display="block" mb={1}>
            {field.description}
          </Typography>
        )}
      </>
     )}
      
      <MultiRelationshipField
        field={{
          ...field,
          parentId: record?.id, // Important for database sync
          parentTable: config?.name // Important for junction table
        }}
        value={selectedIds} // Use our controlled state
        onChange={handleChange}
      />
      
      {/* Debug info - hidden in production */}
      {process.env.NODE_ENV === 'development' && (
        <Box sx={{ 
          mt: 1, 
          p: 1, 
          border: '1px dashed #ccc', 
          borderRadius: 1,
          backgroundColor: '#f9f9f9',
          fontSize: '10px'
        }}>
          <Typography variant="caption" fontWeight="bold">
            Selected Tags: {selectedIds.length}
          </Typography>
          <div style={{ 
            whiteSpace: 'nowrap', 
            overflow: 'hidden', 
            textOverflow: 'ellipsis',
            fontFamily: 'monospace',
            fontSize: '9px'
          }}>
            {selectedIds.join(', ') || '(none)'}
          </div>
          {lastChangedTimestamp && (
            <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
              Last changed: {lastChangedTimestamp}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};