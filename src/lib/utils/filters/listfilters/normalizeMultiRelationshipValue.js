'use client';

import { createClient } from '@/lib/supabase/browser';

/**
 * Utility to normalize multirelationship values to a consistent format
 * @param {any} value - Value in any format
 * @returns {string[]} - Array of string IDs
 */
export const normalizeMultiRelationshipValue = (value, parentId = null) => {
  const result = (() => {
    if (!value) return [];
    if (Array.isArray(value)) return value.map(String).filter(Boolean);
    if (typeof value === 'object') {
      if (Array.isArray(value.ids)) return value.ids.map(String).filter(Boolean);
      if (!('ids' in value)) return Object.keys(value).filter(k => value[k]);
    }
    if (typeof value === 'string' && value.startsWith('[')) {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed.map(String) : [];
      } catch {}
    }
    if (typeof value === 'string' && value.includes(',')) {
      return value.split(',').map(v => v.trim()).filter(Boolean);
    }
    return [String(value)];
  })();

  // 🔥 Remove parentId if it's somehow there
  return parentId ? result.filter(id => id !== String(parentId)) : result;
};

/**
 * Enhanced function to save all multirelationship fields for a record
 * This implementation is focused on debugging and reliability
 * 
 * @param {Object} params - Parameters
 * @param {Object} params.config - Collection configuration
 * @param {Object} params.record - Record to save
 * @returns {Promise<boolean>} - Success status
 */
export const saveMultiRelationships = async ({ config, record }) => {
  if (!record?.id) {
    console.error('[saveMultiRelationships] ❌ Missing record ID');
    return false;
  }
  
  if (!config?.fields) {
    console.error('[saveMultiRelationships] ❌ Missing config fields');
    return false;
  }
  
  const supabase = createClient();
  console.log('[saveMultiRelationships] 🔍 Starting with record:', record.id);
  
  // Find all multiRelationship fields in the config
  const multiRelFields = config.fields.filter(field => 
    field.type === 'multiRelationship' && 
    field.relation?.junctionTable
  );
  
  if (multiRelFields.length === 0) {
    console.log('[saveMultiRelationships] ℹ️ No multiRelationship fields to save');
    return true;
  }
  
  console.log(`[saveMultiRelationships] 🔄 Found ${multiRelFields.length} multiRelationship fields`);
  
  // Process each field sequentially for better error handling
  let allSuccessful = true;
  
  for (const field of multiRelFields) {
    console.log(`[saveMultiRelationships] 🔄 Processing field: ${field.name}`);
    
    try {
      // Extract relationship configuration
      const { 
        junctionTable, 
        sourceKey = `${config.name}_id`, 
        targetKey = `${field.relation.table}_id` 
      } = field.relation;
      
      if (!junctionTable) {
        console.error(`[saveMultiRelationships] ❌ Missing junction table for ${field.name}`);
        allSuccessful = false;
        continue;
      }
      
      // Get all possible formats of the value from the record
      const rawValue = record[field.name];
      const rawDetails = record[`${field.name}_details`];
      
      console.log(`[saveMultiRelationships] 📊 ${field.name} raw value:`, rawValue);
      console.log(`[saveMultiRelationships] 📊 ${field.name} raw details:`, 
        Array.isArray(rawDetails) ? `${rawDetails.length} items` : rawDetails);
      
      // Normalize value to string array of IDs
      const selectedIds = normalizeMultiRelationshipValue(rawValue);
      
      console.log(`[saveMultiRelationships] 📊 ${field.name} normalized IDs:`, 
        selectedIds.length > 0 ? selectedIds : '(empty)');
      
      // Get existing relationships
      const { data: existingRels, error: fetchError } = await supabase
        .from(junctionTable)
        .select(`${sourceKey}, ${targetKey}`)
        .eq(sourceKey, record.id);
      
      if (fetchError) {
        console.error(`[saveMultiRelationships] ❌ Error fetching relationships for ${field.name}:`, fetchError);
        allSuccessful = false;
        continue;
      }
      
      // Extract existing target IDs
      const existingIds = (existingRels || [])
        .map(rel => String(rel[targetKey]))
        .filter(Boolean);
      
      console.log(`[saveMultiRelationships] 📊 ${field.name} existing IDs:`, 
        existingIds.length > 0 ? existingIds : '(empty)');
      
      // Calculate additions and removals
      const toAdd = selectedIds.filter(id => !existingIds.includes(String(id)));
      const toRemove = existingIds.filter(id => !selectedIds.includes(String(id)));
      
      console.log(`[saveMultiRelationships] 🔄 ${field.name} changes:`, {
        toAdd: toAdd.length > 0 ? toAdd : '(none)',
        toRemove: toRemove.length > 0 ? toRemove : '(none)'
      });
      
      // Skip if no changes needed
      if (toAdd.length === 0 && toRemove.length === 0) {
        console.log(`[saveMultiRelationships] ✅ No changes needed for ${field.name}`);
        continue;
      }
      
      // Add new relationships
      if (toAdd.length > 0) {
        const insertData = toAdd.map(id => ({
          [sourceKey]: record.id,
          [targetKey]: id
        }));
        
        console.log(`[saveMultiRelationships] 📝 Adding ${toAdd.length} relationships for ${field.name}`);
        
        const { error: insertError } = await supabase
          .from(junctionTable)
          .insert(insertData);
        
        if (insertError) {
          console.error(`[saveMultiRelationships] ❌ Error adding relationships for ${field.name}:`, insertError);
          allSuccessful = false;
        } else {
          console.log(`[saveMultiRelationships] ✅ Successfully added ${toAdd.length} relationships for ${field.name}`);
        }
      }
      
      // Remove relationships
      if (toRemove.length > 0) {
        console.log(`[saveMultiRelationships] 📝 Removing ${toRemove.length} relationships for ${field.name}`);
        
        let removeSuccessful = true;
        
        for (const id of toRemove) {
          const { error: deleteError } = await supabase
            .from(junctionTable)
            .delete()
            .match({
              [sourceKey]: record.id,
              [targetKey]: id
            });
          
          if (deleteError) {
            console.error(`[saveMultiRelationships] ❌ Error removing relationship for ${field.name} (ID: ${id}):`, deleteError);
            removeSuccessful = false;
          }
        }
        
        if (removeSuccessful) {
          console.log(`[saveMultiRelationships] ✅ Successfully removed ${toRemove.length} relationships for ${field.name}`);
        } else {
          allSuccessful = false;
        }
      }
    } catch (error) {
      console.error(`[saveMultiRelationships] ❌ Unexpected error processing ${field.name}:`, error);
      allSuccessful = false;
    }
  }
  
  console.log(`[saveMultiRelationships] ${allSuccessful ? '✅ All' : '⚠️ Some'} multirelationship fields saved`);
  return allSuccessful;
};


export default normalizeMultiRelationshipValue;