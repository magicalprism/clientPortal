// lib/supabase/queries/pivot/multirelationship.js

import { createClient } from '@/lib/supabase/browser';
import { normalizeMultiRelationshipValue } from '@/lib/utils/filters/listfilters/normalizeMultiRelationshipValue';

const supabase = createClient();

/**
 * Save a single multiRelationship field (handles both many-to-many and one-to-many)
 * @param {string} tableName - The main table name (e.g., 'project')
 * @param {number} recordId - The main record ID
 * @param {string} fieldName - The field name (e.g., 'task_id')
 * @param {Array|Object} fieldValue - The new value for the field
 * @param {Object} fieldDef - The field definition from config
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const saveMultiRelationshipField = async (tableName, recordId, fieldName, fieldValue, fieldDef) => {
  try {
    // Handle One-to-Many relationships
    if (!fieldDef?.relation?.junctionTable && fieldDef?.relation?.isOneToMany) {
      return await saveOneToManyRelationship(tableName, recordId, fieldValue, fieldDef);
    }
    
    // Handle Many-to-Many relationships
    return await saveManyToManyRelationship(tableName, recordId, fieldValue, fieldDef);
    
  } catch (err) {
    console.error(`❌ Error processing ${fieldName}:`, err);
    return { success: false, error: err.message };
  }
};

/**
 * Handle One-to-Many relationship updates
 * @param {string} tableName - The main table name
 * @param {number} recordId - The main record ID
 * @param {Array} fieldValue - The new value for the field
 * @param {Object} fieldDef - The field definition
 * @returns {Promise<{success: boolean, error?: string}>}
 */
const saveOneToManyRelationship = async (tableName, recordId, fieldValue, fieldDef) => {
  const table = fieldDef.relation.table;
  const oneToManyTargetKey = fieldDef.relation.targetKey || `${tableName}_id`;
  const newIds = normalizeMultiRelationshipValue(fieldValue);

  try {
    // Get existing children
    const { data: existingChildren, error: existingError } = await supabase
      .from(table)
      .select('id')
      .eq(oneToManyTargetKey, recordId);

    if (existingError) {
      console.error(`❌ Error fetching existing ${table} records:`, existingError);
      return { success: false, error: existingError.message };
    }

    const existingIds = (existingChildren || []).map(c => String(c.id));
    const toRemove = existingIds.filter(id => !newIds.includes(id));
    const toAdd = newIds.filter(id => !existingIds.includes(id));

    // Remove relationships (set foreign key to null)
    for (const id of toRemove) {
      const { error: clearError } = await supabase
        .from(table)
        .update({ [oneToManyTargetKey]: null })
        .eq('id', id);

      if (clearError) {
        console.error(`❌ Error clearing ${oneToManyTargetKey} for ${table} ${id}:`, clearError);
        return { success: false, error: clearError.message };
      }
    }

    // Add relationships (set foreign key)
    for (const id of toAdd) {
      const { error: setError } = await supabase
        .from(table)
        .update({ [oneToManyTargetKey]: recordId })
        .eq('id', id);

      if (setError) {
        console.error(`❌ Error setting ${oneToManyTargetKey} for ${table} ${id}:`, setError);
        return { success: false, error: setError.message };
      }
    }

    console.log(`✅ One-to-many relationship updated for ${table}: removed ${toRemove.length}, added ${toAdd.length}`);
    return { success: true };

  } catch (err) {
    console.error(`❌ Unexpected error in one-to-many relationship:`, err);
    return { success: false, error: err.message };
  }
};

/**
 * Handle Many-to-Many relationship updates via junction table
 * @param {string} tableName - The main table name
 * @param {number} recordId - The main record ID
 * @param {Array} fieldValue - The new value for the field
 * @param {Object} fieldDef - The field definition
 * @returns {Promise<{success: boolean, error?: string}>}
 */
const saveManyToManyRelationship = async (tableName, recordId, fieldValue, fieldDef) => {
  const { 
    junctionTable, 
    sourceKey = `${tableName}_id`, 
    targetKey = `${fieldDef.relation.table}_id` 
  } = fieldDef.relation;

  try {
    let normalizedIds = normalizeMultiRelationshipValue(fieldValue);
    
    // Get existing relationships
    const { data: existingRels, error: fetchError } = await supabase
      .from(junctionTable)
      .select(targetKey)
      .eq(sourceKey, recordId);
      
    if (fetchError) {
      console.error(`❌ Error fetching existing relationships from ${junctionTable}:`, fetchError);
      return { success: false, error: fetchError.message };
    }
    
    // Extract existing IDs
    const existingIds = (existingRels || [])
      .map(rel => String(rel[targetKey]))
      .filter(Boolean);
    
    // Calculate additions and removals
    const toAdd = normalizedIds.filter(id => !existingIds.includes(String(id)));
    const toRemove = existingIds.filter(id => !normalizedIds.includes(String(id)));
    
    // Add new relationships
    if (toAdd.length > 0) {
      const insertData = toAdd.map(id => ({
        [sourceKey]: recordId,
        [targetKey]: id
      }));
      
      const { error: insertError } = await supabase
        .from(junctionTable)
        .insert(insertData);
        
      if (insertError) {
        console.error(`❌ Error adding relationships to ${junctionTable}:`, insertError);
        return { success: false, error: insertError.message };
      }
    }
    
    // Remove relationships
    for (const id of toRemove) {
      const { error: deleteError } = await supabase
        .from(junctionTable)
        .delete()
        .match({
          [sourceKey]: recordId,
          [targetKey]: id
        });
        
      if (deleteError) {
        console.error(`❌ Error removing relationship from ${junctionTable}:`, deleteError);
        return { success: false, error: deleteError.message };
      }
    }

    console.log(`✅ Many-to-many relationship updated for ${junctionTable}: removed ${toRemove.length}, added ${toAdd.length}`);
    return { success: true };

  } catch (err) {
    console.error(`❌ Unexpected error in many-to-many relationship:`, err);
    return { success: false, error: err.message };
  }
};

/**
 * Save all multiRelationship fields for a record
 * @param {string} tableName - The main table name
 * @param {number} recordId - The main record ID
 * @param {Object} record - The complete record data
 * @param {Object} config - Collection configuration
 * @returns {Promise<{success: boolean, errors?: Array}>}
 */
export const saveAllMultiRelationshipFields = async (tableName, recordId, record, config) => {
  const multiRelFields = config.fields
    .filter(f => f.type === 'multiRelationship')
    .map(f => f.name);

  if (multiRelFields.length === 0) {
    return { success: true };
  }

  const results = [];
  const errors = [];

  for (const fieldName of multiRelFields) {
    const fieldDef = config.fields.find(f => f.name === fieldName);
    const fieldValue = record[fieldName];

    const result = await saveMultiRelationshipField(
      tableName, 
      recordId, 
      fieldName, 
      fieldValue, 
      fieldDef
    );

    results.push({ fieldName, ...result });
    
    if (!result.success) {
      errors.push({ fieldName, error: result.error });
    }
  }

  const allSucceeded = results.every(r => r.success);
  
  console.log(`✅ Multi-relationship fields processed: ${results.length} total, ${errors.length} errors`);
  
  return { 
    success: allSucceeded, 
    results,
    ...(errors.length > 0 && { errors })
  };
};