// lib/supabase/queries/pivot/multirelationship.js

import { createClient } from '@/lib/supabase/browser';
import { normalizeMultiRelationshipValue } from '@/lib/utils/filters/listfilters/normalizeMultiRelationshipValue';

const supabase = createClient();

/**
 * Save all multi-relationship fields for a record
 */
export const saveAllMultiRelationshipFields = async (tableName, recordId, recordData, config) => {
  try {
    console.log(`[multiRelOps] Processing multi-relationship fields for ${tableName} record ${recordId}`);
    
    const multiRelFields = config?.fields?.filter(f => f.type === 'multiRelationship') || [];
    
    if (multiRelFields.length === 0) {
      console.log(`[multiRelOps] No multi-relationship fields found for ${tableName}`);
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
        console.error(`[multiRelOps] Error processing field ${field.name}:`, err);
        errors.push({ field: field.name, error: err.message });
      }
    }

    const allSuccessful = errors.length === 0;
    
    console.log(`[multiRelOps] Processed ${multiRelFields.length} multi-relationship fields. ${errors.length} errors.`);
    
    return { 
      success: allSuccessful, 
      errors,
      results 
    };

  } catch (err) {
    console.error(`[multiRelOps] Unexpected error:`, err);
    return { success: false, errors: [{ error: err.message }], results: [] };
  }
};

/**
 * Save a single multi-relationship field
 */
export const saveMultiRelationshipField = async (tableName, recordId, fieldConfig, fieldValue, fullRecord = {}) => {
  try {
    const fieldName = fieldConfig.name;
    console.log(`[multiRelOps] Saving multi-relationship field: ${fieldName}`);

    if (!fieldConfig.relation) {
      console.error(`[multiRelOps] No relation config found for field ${fieldName}`);
      return { success: false, error: 'No relation configuration found' };
    }

    const { table: relatedTable, pivotTable, sourceKey, targetKey } = fieldConfig.relation;
    
    // Normalize the field value to an array of IDs
    const newIds = normalizeMultiRelationshipValue(fieldValue);
    console.log(`[multiRelOps] Normalized IDs for ${fieldName}:`, newIds);

    if (pivotTable) {
      // Handle pivot table relationships
      return await savePivotRelationship(
        pivotTable,
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
    console.error(`[multiRelOps] Error saving field ${fieldConfig.name}:`, err);
    return { success: false, error: err.message };
  }
};

/**
 * Save pivot table relationship
 */
const savePivotRelationship = async (pivotTable, sourceKey, targetKey, recordId, newIds) => {
  try {
    console.log(`[multiRelOps] Saving pivot relationship in ${pivotTable}: ${sourceKey}=${recordId}, ${targetKey} in [${newIds.join(', ')}]`);

    // First, get existing relationships
    const { data: existingRels, error: fetchError } = await supabase
      .from(pivotTable)
      .select(`${targetKey}`)
      .eq(sourceKey, recordId);

    if (fetchError) {
      console.error(`[multiRelOps] Error fetching existing relationships:`, fetchError);
      return { success: false, error: fetchError.message };
    }

    const existingIds = existingRels?.map(rel => String(rel[targetKey])) || [];
    const existingSet = new Set(existingIds);
    const newSet = new Set(newIds);

    // Determine what to add and remove
    const toAdd = newIds.filter(id => !existingSet.has(id));
    const toRemove = existingIds.filter(id => !newSet.has(id));

    console.log(`[multiRelOps] Pivot changes - Add: [${toAdd.join(', ')}], Remove: [${toRemove.join(', ')}]`);

    // Remove relationships that are no longer needed
    if (toRemove.length > 0) {
      const { error: deleteError } = await supabase
        .from(pivotTable)
        .delete()
        .eq(sourceKey, recordId)
        .in(targetKey, toRemove);

      if (deleteError) {
        console.error(`[multiRelOps] Error removing relationships:`, deleteError);
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
        console.error(`[multiRelOps] Error adding relationships:`, insertError);
        return { success: false, error: insertError.message };
      }
    }

    console.log(`[multiRelOps] Successfully updated pivot relationships`);
    return { success: true, added: toAdd.length, removed: toRemove.length };

  } catch (err) {
    console.error(`[multiRelOps] Error in savePivotRelationship:`, err);
    return { success: false, error: err.message };
  }
};

/**
 * Save direct relationship (updates foreign key on related records)
 */
const saveDirectRelationship = async (relatedTable, foreignKey, recordId, newIds) => {
  try {
    console.log(`[multiRelOps] Saving direct relationship in ${relatedTable}: ${foreignKey}=${recordId} for IDs [${newIds.join(', ')}]`);

    // First, clear the foreign key for all records that were previously linked
    const { error: clearError } = await supabase
      .from(relatedTable)
      .update({ [foreignKey]: null })
      .eq(foreignKey, recordId);

    if (clearError) {
      console.error(`[multiRelOps] Error clearing existing relationships:`, clearError);
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
        console.error(`[multiRelOps] Error setting new relationships:`, updateError);
        return { success: false, error: updateError.message };
      }
    }

    console.log(`[multiRelOps] Successfully updated direct relationships`);
    return { success: true, linkedCount: newIds.length };

  } catch (err) {
    console.error(`[multiRelOps] Error in saveDirectRelationship:`, err);
    return { success: false, error: err.message };
  }
};