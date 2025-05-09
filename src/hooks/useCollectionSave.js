'use client';

import { useState, useEffect, useRef } from 'react';
import { getPostgresTimestamp } from '@/lib/utils/getPostgresTimestamp';
import { createClient } from '@/lib/supabase/browser';

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
    if (JSON.stringify(currentValue) === JSON.stringify(newValue)) return;

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
    const payload = Object.fromEntries(
      Object.entries(record).filter(([key]) => validFieldNames.includes(key))
    );

    payload.updated_at = getPostgresTimestamp();

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
