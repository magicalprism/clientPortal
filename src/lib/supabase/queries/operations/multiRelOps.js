// lib/supabase/queries/pivot/multirelationship.js

import { createClient } from '@/lib/supabase/browser';
import { normalizeMultiRelationshipValue } from '@/lib/utils/filters/listfilters/normalizeMultiRelationshipValue';

const supabase = createClient();

/**
 * Save all multi-relationship fields for a record
 */
export const saveAllMultiRelationshipFields = async (tableName, recordId, recordData, config) => {
  try {
    const multiRelFields = config?.fields?.filter(f => f.type === 'multiRelationship') || [];
    
    if (multiRelFields.length === 0) {
      return { success: true, errors: [] };
    }

    const results = [];
    const errors = [];

    for (const field of multiRelFields) {
      try {
        const result = await saveMultiRelationshipField(
          tableName, 
          recordId, 
          field, 
          recordData[field.name],
          recordData
        );
        
        results.push({ field: field.name, result });
        
        if (!result.success) {
          errors.push({ field: field.name, error: result.error });
        }
      } catch (err) {
        errors.push({ field: field.name, error: err.message });
      }
    }

    const allSuccessful = errors.length === 0;
    
    return { 
      success: allSuccessful, 
      errors,
      results 
    };

  } catch (err) {
    return { success: false, errors: [{ error: err.message }], results: [] };
  }
};

/**
 * Save a single multi-relationship field
 */
export const saveMultiRelationshipField = async (tableName, recordId, fieldConfig, fieldValue, fullRecord = {}) => {
  try {
    const fieldName = fieldConfig.name;

    if (!fieldConfig.relation) {
      return { success: false, error: 'No relation configuration found' };
    }

    const { table: relatedTable, pivotTable, junctionTable, sourceKey, targetKey } = fieldConfig.relation;
    
    // Normalize the field value to an array of IDs
    const newIds = normalizeMultiRelationshipValue(fieldValue);

    // Use either pivotTable or junctionTable (junctionTable is the newer naming convention)
    const joinTable = pivotTable || junctionTable;

    if (joinTable) {
      // Handle pivot/junction table relationships
      return await savePivotRelationship(
        joinTable,
        sourceKey || `${tableName}_id`, 
        targetKey || `${relatedTable}_id`,
        recordId,
        newIds
      );
    } else {
      // Handle direct foreign key relationships (less common for multi-rel)
      return await saveDirectRelationship(
        relatedTable,
        targetKey || `${tableName}_id`,
        recordId,
        newIds
      );
    }

  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * Save pivot table relationship
 */
const savePivotRelationship = async (pivotTable, sourceKey, targetKey, recordId, newIds) => {
  try {
    // First, get existing relationships
    const { data: existingRels, error: fetchError } = await supabase
      .from(pivotTable)
      .select(`${targetKey}`)
      .eq(sourceKey, recordId);

    if (fetchError) {
      return { success: false, error: fetchError.message };
    }

    const existingIds = existingRels?.map(rel => String(rel[targetKey])) || [];
    const existingSet = new Set(existingIds);
    const newSet = new Set(newIds);

    // Determine what to add and remove
    const toAdd = newIds.filter(id => !existingSet.has(id));
    const toRemove = existingIds.filter(id => !newSet.has(id));

    // Remove relationships that are no longer needed
    if (toRemove.length > 0) {
      const { error: deleteError } = await supabase
        .from(pivotTable)
        .delete()
        .eq(sourceKey, recordId)
        .in(targetKey, toRemove);

      if (deleteError) {
        return { success: false, error: deleteError.message };
      }
    }

    // Add new relationships
    if (toAdd.length > 0) {
      const insertData = toAdd.map(id => ({
        [sourceKey]: recordId,
        [targetKey]: parseInt(id, 10),
        created_at: new Date().toISOString()
      }));

      const { error: insertError } = await supabase
        .from(pivotTable)
        .insert(insertData);

      if (insertError) {
        return { success: false, error: insertError.message };
      }
    }

    return { success: true, added: toAdd.length, removed: toRemove.length };

  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * Save direct relationship (updates foreign key on related records)
 */
const saveDirectRelationship = async (relatedTable, foreignKey, recordId, newIds) => {
  try {
    // First, clear the foreign key for all records that were previously linked
    const { error: clearError } = await supabase
      .from(relatedTable)
      .update({ [foreignKey]: null })
      .eq(foreignKey, recordId);

    if (clearError) {
      return { success: false, error: clearError.message };
    }

    // Set the foreign key for the new linked records
    if (newIds.length > 0) {
      const { error: updateError } = await supabase
        .from(relatedTable)
        .update({ 
          [foreignKey]: recordId,
          updated_at: new Date().toISOString()
        })
        .in('id', newIds.map(id => parseInt(id, 10)));

      if (updateError) {
        return { success: false, error: updateError.message };
      }
    }

    return { success: true, linkedCount: newIds.length };

  } catch (err) {
    return { success: false, error: err.message };
  }
};