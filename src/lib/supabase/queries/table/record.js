// lib/supabase/queries/table/record.js

import { createClient } from '@/lib/supabase/browser';
import { getPostgresTimestamp } from '@/lib/utils/getPostgresTimestamp';

const supabase = createClient();

/**
 * Helper function to extract value from select field objects
 */
const extractSelectValue = (value) => {
  if (value === null || value === undefined) return value;
  
  // Handle object with value property (e.g., {value: 'todo', label: 'To Do'})
  if (typeof value === 'object' && value !== null && 'value' in value) {
    return value.value;
  }
  
  return value;
};

/**
 * Generic record update function
 * @param {string} tableName - The table to update
 * @param {number} recordId - The record ID to update
 * @param {Object} record - The record data
 * @param {Object} config - Collection configuration
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateRecord = async (tableName, recordId, record, config) => {
  try {
    // Get fields that should be saved to database
    const dbFieldNames = config.fields
      .filter((f) => f.database !== false)
      .map((f) => f.name);

    // Find multiRelationship fields (handled separately)
    const multiRelFields = config.fields
      .filter(f => f.type === 'multiRelationship')
      .map(f => f.name);

    const payload = {};

    Object.entries(record).forEach(([key, value]) => {
      if (!dbFieldNames.includes(key)) return;

      // Skip multiRelationship fields - they're handled separately
      if (multiRelFields.includes(key)) return;

      const fieldDef = config.fields.find(f => f.name === key);

      if (fieldDef?.type === 'select' || fieldDef?.type === 'status') {
        payload[key] = extractSelectValue(value);
      } else {
        payload[key] = value;
      }
    });

    payload.updated_at = getPostgresTimestamp();

    const { error } = await supabase
      .from(tableName)
      .update(payload)
      .eq('id', recordId);

    if (error) {
      console.error('❌ Error updating record:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Record updated successfully in ${tableName}`);
    return { success: true };

  } catch (err) {
    console.error('❌ Unexpected error updating record:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Generic record creation function
 * @param {string} tableName - The table to insert into
 * @param {Object} record - The record data
 * @param {Object} config - Collection configuration
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const createRecord = async (tableName, record, config) => {
  try {
    // Get fields that should be saved to database
    const dbFieldNames = config.fields
      .filter((f) => f.database !== false)
      .map((f) => f.name);

    // Find multiRelationship fields (handled separately)
    const multiRelFields = config.fields
      .filter(f => f.type === 'multiRelationship')
      .map(f => f.name);

    const payload = {};

    Object.entries(record).forEach(([key, value]) => {
      if (!dbFieldNames.includes(key)) return;

      // Skip multiRelationship fields - they're handled separately
      if (multiRelFields.includes(key)) return;

      const fieldDef = config.fields.find(f => f.name === key);

      if (fieldDef?.type === 'select' || fieldDef?.type === 'status') {
        payload[key] = extractSelectValue(value);
      } else {
        payload[key] = value;
      }
    });

    payload.created_at = getPostgresTimestamp();
    payload.updated_at = getPostgresTimestamp();

    const { data, error } = await supabase
      .from(tableName)
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating record:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Record created successfully in ${tableName}`);
    return { success: true, data };

  } catch (err) {
    console.error('❌ Unexpected error creating record:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Generic record deletion function
 * @param {string} tableName - The table to delete from
 * @param {number} recordId - The record ID to delete
 * @param {boolean} softDelete - Whether to soft delete (default: true)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteRecord = async (tableName, recordId, softDelete = true) => {
  try {
    let result;

    if (softDelete) {
      // Soft delete - set is_deleted = true and deleted_at timestamp
      result = await supabase
        .from(tableName)
        .update({
          is_deleted: true,
          deleted_at: getPostgresTimestamp(),
          updated_at: getPostgresTimestamp()
        })
        .eq('id', recordId);
    } else {
      // Hard delete
      result = await supabase
        .from(tableName)
        .delete()
        .eq('id', recordId);
    }

    if (result.error) {
      console.error('❌ Error deleting record:', result.error);
      return { success: false, error: result.error.message };
    }

    console.log(`✅ Record ${softDelete ? 'soft ' : ''}deleted successfully from ${tableName}`);
    return { success: true };

  } catch (err) {
    console.error('❌ Unexpected error deleting record:', err);
    return { success: false, error: err.message };
  }
};