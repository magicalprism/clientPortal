'use client';

import { createClient } from '@/lib/supabase/browser';
import normalizeMultiRelationshipValue from './lib/utils/normalizeMultiRelationshipValue';

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
    console.log('[saveMultiRelationships] No multirelationship fields found in config');
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
        
        // Use the normalizeMultiRelationshipValue utility to handle different formats
        const selectedIds = normalizeMultiRelationshipValue(record[field.name]);
        
        console.log(`[saveMultiRelationships] Field ${field.name}: Raw value from record:`, record[field.name]);
        console.log(`[saveMultiRelationships] Field ${field.name}: Normalized IDs:`, selectedIds);
        
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
        const newSet = new Set(selectedIds);
        
        // Quick comparison to see if sets match
        const hasChanges = 
          currentIds.length !== selectedIds.length ||
          selectedIds.some(id => !currentSet.has(id)) ||
          currentIds.some(id => !newSet.has(id));
        
        if (!hasChanges) {
          console.log(`[saveMultiRelationships] Field ${field.name}: No changes to relationships, skipping save`);
          return true;
        }
        
        console.log(`[saveMultiRelationships] Field ${field.name}: Changes detected, saving ${selectedIds.length} relationships (changed from ${currentIds.length})`);
        
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
        if (selectedIds.length > 0) {
          const newRelationships = selectedIds.map(id => ({
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
        
        // Step 3: Also update the tags field in the main record to keep it in sync
        // This is important because some parts of the app may rely on the tags field
        try {
          const { error: updateError } = await supabase
            .from(config.name)
            .update({ 
              [field.name]: selectedIds,
              updated_at: new Date().toISOString()
            })
            .eq('id', record.id);
            
          if (updateError) {
            console.error(`[saveMultiRelationships] Error updating ${field.name} in main record:`, updateError);
            // Don't fail the entire operation for this, since the junction table is the source of truth
          } else {
            console.log(`[saveMultiRelationships] Successfully updated ${field.name} in main record`);
          }
        } catch (err) {
          console.error(`[saveMultiRelationships] Unexpected error updating main record:`, err);
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