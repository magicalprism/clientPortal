'use client';

import { createClient } from '@/lib/supabase/browser';

/**
 * Helper function to save multirelationship fields to junction tables
 * This is particularly useful for modal views
 */
export const saveMultiRelationships = async ({ config, record }) => {
  if (!record?.id || !config?.fields) {
    console.warn('[saveMultiRelationships] Missing record ID or config fields');
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
  
  console.log(`[saveMultiRelationships] Processing ${multiRelationshipFields.length} multirelationship fields for record ${record.id}`);
  
  try {
    // Process each multirelationship field
    const results = await Promise.all(
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
            selectedIds = record[field.name].filter(Boolean);
          } else if (typeof record[field.name] === 'object' && record[field.name].ids) {
            // It's in { ids, details } format
            selectedIds = record[field.name].ids.filter(Boolean);
          }
        } else if (record[`${field.name}_details`]) {
          // We have details but not IDs directly
          selectedIds = record[`${field.name}_details`]
            .map(item => item.id)
            .filter(Boolean);
        }
        
        console.log(`[saveMultiRelationships] Field ${field.name}: `, {
          rawSelectedIds: selectedIds
        });
        
        // Ensure all IDs are strings for consistency and filter out any empty values
        const normalizedIds = selectedIds.map(String).filter(Boolean);
        
        console.log(`[saveMultiRelationships] Field ${field.name}: Processing ${normalizedIds.length} relationships`);
        
        // Get current relationships to check for changes
        const { data: currentRelations } = await supabase
          .from(junctionTable)
          .select(targetKeyName)
          .eq(sourceKeyName, record.id);
          
        const currentIds = (currentRelations || [])
          .map(r => String(r[targetKeyName]))
          .filter(Boolean);
        
        console.log(`[saveMultiRelationships] Field ${field.name}: Current relationships:`, currentIds);
        
        // Check if anything actually changed
        const currentSet = new Set(currentIds);
        const newSet = new Set(normalizedIds);
        
        // Quick comparison to see if sets match
        const hasChanges = 
          currentIds.length !== normalizedIds.length ||
          normalizedIds.some(id => !currentSet.has(id)) ||
          currentIds.some(id => !newSet.has(id));
        
        if (!hasChanges) {
          console.log(`[saveMultiRelationships] Field ${field.name}: No changes to relationships, skipping save`);
          return true;
        }
        
        console.log(`[saveMultiRelationships] Field ${field.name}: Changes detected, saving ${normalizedIds.length} relationships (changed from ${currentIds.length})`);
        
        // Step 1: Delete existing relationships
        const { error: deleteError } = await supabase
          .from(junctionTable)
          .delete()
          .eq(sourceKeyName, record.id);
          
        if (deleteError) {
          console.error(`[saveMultiRelationships] Error deleting existing relationships for ${field.name}:`, deleteError);
          return false;
        }
        
        // Step 2: Insert new relationships if there are any
        if (normalizedIds.length > 0) {
          const newRelationships = normalizedIds.map(id => ({
            [sourceKeyName]: record.id,
            [targetKeyName]: id
          }));
          
          console.log(`[saveMultiRelationships] Field ${field.name}: Inserting relationships:`, newRelationships);
          
          const { error: insertError } = await supabase
            .from(junctionTable)
            .insert(newRelationships);
            
          if (insertError) {
            console.error(`[saveMultiRelationships] Error inserting new relationships for ${field.name}:`, insertError);
            return false;
          }
          
          console.log(`[saveMultiRelationships] Field ${field.name}: Successfully saved relationships`);
        }
        
        return true;
      })
    );
    
    const success = results.every(result => result === true);
    
    console.log(`[saveMultiRelationships] All multirelationship fields saved successfully:`, success);
    
    return success;
  } catch (error) {
    console.error('[saveMultiRelationships] Error saving multirelationships:', error);
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
  let existingDetails = [];
  
  if (Array.isArray(existing)) {
    existingIds = existing.map(String);
  } else if (existing && existing.ids) {
    existingIds = existing.ids.map(String);
    existingDetails = existing.details || [];
  } else if (existing && Array.isArray(existing.details)) {
    existingDetails = existing.details;
    existingIds = existingDetails.map(item => String(item.id)).filter(Boolean);
  }
  
  // Handle all possible formats for new values
  let newIds = [];
  let newDetails = [];
  
  if (Array.isArray(newValue)) {
    newIds = newValue.map(String);
  } else if (newValue && newValue.ids) {
    newIds = newValue.ids.map(String);
    newDetails = newValue.details || [];
  } else if (newValue && Array.isArray(newValue.details)) {
    newDetails = newValue.details;
    newIds = newDetails.map(item => String(item.id)).filter(Boolean);
  }
  
  // Merge IDs, ensuring uniqueness
  const mergedIds = [...new Set([...existingIds, ...newIds])];
  
  // Merge details, prioritizing new details
  const detailsMap = new Map();
  
  // Add existing details to map
  existingDetails.forEach(detail => {
    if (detail && detail.id) {
      detailsMap.set(String(detail.id), detail);
    }
  });
  
  // Add new details, overwriting existing ones
  newDetails.forEach(detail => {
    if (detail && detail.id) {
      detailsMap.set(String(detail.id), detail);
    }
  });
  
  // Filter details to only include IDs in the mergedIds list
  const mergedDetails = Array.from(detailsMap.values())
    .filter(detail => mergedIds.includes(String(detail.id)));
  
  return {
    ids: mergedIds,
    details: mergedDetails
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
    const existingDetails = record[`${fieldName}_details`] || [];
    
    // Create combined existing value object
    const combinedExisting = {
      ids: Array.isArray(existingValue) ? existingValue : [],
      details: existingDetails
    };
    
    // Merge with new values instead of replacing
    const mergedValue = mergeMultiRelationshipValues(combinedExisting, value);
    
    setRecord(prev => ({
      ...prev,
      [fieldName]: mergedValue.ids,
      [`${fieldName}_details`]: mergedValue.details || []
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
    return record[fieldName].map(String).filter(Boolean);
  } else if (record[fieldName]?.ids) {
    return record[fieldName].ids.map(String).filter(Boolean);
  } else if (record[`${fieldName}_details`]) {
    return record[`${fieldName}_details`]
      .map(item => String(item.id))
      .filter(Boolean);
  }
  
  return [];
};