'use client';

import { useState, useEffect, useRef } from 'react';
import { getPostgresTimestamp } from '@/lib/utils/getPostgresTimestamp';
import { createClient } from '@/lib/supabase/browser';
import { normalizeMultiRelationshipValue } from '@/lib/utils/filters/listfilters/normalizeMultiRelationshipValue';

// Helper function to extract value from select field objects
const extractSelectValue = (value) => {
  if (value === null || value === undefined) return value;
  
  // Handle object with value property (e.g., {value: 'todo', label: 'To Do'})
  if (typeof value === 'object' && value !== null && 'value' in value) {
    return value.value;
  }
  
  return value;
};

// Helper function to get the name field for a collection
const getNameField = (collectionName) => {
  const nameFieldMap = {
    'company': 'title',
    'project': 'title', 
    'element': 'title'
  };
  return nameFieldMap[collectionName] || 'title';
};

// Helper function to detect if a name change occurred
const detectNameChange = (config, oldRecord, newRecord) => {
  const nameField = getNameField(config.name);
  const oldName = oldRecord?.[nameField];
  const newName = newRecord?.[nameField];
  
  // Only consider it a change if both values exist and are different
  return oldName && newName && oldName !== newName;
};

// Helper function to trigger Google Drive folder creation
const triggerDriveFolderCreation = async (config, record) => {
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
    console.log(`[useCollectionSave] Triggering Drive folder creation for ${config.name}:`, record.id);

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

    console.log(`[useCollectionSave] Drive folders created successfully:`, result);
    return { success: true, result };

  } catch (error) {
    console.error(`[useCollectionSave] Drive folder creation failed:`, error);
    return { success: false, error: error.message };
  }
};

// Helper function to trigger Google Drive folder rename
const triggerDriveFolderRename = async (config, record, oldRecord) => {
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

    console.log(`[useCollectionSave] Triggering Drive folder rename for ${config.name}:`, {
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

    console.log(`[useCollectionSave] Drive folder renamed successfully:`, result);
    return { success: true, result };

  } catch (error) {
    console.error(`[useCollectionSave] Drive folder rename failed:`, error);
    return { success: false, error: error.message };
  }
};

// ENHANCED: useCollectionSave with rename detection and handling
export const useCollectionSave = ({ config, record, setRecord, startEdit, mode = 'edit' }) => {
  if (!record) {
    return {
      updateLocalValue: () => {},
      saveRecord: () => {},
      editingField: null,
      setEditingField: () => {},
      tempValue: '',
      setTempValue: () => {},
      loadingField: null,
      startEdit: () => {},
      hasChanges: false,
      setHasChanges: () => {},
    };
  }

  const supabase = createClient();
  const isCreateMode = mode === 'create';
  const lastRecordIdRef = useRef(record?.id);
  const originalRecordRef = useRef(record); // Track original record for rename detection

  const [editingField, setEditingField] = useState(null);
  const [tempValue, setTempValue] = useState('');
  const [loadingField, setLoadingField] = useState(null);
  const [hasChanges, setHasChanges] = useState(false); 
  const [isSaving, setIsSaving] = useState(false);
  const [dirtyFields] = useState(new Set()); // Track which fields have changed
  const [multiRelChanges, setMultiRelChanges] = useState({}); // Track multi-relationship changes
  const [mediaFieldsChanged, setMediaFieldsChanged] = useState(new Set()); // Track media field changes
  const [driveOperationStatus, setDriveOperationStatus] = useState(null); // Track Drive operations

  const suppressAutosaveRef = useRef(isCreateMode || !record?.id);

  useEffect(() => {
    if (!isCreateMode && typeof record?.id === 'number' && suppressAutosaveRef.current) {
      suppressAutosaveRef.current = false;
    }
  }, [isCreateMode, record?.id]);

  useEffect(() => {
    if (record?.id !== lastRecordIdRef.current) {
      lastRecordIdRef.current = record?.id;
      originalRecordRef.current = { ...record }; // Store original state
      setHasChanges(false);
      setMultiRelChanges({});
      setMediaFieldsChanged(new Set());
      setDriveOperationStatus(null);
    }
  }, [record?.id]);

  // Update original record ref when record changes (but preserve for rename detection)
  useEffect(() => {
    if (!hasChanges) {
      originalRecordRef.current = { ...record };
    }
  }, [record, hasChanges]);

  const updateLocalValue = (fieldName, newValue) => {
    if (suppressAutosaveRef.current) return;

    const currentValue = record?.[fieldName];
    
    // Find field definition
    const fieldDef = config.fields.find(f => f.name === fieldName);
    if (!fieldDef) return;

    // Special handling for media fields
    if (fieldDef.type === 'media') {
      console.log(`[useCollectionSave] Media field update: ${fieldName}`, newValue);
      
      // Clean the value by removing force change markers
      let cleanValue = newValue;
      if (newValue && typeof newValue === 'object' && newValue._forceChange) {
        const { _forceChange, ...rest } = newValue;
        cleanValue = rest;
        console.log(`[useCollectionSave] Removed force change marker from ${fieldName}`);
      }
      
      // Update the record
      setRecord(prev => ({
        ...prev,
        [fieldName]: cleanValue,
        ...(prev && 'updated_at' in prev ? { updated_at: getPostgresTimestamp() } : {})
      }));
      
      // Track that this media field was changed
      setMediaFieldsChanged(prev => new Set([...prev, fieldName]));
      setHasChanges(true);
      return;
    }

    // Special handling for multiRelationship fields
    if (fieldDef.type === 'multiRelationship') {
      // Extract IDs from current and new values
      let currentIds = normalizeMultiRelationshipValue(currentValue);
      let newIds;
      let newDetails = [];
      
      // Handle different input formats
      if (typeof newValue === 'object' && newValue !== null && Array.isArray(newValue.ids)) {
        newIds = newValue.ids.map(String);
        newDetails = newValue.details || [];
      } else {
        newIds = normalizeMultiRelationshipValue(newValue);
      }
      
      // Compare arrays (order doesn't matter for multi-relationship)
      const currentSet = new Set(currentIds);
      const newSet = new Set(newIds);
      
      // Check if different
      const hasChanged = 
        currentSet.size !== newSet.size || 
        newIds.some(id => !currentSet.has(id));
      
      // If nothing changed, don't trigger a re-render
      if (!hasChanged) {
        return;
      }

      // Update the record with both IDs and details
      setRecord(prev => ({
        ...prev,
        [fieldName]: newIds,
        ...(newDetails.length > 0 ? { [`${fieldName}_details`]: newDetails } : {}),
        ...(prev && 'updated_at' in prev ? { updated_at: getPostgresTimestamp() } : {})
      }));
      
      // Set hasChanges to activate the save button
      setHasChanges(true);
      return;
    }

    // For other field types
    let valueChanged = false;
    
    if (fieldDef.type === 'select' || fieldDef.type === 'status') {
      const currentExtracted = extractSelectValue(currentValue);
      const newExtracted = extractSelectValue(newValue);
      valueChanged = currentExtracted !== newExtracted;
    } else {
      // Check if values are different (simple comparison)
      valueChanged = JSON.stringify(currentValue) !== JSON.stringify(newValue);
    }

    if (!valueChanged) return;

    // Update the record with the new value
    setRecord(prev => ({
      ...prev,
      [fieldName]: newValue,
      ...(prev && 'updated_at' in prev ? { updated_at: getPostgresTimestamp() } : {})
    }));

    dirtyFields.add(fieldName);
    setHasChanges(true);
  };

  const saveRecord = async () => {
    // Find all multiRelationship fields in the config
    const multiRelFields = config.fields
      .filter(f => f.type === 'multiRelationship')
      .map(f => f.name);
    
    // Find all media fields in the config  
    const mediaFields = config.fields
      .filter(f => f.type === 'media')
      .map(f => f.name);

    // Check if we should save
    let shouldSave = hasChanges || dirtyFields.size > 0;

    // If there are no typical changes, but we have multirelationship fields, proceed anyway
    if (!shouldSave && multiRelFields.length > 0) {
      shouldSave = true; // Force save for multi-rel
    }
    
    // If media fields were changed, also proceed with save
    if (!shouldSave && mediaFieldsChanged.size > 0) {
      console.log(`[useCollectionSave] Proceeding with save due to media field changes:`, Array.from(mediaFieldsChanged));
      shouldSave = true;
    }

    if (!shouldSave) {
      console.log(`[useCollectionSave] Nothing to save`);
      return false;
    }

    console.log(`[useCollectionSave] Starting save process...`);
    setIsSaving(true);
    setDriveOperationStatus(null);
    
    try {
      // Store the current record state for rename detection
      const recordBeforeSave = { ...record };
      
      // Only include fields defined in the config for the update payload
      const dbFieldNames = config.fields
        .filter((f) => f.database !== false)
        .map((f) => f.name);

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

      // Step 1: Save the main record (only if there are actual changes or media updates)
      const { error } = await supabase
        .from(config.name)
        .update(payload)
        .eq('id', record.id);

      if (error) {
        console.error('❌ Error saving record:', error);
        setIsSaving(false);
        return false;
      }
      
      // Step 2: Save multirelationship fields separately
      let allMultiSaved = true;
      
      for (const fieldName of multiRelFields) {
        const fieldDef = config.fields.find(f => f.name === fieldName);
        
        if (!fieldDef?.relation?.junctionTable && fieldDef?.relation?.isOneToMany) {
          // Handle One-to-Many save
          const table = fieldDef.relation.table;
          const oneToManyTargetKey = fieldDef.relation.targetKey || `${config.name}_id`;
          const newIds = normalizeMultiRelationshipValue(record[fieldName]);

          const { data: existingChildren, error: existingError } = await supabase
            .from(table)
            .select('id')
            .eq(oneToManyTargetKey, record.id);

          if (existingError) {
            allMultiSaved = false;
            continue;
          }

          const existingIds = (existingChildren || []).map(c => String(c.id));
          const toRemove = existingIds.filter(id => !newIds.includes(id));
          const toAdd = newIds.filter(id => !existingIds.includes(id));

          for (const id of toRemove) {
            const { error: clearError } = await supabase
              .from(table)
              .update({ [oneToManyTargetKey]: null })
              .eq('id', id);

            if (clearError) {
              allMultiSaved = false;
            }
          }

          for (const id of toAdd) {
            const { error: setError } = await supabase
              .from(table)
              .update({ [oneToManyTargetKey]: record.id })
              .eq('id', id);

            if (setError) {
              allMultiSaved = false;
            }
          }

          continue;
        }
        
        // Handle Many-to-Many relationships
        const { 
          junctionTable, 
          sourceKey = `${config.name}_id`, 
          targetKey = `${fieldDef.relation.table}_id` 
        } = fieldDef.relation;
        
        try {
          let fieldValue = record[fieldName];
          let normalizedIds = normalizeMultiRelationshipValue(fieldValue);
          
          // Get existing relationships
          const { data: existingRels, error: fetchError } = await supabase
            .from(junctionTable)
            .select(targetKey)
            .eq(sourceKey, record.id);
            
          if (fetchError) {
            allMultiSaved = false;
            continue;
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
              [sourceKey]: record.id,
              [targetKey]: id
            }));
            
            const { error: insertError } = await supabase
              .from(junctionTable)
              .insert(insertData);
              
            if (insertError) {
              console.error(`[useCollectionSave] Error adding ${fieldName}:`, insertError);
              allMultiSaved = false;
            }
          }
          
          // Remove relationships
          for (const id of toRemove) {
            const { error: deleteError } = await supabase
              .from(junctionTable)
              .delete()
              .match({
                [sourceKey]: record.id,
                [targetKey]: id
              });
              
            if (deleteError) {
              console.error(`[useCollectionSave] Error removing ${fieldName} item:`, deleteError);
              allMultiSaved = false;
            }
          }
        } catch (err) {
          console.error(`[useCollectionSave] Error processing ${fieldName}:`, err);
          allMultiSaved = false;
        }
      }

      // Step 3: Handle Google Drive folder operations
      let driveResult = { success: true, message: 'No Drive operation needed' };
      
      // First check if we need to rename an existing folder
      if (record.drive_folder_id && detectNameChange(config, originalRecordRef.current, recordBeforeSave)) {
        setDriveOperationStatus('renaming');
        console.log('[useCollectionSave] Name change detected, triggering rename');
        driveResult = await triggerDriveFolderRename(config, recordBeforeSave, originalRecordRef.current);
        
        if (driveResult.success) {
          // Update the original name tracking
          const nameField = getNameField(config.name);
          const driveUpdateData = {
            drive_original_name: recordBeforeSave[nameField],
            updated_at: getPostgresTimestamp()
          };

          const { error: driveUpdateError } = await supabase
            .from(config.name)
            .update(driveUpdateData)
            .eq('id', record.id);

          if (!driveUpdateError) {
            setRecord(prev => ({
              ...prev,
              ...driveUpdateData
            }));
          }
        }
      }
      // Otherwise check if we need to create new folders
      else if (record.create_folder && !record.drive_folder_id) {
        setDriveOperationStatus('creating');
        driveResult = await triggerDriveFolderCreation(config, recordBeforeSave);
        
        if (driveResult.success && driveResult.result?.folder?.id) {
          // Update record with drive folder ID and original name
          const nameField = getNameField(config.name);
          const driveUpdateData = {
            drive_folder_id: driveResult.result.folder.id,
            drive_original_name: recordBeforeSave[nameField],
            updated_at: getPostgresTimestamp()
          };

          const { error: driveUpdateError } = await supabase
            .from(config.name)
            .update(driveUpdateData)
            .eq('id', record.id);

          if (!driveUpdateError) {
            setRecord(prev => ({
              ...prev,
              ...driveUpdateData
            }));
          }
        }
      }
      
      // Clear state
      setMultiRelChanges({});
      setHasChanges(false);
      setMediaFieldsChanged(new Set());
      setIsSaving(false);
      setDriveOperationStatus(driveResult.success ? 'completed' : 'failed');
      
      // Update original record ref with the saved state
      originalRecordRef.current = { ...recordBeforeSave };
      
      console.log(`[useCollectionSave] ✅ Save completed. Multi fields success: ${allMultiSaved}, Drive operation: ${driveResult.success ? 'success' : driveResult.error}`);
      return true;
    } catch (err) {
      console.error('[useCollectionSave] ❌ Unexpected error saving record:', err);
      setIsSaving(false);
      setDriveOperationStatus('failed');
      return false;
    }
  };

  return {
    editingField,
    setEditingField,
    tempValue,
    setTempValue,
    updateLocalValue,
    saveRecord,
    loadingField,
    startEdit,
    hasChanges,
    setHasChanges,
    isSaving,
    driveOperationStatus,
    // Expose for debugging and rename detection
    dirtyFields,
    multiRelChanges,
    mediaFieldsChanged,
    originalRecord: originalRecordRef.current,
    nameChangeDetected: detectNameChange(config, originalRecordRef.current, record),
    forceAddMultiChange: (fieldName) => {
      if (!fieldName) return;
      
      setMultiRelChanges(prev => ({
        ...prev,
        [fieldName]: {
          value: record[fieldName],
          timestamp: new Date().toISOString(),
          forced: true
        }
      }));
      
      setHasChanges(true);
    }
  };
};