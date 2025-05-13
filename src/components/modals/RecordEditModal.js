'use client';

import { createClient } from '@/lib/supabase/browser';

/**
 * Helper function to save multirelationship fields to junction tables
 * This is particularly useful for modal views
 */
export const saveMultiRelationships = async ({ config, record }) => {
  if (!record?.id || !config?.fields) {
    console.warn('Cannot save multirelationships: Missing record ID or config fields');
    return false;
  }
  
  const supabase = createClient();
  
  // Find all multirelationship fields in the config
  const multiRelationshipFields = config.fields.filter(
    field => field.type === 'multiRelationship' && field.relation?.junctionTable
  );
  
  if (multiRelationshipFields.length === 0) {
    // No multirelationship fields to save
    return true;
  }
  
  console.log(`Saving ${multiRelationshipFields.length} multirelationship fields for record ${record.id}`);
  
  try {
    // Process each multirelationship field
    await Promise.all(
      multiRelationshipFields.map(async field => {
        // Get the configuration for this field
        const { junctionTable, sourceKey, targetKey } = field.relation;
        const sourceKeyName = sourceKey || `${config.name}_id`;
        const targetKeyName = targetKey || `${field.relation.table}_id`;
        
        // Get the selected IDs for this field - handle all possible formats
        let selectedIds = [];
        
        if (record[field.name]) {
          if (Array.isArray(record[field.name])) {
            // It's just an array of IDs
            selectedIds = record[field.name];
          } else if (typeof record[field.name] === 'object' && record[field.name].ids) {
            // It's in { ids, details } format
            selectedIds = record[field.name].ids;
          }
        } else if (record[`${field.name}_details`]) {
          // We have details but not IDs directly
          selectedIds = record[`${field.name}_details`].map(item => item.id);
        }
        
        // Ensure all IDs are strings for consistency
        const normalizedIds = selectedIds.map(String).filter(Boolean);
        
        console.log(`Field ${field.name}: Saving ${normalizedIds.length} relationships`);
        
        // Step 1: Delete existing relationships
        const { error: deleteError } = await supabase
          .from(junctionTable)
          .delete()
          .eq(sourceKeyName, record.id);
          
        if (deleteError) {
          console.error(`Error deleting existing relationships for ${field.name}:`, deleteError);
          return false;
        }
        
        // Step 2: Insert new relationships if there are any
        if (normalizedIds.length > 0) {
          const newRelationships = normalizedIds.map(id => ({
            [sourceKeyName]: record.id,
            [targetKeyName]: id
          }));
          
          const { error: insertError } = await supabase
            .from(junctionTable)
            .insert(newRelationships);
            
          if (insertError) {
            console.error(`Error inserting new relationships for ${field.name}:`, insertError);
            return false;
          }
        }
        
        return true;
      })
    );
    
    return true;
  } catch (error) {
    console.error('Error saving multirelationships:', error);
    return false;
  }
};

/**
 * A helper function to merge multirelationship values
 * This is useful when you need to combine new selections with existing ones
 */
export const mergeMultiRelationshipValues = (existing, newValue) => {
  // Handle all possible formats for existing values
  let existingIds = [];
  if (Array.isArray(existing)) {
    existingIds = existing.map(String);
  } else if (existing && existing.ids) {
    existingIds = existing.ids.map(String);
  }
  
  // Handle all possible formats for new values
  let newIds = [];
  let newDetails = [];
  
  if (Array.isArray(newValue)) {
    newIds = newValue.map(String);
  } else if (newValue && newValue.ids) {
    newIds = newValue.ids.map(String);
    newDetails = newValue.details || [];
  }
  
  // Merge IDs, ensuring uniqueness
  const mergedIds = [...new Set([...existingIds, ...newIds])];
  
  return {
    ids: mergedIds,
    details: newDetails.length > 0 ? newDetails : []
  };
};

/**
 * Hook for handling multirelationship fields in modal context
 */
export const useModalMultiRelationships = ({ config, record, setRecord }) => {
  const updateMultiRelationship = (fieldName, value) => {
    console.log(`Updating multirelationship field ${fieldName}:`, value);
    
    // Get existing values
    const existingValue = record[fieldName] || [];
    
    // Merge with new values instead of replacing
    const mergedValue = mergeMultiRelationshipValues(existingValue, value);
    
    setRecord(prev => ({
      ...prev,
      [fieldName]: mergedValue.ids,
      [`${fieldName}_details`]: mergedValue.details.length > 0 
        ? mergedValue.details 
        : prev[`${fieldName}_details`] || []
    }));
  };
  
  const saveAllMultiRelationships = async () => {
    return saveMultiRelationships({ config, record });
  };
  
  return {
    updateMultiRelationship,
    saveAllMultiRelationships
  };
};

/**
 * Helper to extract multirelationship IDs from a record in a consistent format
 */
export const extractMultiRelationshipIds = (record, fieldName) => {
  if (!record || !fieldName) return [];
  
  if (Array.isArray(record[fieldName])) {
    return record[fieldName].map(String);
  } else if (record[fieldName]?.ids) {
    return record[fieldName].ids.map(String);
  } else if (record[`${fieldName}_details`]) {
    return record[`${fieldName}_details`]
      .map(item => String(item.id))
      .filter(Boolean);
  }
  
  return [];
};