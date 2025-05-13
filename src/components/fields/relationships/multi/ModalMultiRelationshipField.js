'use client';

import { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { MultiRelationshipField } from '@/components/fields/relationships/multi/MultiRelationshipField';

/**
 * Enhanced Modal MultiRelationship Field Component
 * 
 * This component is specifically designed to handle multirelationship fields in modal contexts,
 * ensuring that existing tags are preserved when adding new ones.
 */
export const ModalMultiRelationshipField = ({ 
  field, 
  record, 
  setRecord, 
  config 
}) => {
  // State to keep track of selected values
  const [selectedIds, setSelectedIds] = useState([]);
  const [initialized, setInitialized] = useState(false);
  
  // On mount and when record changes, initialize with existing values
  useEffect(() => {
    if (!record || !field || !field.name) return;
    
    // Extract existing tag IDs from the record
    let existingIds = [];
    
    // Handle different possible formats of tag data
    if (Array.isArray(record[field.name])) {
      existingIds = record[field.name].map(String);
    } else if (record[field.name]?.ids) {
      existingIds = record[field.name].ids.map(String);
    } else if (record[`${field.name}_details`]) {
      // If we have details but not IDs, extract from details
      existingIds = record[`${field.name}_details`]
        .map(item => String(item.id))
        .filter(Boolean);
    }
    
    console.log(`[ModalMultiRelationshipField] Initializing ${field.name} with IDs:`, existingIds);
    setSelectedIds(existingIds);
    
    // Also ensure the record has these IDs set
    if (existingIds.length > 0 && setRecord && !initialized) {
      setRecord(prev => ({
        ...prev,
        [field.name]: existingIds
      }));
      setInitialized(true);
    }
  }, [field, record, initialized, setRecord]);
  
  // When selections change
  const handleChange = (value) => {
    console.log(`[ModalMultiRelationshipField] Change in ${field.name}:`, value);
    
    // Handle different formats of value
    let newIds = [];
    let newDetails = [];
    
    if (Array.isArray(value)) {
      // It's just an array of IDs
      newIds = value.map(String);
    } else if (value && value.ids) {
      // It's the { ids, details } format
      newIds = value.ids.map(String);
      newDetails = value.details || [];
    } else if (value && typeof value === 'object') {
      // It might be a direct object reference
      newIds = Object.keys(value).map(String);
    }
    
    // Update our local state
    setSelectedIds(newIds);
    
    // Update the parent record
    if (setRecord) {
      setRecord(prev => {
        // Preserve existing details for selected IDs if available
        const existingDetails = prev[`${field.name}_details`] || [];
        
        // Merge existing details with new details
        const updatedDetails = newDetails.length > 0 
          ? newDetails 
          : existingDetails.filter(detail => 
              newIds.includes(String(detail.id))
            );
        
        return {
          ...prev,
          // Set the IDs
          [field.name]: newIds,
          // Also update details if we have them
          [`${field.name}_details`]: updatedDetails
        };
      });
    }
  };
  
  return (
    <Box sx={{ mt: 2, mb: 2 }}>
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
      
      <MultiRelationshipField
        field={{
          ...field,
          parentId: record?.id, // Important for database sync
          parentTable: config?.name // Important for junction table
        }}
        value={selectedIds} // Use our controlled state
        onChange={handleChange}
      />
    </Box>
  );
};