// lib/supabase/queries/table/record.js

import { createClient } from '@/lib/supabase/browser';
import { getPostgresTimestamp } from '@/lib/utils/getPostgresTimestamp';

const supabase = createClient();

/**
 * Update a record in any table using standardized operations
 */
export const updateRecord = async (tableName, recordId, recordData, config) => {
  try {
    console.log(`[recordOps.updateRecord] Updating ${tableName} record ${recordId}`);
    
    // Prepare update payload
    const updatePayload = {
      ...recordData,
      updated_at: getPostgresTimestamp()
    };

    // Remove system fields that shouldn't be updated directly
    const { id, created_at, ...cleanPayload } = updatePayload;

    // Ensure proper data types based on config
    if (config?.fields) {
      config.fields.forEach(field => {
        if (cleanPayload[field.name] !== undefined && cleanPayload[field.name] !== '') {
          if (field.name.endsWith('_id') || field.type === 'integer') {
            cleanPayload[field.name] = parseInt(cleanPayload[field.name], 10);
          } else if (field.type === 'boolean') {
            cleanPayload[field.name] = Boolean(cleanPayload[field.name]);
          }
        }
      });
    }

    const { data, error } = await supabase
      .from(tableName)
      .update(cleanPayload)
      .eq('id', recordId)
      .select()
      .single();

    if (error) {
      console.error(`[recordOps.updateRecord] Error updating ${tableName}:`, error);
      return { success: false, error: error.message, data: null };
    }

    console.log(`[recordOps.updateRecord] Successfully updated ${tableName} record`);
    return { success: true, error: null, data };

  } catch (err) {
    console.error(`[recordOps.updateRecord] Unexpected error:`, err);
    return { success: false, error: err.message, data: null };
  }
};

/**
 * Create a record in any table using standardized operations
 */
export const createRecord = async (tableName, recordData, config) => {
  try {
    console.log(`[recordOps.createRecord] Creating ${tableName} record`);
    
    const now = getPostgresTimestamp();
    
    // Prepare insert payload
    const insertPayload = {
      ...recordData,
      created_at: now,
      updated_at: now
    };

    // Remove id if present (let database generate it)
    delete insertPayload.id;

    // Ensure proper data types based on config
    if (config?.fields) {
      config.fields.forEach(field => {
        if (insertPayload[field.name] !== undefined && insertPayload[field.name] !== '') {
          if (field.name.endsWith('_id') || field.type === 'integer') {
            insertPayload[field.name] = parseInt(insertPayload[field.name], 10);
          } else if (field.type === 'boolean') {
            insertPayload[field.name] = Boolean(insertPayload[field.name]);
          }
        }
      });
    }

    const { data, error } = await supabase
      .from(tableName)
      .insert([insertPayload])
      .select()
      .single();

    if (error) {
      console.error(`[recordOps.createRecord] Error creating ${tableName}:`, error);
      return { success: false, error: error.message, data: null };
    }

    console.log(`[recordOps.createRecord] Successfully created ${tableName} record`);
    return { success: true, error: null, data };

  } catch (err) {
    console.error(`[recordOps.createRecord] Unexpected error:`, err);
    return { success: false, error: err.message, data: null };
  }
};

/**
 * Delete a record (soft delete if is_deleted field exists)
 */
export const deleteRecord = async (tableName, recordId, config) => {
  try {
    console.log(`[recordOps.deleteRecord] Deleting ${tableName} record ${recordId}`);
    
    // Check if table supports soft delete
    const hasIsDeleted = config?.fields?.some(f => f.name === 'is_deleted');
    
    if (hasIsDeleted) {
      // Soft delete
      const { data, error } = await supabase
        .from(tableName)
        .update({
          is_deleted: true,
          deleted_at: getPostgresTimestamp(),
          updated_at: getPostgresTimestamp()
        })
        .eq('id', recordId)
        .select()
        .single();

      if (error) {
        console.error(`[recordOps.deleteRecord] Error soft deleting ${tableName}:`, error);
        return { success: false, error: error.message, data: null };
      }

      console.log(`[recordOps.deleteRecord] Successfully soft deleted ${tableName} record`);
      return { success: true, error: null, data };
    } else {
      // Hard delete
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', recordId);

      if (error) {
        console.error(`[recordOps.deleteRecord] Error hard deleting ${tableName}:`, error);
        return { success: false, error: error.message, data: null };
      }

      console.log(`[recordOps.deleteRecord] Successfully hard deleted ${tableName} record`);
      return { success: true, error: null, data: { id: recordId } };
    }

  } catch (err) {
    console.error(`[recordOps.deleteRecord] Unexpected error:`, err);
    return { success: false, error: err.message, data: null };
  }
};