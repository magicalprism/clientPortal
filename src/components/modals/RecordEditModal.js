'use client';

import { createClient } from '@/lib/supabase/browser';
import normalizeMultiRelationshipValue from './lib/utils/normalizeMultiRelationshipValue';

/**
 * Helper function to save multirelationship fields to junction tables
 * This is particularly useful for modal views
 */
'use client';

import { createClient } from '@/lib/supabase/browser';
import { normalizeMultiRelationshipValue } from '@/lib/utils/filters/listfilters/normalizeMultiRelationshipValue';

/**
 * Utility for handling multirelationship operations
 * Enhanced to work with various component implementations
 */
export const useModalMultiRelationships = ({ config, record, setRecord }) => {
  const supabase = createClient();

  /**
   * Updates a multirelationship field in a record with proper format
   * 
   * @param {string} fieldName - Name of the field to update
   * @param {Object} value - Value object with ids and details
   */
  const updateMultiRelationship = (fieldName, value) => {
    if (!fieldName) return;
    
    // Find field definition
    const fieldDef = config?.fields?.find(f => f.name === fieldName);
    if (!fieldDef || fieldDef.type !== 'multiRelationship') {
      console.warn(`[useModalMultiRelationships] Field ${fieldName} not found or not a multiRelationship`);
      return;
    }
    
    // Ensure we have a normalized list of IDs
    let ids = [];
    let details = [];
    
    if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value.ids)) {
        ids = value.ids.map(String).filter(Boolean);
        details = Array.isArray(value.details) ? value.details : [];
      } else if (Array.isArray(value)) {
        ids = value.map(String).filter(Boolean);
      } else {
        // Try to extract IDs from generic object
        ids = Object.keys(value).filter(k => value[k]).map(String);
      }
    } else if (Array.isArray(value)) {
      ids = value.map(String).filter(Boolean);
    } else {
      ids = normalizeMultiRelationshipValue(value);
    }
    
    // Ensure details has proper format
    const labelField = fieldDef.relation?.labelField || 'title';
    
    if (details.length === 0) {
      // Try to use existing details from record
      const existingDetails = record?.[`${fieldName}_details`] || [];
      const existingMap = new Map(existingDetails.map(d => [String(d.id), d]));
      
      details = ids.map(id => {
        if (existingMap.has(String(id))) {
          return existingMap.get(String(id));
        }
        return { id, [labelField]: `ID: ${id}` };
      });
    }
    
    // Log what we're doing
    console.log(`[useModalMultiRelationships] Updating ${fieldName}:`, {
      ids,
      detailsCount: details.length
    });
    
    // Update the record with both IDs array and details
    setRecord(prev => ({
      ...prev,
      [fieldName]: ids,
      [`${fieldName}_details`]: details
    }));
  };
  
  /**
   * Saves multirelationship changes to the database
   * 
   * @param {string} fieldName - Name of the field to save
   * @returns {Promise<boolean>} - Success status
   */
  const saveMultiRelationship = async (fieldName) => {
    if (!record?.id || !fieldName) return false;
    
    // Find field definition
    const fieldDef = config?.fields?.find(f => f.name === fieldName);
    if (!fieldDef || !fieldDef.relation?.junctionTable) {
      console.warn(`[useModalMultiRelationships] Field ${fieldName} missing junction table config`);
      return false;
    }
    
    const { 
      junctionTable, 
      sourceKey = `${config.name}_id`, 
      targetKey = `${fieldDef.relation.table}_id` 
    } = fieldDef.relation;
    
    // Get the normalized IDs
    const ids = normalizeMultiRelationshipValue(record[fieldName]);
    
    // Fetch existing relations
    try {
      const { data: existingRels, error } = await supabase
        .from(junctionTable)
        .select(targetKey)
        .eq(sourceKey, record.id);
        
      if (error) {
        console.error(`[useModalMultiRelationships] Error fetching relations for ${fieldName}:`, error);
        return false;
      }
      
      // Extract existing IDs
      const existingIds = (existingRels || []).map(r => String(r[targetKey]));
      
      // Calculate additions and removals
      const toAdd = ids.filter(id => !existingIds.includes(String(id)));
      const toRemove = existingIds.filter(id => !ids.includes(String(id)));
      
      // Add new relations
      if (toAdd.length > 0) {
        const insertData = toAdd.map(id => ({
          [sourceKey]: record.id,
          [targetKey]: id
        }));
        
        const { error: insertError } = await supabase
          .from(junctionTable)
          .insert(insertData);
          
        if (insertError) {
          console.error(`[useModalMultiRelationships] Error adding relations for ${fieldName}:`, insertError);
          return false;
        }
      }
      
      // Remove relations
      if (toRemove.length > 0) {
        for (const id of toRemove) {
          const { error: deleteError } = await supabase
            .from(junctionTable)
            .delete()
            .match({
              [sourceKey]: record.id,
              [targetKey]: id
            });
            
          if (deleteError) {
            console.error(`[useModalMultiRelationships] Error removing relation for ${fieldName}:`, deleteError);
          }
        }
      }
      
      return true;
    } catch (err) {
      console.error(`[useModalMultiRelationships] Unexpected error for ${fieldName}:`, err);
      return false;
    }
  };
  
  /**
   * Saves all multirelationship fields in a record
   * 
   * @returns {Promise<boolean>} - Success status
   */
  const saveAllMultiRelationships = async () => {
    if (!record?.id || !config?.fields) return false;
    
    // Find all multirelationship fields
    const multiRelFields = config.fields
      .filter(f => f.type === 'multiRelationship' && f.relation?.junctionTable);
      
    if (multiRelFields.length === 0) return true; // No fields to save
    
    try {
      // Save each field
      const results = await Promise.all(
        multiRelFields.map(field => saveMultiRelationship(field.name))
      );
      
      // Check if all succeeded
      return results.every(Boolean);
    } catch (err) {
      console.error('[useModalMultiRelationships] Error saving multirelationships:', err);
      return false;
    }
  };
  
  return {
    updateMultiRelationship,
    saveMultiRelationship,
    saveAllMultiRelationships
  };
};

/**
 * Saves all multirelationship fields for a record
 * Standalone function for use without hooks
 * 
 * @param {Object} params - Parameters object
 * @param {Object} params.config - Collection configuration
 * @param {Object} params.record - Record to save
 * @returns {Promise<boolean>} - Success status
 */
export const saveMultiRelationships = async ({ config, record }) => {
  if (!record?.id || !config?.fields) {
    console.warn('[saveMultiRelationships] Missing record ID or config');
    return false;
  }
  
  const supabase = createClient();
  
  // Find multirelationship fields
  const multiRelFields = config.fields.filter(
    f => f.type === 'multiRelationship' && f.relation?.junctionTable
  );
  
  if (multiRelFields.length === 0) return true; // No fields to save
  
  console.log(`[saveMultiRelationships] Saving ${multiRelFields.length} fields for record ${record.id}`);
  
  try {
    // Process each field
    const results = await Promise.all(
      multiRelFields.map(async (field) => {
        const { 
          junctionTable, 
          sourceKey = `${config.name}_id`, 
          targetKey = `${field.relation.table}_id` 
        } = field.relation;
        
        // Get normalized IDs from the record
        const normalizedIds = normalizeMultiRelationshipValue(record[field.name]);
        
        // Debug the values being saved
        console.log(`[saveMultiRelationships] ${field.name} IDs to save:`, {
          normalizedIds,
          rawValue: record[field.name]
        });
        
        // Fetch existing relations
        const { data: existingRels, error: fetchError } = await supabase
          .from(junctionTable)
          .select(targetKey)
          .eq(sourceKey, record.id);
          
        if (fetchError) {
          console.error(`[saveMultiRelationships] Error fetching relations for ${field.name}:`, fetchError);
          return false;
        }
        
        // Extract existing IDs
        const existingIds = (existingRels || []).map(r => String(r[targetKey]));
        
        // Calculate additions and removals
        const toAdd = normalizedIds.filter(id => !existingIds.includes(String(id)));
        const toRemove = existingIds.filter(id => !normalizedIds.includes(String(id)));
        
        console.log(`[saveMultiRelationships] ${field.name} changes:`, {
          existing: existingIds.length,
          toAdd: toAdd.length,
          toRemove: toRemove.length
        });
        
        // Add new relations
        if (toAdd.length > 0) {
          const insertData = toAdd.map(id => ({
            [sourceKey]: record.id,
            [targetKey]: id
          }));
          
          const { error: insertError } = await supabase
            .from(junctionTable)
            .insert(insertData);
            
          if (insertError) {
            console.error(`[saveMultiRelationships] Error adding relations for ${field.name}:`, insertError);
            return false;
          }
        }
        
        // Remove relations
        if (toRemove.length > 0) {
          for (const id of toRemove) {
            const { error: deleteError } = await supabase
              .from(junctionTable)
              .delete()
              .match({
                [sourceKey]: record.id,
                [targetKey]: id
              });
              
            if (deleteError) {
              console.error(`[saveMultiRelationships] Error removing relation for ${field.name}:`, deleteError);
            }
          }
        }
        
        return true;
      })
    );
    
    // Check if all succeeded
    const success = results.every(Boolean);
    console.log(`[saveMultiRelationships] Completed with status: ${success}`);
    
    return success;
  } catch (err) {
    console.error('[saveMultiRelationships] Unexpected error:', err);
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