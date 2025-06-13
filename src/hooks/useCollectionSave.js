// hooks/useCollectionSave.js (Updated with better error handling)

'use client';

import { useState, useEffect, useRef } from 'react';
import { getPostgresTimestamp } from '@/lib/utils/getPostgresTimestamp';
import { normalizeMultiRelationshipValue } from '@/lib/utils/filters/listfilters/normalizeMultiRelationshipValue';

// Helper function to extract value from select field objects
const extractSelectValue = (value) => {
  if (value === null || value === undefined) return value;
  
  if (typeof value === 'object' && value !== null && 'value' in value) {
    return value.value;
  }
  
  return value;
};

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

  const isCreateMode = mode === 'create';
  const lastRecordIdRef = useRef(record?.id);
  const originalRecordRef = useRef(record);

  const [editingField, setEditingField] = useState(null);
  const [tempValue, setTempValue] = useState('');
  const [loadingField, setLoadingField] = useState(null);
  const [hasChanges, setHasChanges] = useState(false); 
  const [isSaving, setIsSaving] = useState(false);
  const [dirtyFields] = useState(new Set());
  const [multiRelChanges, setMultiRelChanges] = useState({});
  const [mediaFieldsChanged, setMediaFieldsChanged] = useState(new Set());
  const [driveOperationStatus, setDriveOperationStatus] = useState(null);

  // ✅ NEW: Dynamic operation loading with fallbacks
  const [operations, setOperations] = useState({
    recordOps: null,
    multiRelOps: null,
    driveOps: null
  });

  const suppressAutosaveRef = useRef(isCreateMode || !record?.id);

  // ✅ Load operations dynamically
  useEffect(() => {
    const loadOperations = async () => {
      try {
        const { recordOps, multiRelOps, driveOps } = await import('@/lib/supabase/queries');
        
        setOperations({
          recordOps: recordOps || null,
          multiRelOps: multiRelOps || null,
          driveOps: driveOps || null
        });
        
        console.log('[useCollectionSave] Operations loaded:', {
          recordOps: !!recordOps,
          multiRelOps: !!multiRelOps,
          driveOps: !!driveOps
        });
        
      } catch (err) {
        console.warn('[useCollectionSave] Could not load operations:', err);
        setOperations({
          recordOps: null,
          multiRelOps: null,
          driveOps: null
        });
      }
    };
    
    loadOperations();
  }, []);

  useEffect(() => {
    if (!isCreateMode && typeof record?.id === 'number' && suppressAutosaveRef.current) {
      suppressAutosaveRef.current = false;
    }
  }, [isCreateMode, record?.id]);

  useEffect(() => {
    if (record?.id !== lastRecordIdRef.current) {
      lastRecordIdRef.current = record?.id;
      originalRecordRef.current = { ...record };
      setHasChanges(false);
      setMultiRelChanges({});
      setMediaFieldsChanged(new Set());
      setDriveOperationStatus(null);
    }
  }, [record?.id]);

  useEffect(() => {
    if (!hasChanges) {
      originalRecordRef.current = { ...record };
    }
  }, [record, hasChanges]);

  const updateLocalValue = (fieldName, newValue) => {
    if (suppressAutosaveRef.current) return;

    const currentValue = record?.[fieldName];
    const fieldDef = config.fields.find(f => f.name === fieldName);
    if (!fieldDef) return;

    // Handle media fields
    if (fieldDef.type === 'media') {
      console.log(`[useCollectionSave] Media field update: ${fieldName}`, newValue);
      
      let cleanValue = newValue;
      if (newValue && typeof newValue === 'object' && newValue._forceChange) {
        const { _forceChange, ...rest } = newValue;
        cleanValue = rest;
      }
      
      setRecord(prev => ({
        ...prev,
        [fieldName]: cleanValue,
        ...(prev && 'updated_at' in prev ? { updated_at: getPostgresTimestamp() } : {})
      }));
      
      setMediaFieldsChanged(prev => new Set([...prev, fieldName]));
      setHasChanges(true);
      return;
    }

    // Handle multiRelationship fields
    if (fieldDef.type === 'multiRelationship') {
      let currentIds = normalizeMultiRelationshipValue(currentValue);
      let newIds;
      let newDetails = [];
      
      if (typeof newValue === 'object' && newValue !== null && Array.isArray(newValue.ids)) {
        newIds = newValue.ids.map(String);
        newDetails = newValue.details || [];
      } else {
        newIds = normalizeMultiRelationshipValue(newValue);
      }
      
      const currentSet = new Set(currentIds);
      const newSet = new Set(newIds);
      
      const hasChanged = 
        currentSet.size !== newSet.size || 
        newIds.some(id => !currentSet.has(id));
      
      if (!hasChanged) {
        return;
      }

      setRecord(prev => ({
        ...prev,
        [fieldName]: newIds,
        ...(newDetails.length > 0 ? { [`${fieldName}_details`]: newDetails } : {}),
        ...(prev && 'updated_at' in prev ? { updated_at: getPostgresTimestamp() } : {})
      }));
      
      setHasChanges(true);
      return;
    }

    // Handle other field types
    let valueChanged = false;
    
    if (fieldDef.type === 'select' || fieldDef.type === 'status') {
      const currentExtracted = extractSelectValue(currentValue);
      const newExtracted = extractSelectValue(newValue);
      valueChanged = currentExtracted !== newExtracted;
    } else {
      valueChanged = JSON.stringify(currentValue) !== JSON.stringify(newValue);
    }

    if (!valueChanged) return;

    setRecord(prev => ({
      ...prev,
      [fieldName]: newValue,
      ...(prev && 'updated_at' in prev ? { updated_at: getPostgresTimestamp() } : {})
    }));

    dirtyFields.add(fieldName);
    setHasChanges(true);
  };

  // ✅ UPDATED: Save record with fallback methods
  const saveRecord = async () => {
    let shouldSave = hasChanges || dirtyFields.size > 0 || mediaFieldsChanged.size > 0;

    if (!shouldSave) {
      console.log(`[useCollectionSave] Nothing to save`);
      return false;
    }

    console.log(`[useCollectionSave] Starting save process...`);
    setIsSaving(true);
    setDriveOperationStatus(null);
    
    try {
      const recordBeforeSave = { ...record };
      
      // Step 1: Save the main record
      let updateResult;
      
      if (operations.recordOps?.updateRecord) {
        // Use extracted operation if available
        updateResult = await operations.recordOps.updateRecord(
          config.name, 
          record.id, 
          record, 
          config
        );
      } else {
        // Fallback to direct Supabase call
        console.log('[useCollectionSave] Using fallback record update method');
        updateResult = await fallbackUpdateRecord(config.name, record.id, record, config);
      }

      if (!updateResult.success) {
        console.error('❌ Error saving main record:', updateResult.error);
        setIsSaving(false);
        return false;
      }
      
      // Step 2: Save multirelationship fields
      let multiRelResult = { success: true, errors: [] };
      
      if (operations.multiRelOps?.saveAllMultiRelationshipFields) {
        multiRelResult = await operations.multiRelOps.saveAllMultiRelationshipFields(
          config.name, 
          record.id, 
          record, 
          config
        );
      } else {
        console.log('[useCollectionSave] Multi-relationship operations not available, skipping');
      }

      if (!multiRelResult.success) {
        console.warn('⚠️ Some multi-relationship fields failed to save:', multiRelResult.errors);
      }

      // Step 3: Handle Google Drive folder operations
      let driveResult = { success: true, operation: 'none' };
      
      if (operations.driveOps?.handleDriveOperation) {
        driveResult = await operations.driveOps.handleDriveOperation(
          config, 
          recordBeforeSave, 
          originalRecordRef.current
        );
      } else {
        console.log('[useCollectionSave] Drive operations not available, skipping');
      }
      
      if (driveResult.success) {
        setDriveOperationStatus('completed');
        
        if (driveResult.updatedRecord) {
          setRecord(prev => ({
            ...prev,
            ...driveResult.updatedRecord
          }));
        }
      } else {
        setDriveOperationStatus('failed');
        console.warn('⚠️ Drive operation failed:', driveResult.error);
      }
      
      // Clear state
      setMultiRelChanges({});
      setHasChanges(false);
      setMediaFieldsChanged(new Set());
      setIsSaving(false);
      
      // Update original record ref
      originalRecordRef.current = { ...recordBeforeSave };
      
      console.log(`[useCollectionSave] ✅ Save completed successfully`);
      return true;
      
    } catch (err) {
      console.error('[useCollectionSave] ❌ Unexpected error saving record:', err);
      setIsSaving(false);
      setDriveOperationStatus('failed');
      return false;
    }
  };

  // ✅ FALLBACK: Direct Supabase update when operations not available
  const fallbackUpdateRecord = async (tableName, recordId, recordData, config) => {
    try {
      const { createClient } = await import('@/lib/supabase/browser');
      const supabase = createClient();
      
      console.log(`[useCollectionSave] Fallback: Updating ${tableName} record ${recordId}`);
      
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
        console.error(`[useCollectionSave] Fallback error updating ${tableName}:`, error);
        return { success: false, error: error.message, data: null };
      }

      console.log(`[useCollectionSave] Fallback: Successfully updated ${tableName} record`);
      return { success: true, error: null, data };

    } catch (err) {
      console.error(`[useCollectionSave] Fallback: Unexpected error:`, err);
      return { success: false, error: err.message, data: null };
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
    // Expose for debugging
    dirtyFields,
    multiRelChanges,
    mediaFieldsChanged,
    originalRecord: originalRecordRef.current,
    operations, // Expose loaded operations
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