'use client';

import { useState, useEffect, useRef } from 'react';
import { getPostgresTimestamp } from '@/lib/utils/getPostgresTimestamp';
import { createClient } from '@/lib/supabase/browser';

// Helper function to extract value from select field objects
const extractSelectValue = (value) => {
  if (value === null || value === undefined) return value;
  
  // Handle object with value property (e.g., {value: 'todo', label: 'To Do'})
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
    };
  }

  const supabase = createClient();
  const isCreateMode = mode === 'create';
  const lastRecordIdRef = useRef(record?.id);

  const [editingField, setEditingField] = useState(null);
  const [tempValue, setTempValue] = useState('');
  const [loadingField, setLoadingField] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  const suppressAutosaveRef = useRef(isCreateMode || !record?.id);

  useEffect(() => {
    if (!isCreateMode && typeof record?.id === 'number' && suppressAutosaveRef.current) {
      suppressAutosaveRef.current = false;
    }
  }, [isCreateMode, record?.id]);

  useEffect(() => {
    if (record?.id !== lastRecordIdRef.current) {
      lastRecordIdRef.current = record?.id;
      setHasChanges(false);
    }
  }, [record?.id, hasChanges]);

  const updateLocalValue = (fieldName, newValue) => {
    if (suppressAutosaveRef.current) return;

    const currentValue = record?.[fieldName];
    
    // Compare values properly, handling objects
    const isEqual = () => {
      // Handle objects with value property
      if (
        typeof currentValue === 'object' && 
        currentValue !== null && 
        typeof newValue === 'object' && 
        newValue !== null
      ) {
        // If both have value property, compare that
        if ('value' in currentValue && 'value' in newValue) {
          return currentValue.value === newValue.value;
        }
      }
      
      // Default to JSON string comparison
      return JSON.stringify(currentValue) === JSON.stringify(newValue);
    };
    
    if (isEqual()) return;

    console.log(`[useCollectionSave] Updating ${fieldName}:`, {
      from: currentValue,
      to: newValue
    });

    setRecord((prev) => ({
      ...prev,
      [fieldName]: newValue,
      ...(prev && 'updated_at' in prev ? { updated_at: getPostgresTimestamp() } : {}),
    }));

    setHasChanges(true);
  };

  const saveRecord = async () => {
    if (!record?.id || typeof record.id !== 'number' || !hasChanges) return;

    // Only include fields defined in the config for the update payload
    const validFieldNames = config.fields.map((f) => f.name);
    
    // Create a processed payload
    const payload = {};
    
    Object.entries(record).forEach(([key, value]) => {
      // Only include fields defined in the config
      if (!validFieldNames.includes(key)) return;
      
      // Find the field definition
      const fieldDef = config.fields.find(f => f.name === key);
      
      // Process special field types
      if (fieldDef && (fieldDef.type === 'select' || fieldDef.type === 'status')) {
        // Extract raw value for select fields
        payload[key] = extractSelectValue(value);
        
        console.log(`[useCollectionSave] Processing ${key} for save:`, {
          original: value,
          forDb: payload[key]
        });
      } else {
        // Default handling for other fields
        payload[key] = value;
      }
    });

    payload.updated_at = getPostgresTimestamp();
    
    console.log('[useCollectionSave] Saving payload:', payload);

    const { error } = await supabase
      .from(config.name)
      .update(payload)
      .eq('id', record.id);

    if (error) {
      console.error('❌ Error saving record:', error);
    } else {
      setHasChanges(false);
      console.debug('✅ Record saved successfully.');
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
  };
};