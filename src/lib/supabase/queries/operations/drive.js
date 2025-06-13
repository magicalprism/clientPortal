// lib/supabase/queries/operations/drive.js

import { createClient } from '@/lib/supabase/browser';
import { getPostgresTimestamp } from '@/lib/utils/getPostgresTimestamp';

const supabase = createClient();

/**
 * Helper function to get the name field for a collection
 */
const getNameField = (collectionName) => {
  const nameFieldMap = {
    'company': 'title',
    'project': 'title', 
    'element': 'title'
  };
  return nameFieldMap[collectionName] || 'title';
};

/**
 * Helper function to detect if a name change occurred
 */
const detectNameChange = (config, oldRecord, newRecord) => {
  const nameField = getNameField(config.name);
  const oldName = oldRecord?.[nameField];
  const newName = newRecord?.[nameField];
  
  // Only consider it a change if both values exist and are different
  return oldName && newName && oldName !== newName;
};

/**
 * Trigger Google Drive folder creation via API
 * @param {Object} config - Collection configuration
 * @param {Object} record - The record to create folders for
 * @returns {Promise<{success: boolean, result?: Object, error?: string, message?: string}>}
 */
export const triggerDriveFolderCreation = async (config, record) => {
  // Only trigger for supported collection types
  const supportedTypes = ['company', 'project', 'element'];
  if (!supportedTypes.includes(config.name)) {
    return { success: true, message: 'Collection type not supported for Drive folders' };
  }

  // Only trigger if create_folder is true
  if (!record.create_folder) {
    return { success: true, message: 'Folder creation not enabled for this record' };
  }

  // Skip if folders already created
  if (record.drive_folder_id) {
    return { success: true, message: 'Folders already exist' };
  }

  try {
    console.log(`[triggerDriveFolderCreation] Triggering Drive folder creation for ${config.name}:`, record.id);

    const response = await fetch('/api/google-drive', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: config.name,
        payload: record
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || `HTTP ${response.status}`);
    }

    console.log(`[triggerDriveFolderCreation] Drive folders created successfully:`, result);
    return { success: true, result };

  } catch (error) {
    console.error(`[triggerDriveFolderCreation] Drive folder creation failed:`, error);
    return { success: false, error: error.message };
  }
};

/**
 * Trigger Google Drive folder rename via API
 * @param {Object} config - Collection configuration
 * @param {Object} record - The updated record
 * @param {Object} oldRecord - The original record state
 * @returns {Promise<{success: boolean, result?: Object, error?: string, message?: string}>}
 */
export const triggerDriveFolderRename = async (config, record, oldRecord) => {
  // Only trigger for supported collection types
  const supportedTypes = ['company', 'project', 'element'];
  if (!supportedTypes.includes(config.name)) {
    return { success: true, message: 'Collection type not supported for Drive folders' };
  }

  // Only rename if we have a folder ID
  if (!record.drive_folder_id) {
    return { success: true, message: 'No folder to rename' };
  }

  // Check if name actually changed
  if (!detectNameChange(config, oldRecord, record)) {
    return { success: true, message: 'No name change detected' };
  }

  try {
    const nameField = getNameField(config.name);
    const newName = record[nameField];
    const oldName = oldRecord[nameField];

    console.log(`[triggerDriveFolderRename] Triggering Drive folder rename for ${config.name}:`, {
      id: record.id,
      oldName,
      newName
    });

    const response = await fetch('/api/google-drive/rename', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: config.name,
        folderId: record.drive_folder_id,
        newName: newName,
        oldName: oldName,
        recordId: record.id
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || `HTTP ${response.status}`);
    }

    console.log(`[triggerDriveFolderRename] Drive folder renamed successfully:`, result);
    return { success: true, result };

  } catch (error) {
    console.error(`[triggerDriveFolderRename] Drive folder rename failed:`, error);
    return { success: false, error: error.message };
  }
};

/**
 * Update record with Drive folder information after successful operation
 * @param {string} tableName - The table name
 * @param {number} recordId - The record ID
 * @param {Object} driveData - Drive operation result data
 * @param {string} operation - 'create' or 'rename'
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const updateRecordWithDriveInfo = async (tableName, recordId, driveData, operation = 'create') => {
  try {
    let updateData = {
      updated_at: getPostgresTimestamp()
    };

    if (operation === 'create' && driveData.folder?.id) {
      updateData.drive_folder_id = driveData.folder.id;
      updateData.drive_original_name = driveData.folder.name;
    } else if (operation === 'rename' && driveData.newName) {
      updateData.drive_original_name = driveData.newName;
    }

    const { data, error } = await supabase
      .from(tableName)
      .update(updateData)
      .eq('id', recordId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating record with Drive info:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Record updated with Drive ${operation} info:`, updateData);
    return { success: true, data };

  } catch (err) {
    console.error('❌ Unexpected error updating record with Drive info:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Handle complete Drive folder operation (create or rename) with database update
 * @param {Object} config - Collection configuration
 * @param {Object} record - The record data
 * @param {Object} originalRecord - Original record state (for rename detection)
 * @returns {Promise<{success: boolean, operation?: string, result?: Object, error?: string}>}
 */
export const handleDriveOperation = async (config, record, originalRecord = null) => {
  try {
    let driveResult;
    let operation;

    // Determine if we need to rename existing folder or create new one
    if (record.drive_folder_id && originalRecord && detectNameChange(config, originalRecord, record)) {
      operation = 'rename';
      driveResult = await triggerDriveFolderRename(config, record, originalRecord);
    } else if (record.create_folder && !record.drive_folder_id) {
      operation = 'create';
      driveResult = await triggerDriveFolderCreation(config, record);
    } else {
      return { success: true, operation: 'none', message: 'No Drive operation needed' };
    }

    if (!driveResult.success) {
      return { success: false, operation, error: driveResult.error };
    }

    // Update the database record with Drive info if we have a successful result
    if (driveResult.result && record.id) {
      const updateResult = await updateRecordWithDriveInfo(
        config.name, 
        record.id, 
        driveResult.result, 
        operation
      );

      if (!updateResult.success) {
        console.warn('Drive operation succeeded but failed to update database:', updateResult.error);
        // Don't fail the whole operation for this
      }

      return { 
        success: true, 
        operation, 
        result: driveResult.result,
        updatedRecord: updateResult.data 
      };
    }

    return { success: true, operation, result: driveResult.result };

  } catch (err) {
    console.error('❌ Unexpected error in Drive operation:', err);
    return { success: false, error: err.message };
  }
};