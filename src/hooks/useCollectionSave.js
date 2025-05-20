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

// IMPORTANT: This is a simplified version focused on fixing multi-relationship saving
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

  const [editingField, setEditingField] = useState(null);
  const [tempValue, setTempValue] = useState('');
  const [loadingField, setLoadingField] = useState(null);
  const [hasChanges, setHasChanges] = useState(false); 
  const [isSaving, setIsSaving] = useState(false);
  const [dirtyFields] = useState(new Set()); // Track which fields have changed
  const [multiRelChanges, setMultiRelChanges] = useState({}); // Track multi-relationship changes

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
      setMultiRelChanges({});
    }
  }, [record?.id]);

  const updateLocalValue = (fieldName, newValue) => {
  if (suppressAutosaveRef.current) return;

  const currentValue = record?.[fieldName];
  
  // Find field definition
  const fieldDef = config.fields.find(f => f.name === fieldName);
  if (!fieldDef) return;

  // Special handling for multiRelationship fields
  if (fieldDef.type === 'multiRelationship') {
    console.log(`[useCollectionSave] Multi field ${fieldName} update:`, {
      current: currentValue,
      new: newValue
    });

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
      console.log(`[useCollectionSave] No change detected for ${fieldName}`);
      return;
    }
    
    console.log(`[useCollectionSave] Change detected for ${fieldName}:`, {
      from: currentIds,
      to: newIds,
      detailsCount: newDetails.length
    });

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
    if (!record?.id || typeof record.id !== 'number' || isSaving) return false;

    // Even if hasChanges is false, always process when multiRelChanges has entries
    if (!hasChanges && Object.keys(multiRelChanges).length === 0) {
      console.log('[useCollectionSave] No changes to save');
      return false;
    }

    // Log current state before saving
    console.log('Saving record:', record);
    console.log('Fields marked for saving:', [...dirtyFields]);
    console.log('Multi fields in config:', config.fields
      .filter(f => f.type === 'multiRelationship')
      .map(f => f.name));
    console.log('Multi field changes:', multiRelChanges);

    setIsSaving(true);
    
    // Only include fields defined in the config for the update payload
    const dbFieldNames = config.fields
      .filter((f) => f.database !== false)
      .map((f) => f.name);

    // Find all multiRelationship fields in the config
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
    
    console.log('[useCollectionSave] Saving payload:', payload);

    try {
      // Step 1: Save the main record
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
      // This is the key part that was likely missing before
      // We'll save ALL multi-relationship fields that are in the config
      // regardless of whether they're marked as "dirty"
      let allMultiSaved = true;
      
      for (const fieldName of multiRelFields) {
        // Get the field definition
        const fieldDef = config.fields.find(f => f.name === fieldName);
        if (!fieldDef?.relation?.junctionTable) continue;
        
        const { 
          junctionTable, 
          sourceKey = `${config.name}_id`, 
          targetKey = `${fieldDef.relation.table}_id` 
        } = fieldDef.relation;
        
        try {
          // Get the value - handle various formats
          let fieldValue = record[fieldName];
          let normalizedIds = normalizeMultiRelationshipValue(fieldValue);
          
          console.log(`[useCollectionSave] Saving ${fieldName}:`, {
            value: fieldValue,
            normalizedIds
          });
          
          // 1. Get existing relationships
          const { data: existingRels, error: fetchError } = await supabase
            .from(junctionTable)
            .select(targetKey)
            .eq(sourceKey, record.id);
            
          if (fetchError) {
            console.error(`[useCollectionSave] Error fetching existing ${fieldName}:`, fetchError);
            allMultiSaved = false;
            continue;
          }
          
          // 2. Extract existing IDs
          const existingIds = (existingRels || [])
            .map(rel => String(rel[targetKey]))
            .filter(Boolean);
            
          console.log(`[useCollectionSave] Existing ${fieldName}:`, existingIds);
          
          // 3. Calculate additions and removals
          const toAdd = normalizedIds.filter(id => !existingIds.includes(String(id)));
          const toRemove = existingIds.filter(id => !normalizedIds.includes(String(id)));
          
          console.log(`[useCollectionSave] Changes for ${fieldName}:`, {
            toAdd,
            toRemove
          });
          
          // 4. Add new relationships
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
          
          // 5. Remove relationships
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
      
      // Clear state
      setMultiRelChanges({});
      setHasChanges(false);
      setIsSaving(false);
      
      console.log(`[useCollectionSave] ✅ Save completed. Multi fields success: ${allMultiSaved}`);
      return true;
    } catch (err) {
      console.error('[useCollectionSave] ❌ Unexpected error saving record:', err);
      setIsSaving(false);
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
    // Expose for debugging
    dirtyFields,
    multiRelChanges,
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