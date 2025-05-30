'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getPostgresTimestamp } from '@/lib/utils/getPostgresTimestamp';
import { createClient } from '@/lib/supabase/browser';

// Sanitize function to be used throughout
const sanitizeRecord = (input, config) => {
  if (!input || typeof input !== 'object') return {};

  const validFields = config?.fields?.map(f => f.name) || [];
  const systemFields = ['id', 'created_at', 'updated_at', 'author_id'];

  const allowedFields = [...validFields, ...systemFields];

  // Exclude anything starting with ui- or known control keys
  return Object.fromEntries(
    Object.entries(input).filter(
      ([key]) =>
        allowedFields.includes(key) &&
        !key.startsWith('ui-') &&
        !['modal', 'type', 'view'].includes(key)
    )
  );
};

// NEW: Function to save multiRelationship data
const saveMultiRelationshipData = async (supabase, config, recordId, multiRelData) => {
  console.log('[useCollectionCreate] Saving multiRelationship data:', { recordId, multiRelData });
  
  const multiRelFields = config?.fields?.filter(f => f.type === 'multiRelationship' && f.relation?.junctionTable) || [];
  
  for (const field of multiRelFields) {
    const fieldData = multiRelData[field.name];
    if (!fieldData || !Array.isArray(fieldData) || fieldData.length === 0) {
      console.log(`[useCollectionCreate] Skipping ${field.name} - no data`);
      continue;
    }

    const {
      relation: {
        junctionTable,
        sourceKey,
        targetKey
      }
    } = field;

    if (!junctionTable || !sourceKey || !targetKey) {
      console.warn(`[useCollectionCreate] Missing junction config for ${field.name}`);
      continue;
    }

    try {
      // Convert to strings and filter
      const cleanIds = fieldData
        .map(id => String(id).trim())
        .filter(id => id && id !== 'undefined' && id !== 'null');

      if (cleanIds.length === 0) {
        console.log(`[useCollectionCreate] No valid IDs for ${field.name}`);
        continue;
      }

      // Delete existing relationships
      await supabase
        .from(junctionTable)
        .delete()
        .eq(sourceKey, recordId);

      // Insert new relationships
      const insertData = cleanIds.map(targetId => ({
        [sourceKey]: recordId,
        [targetKey]: targetId
      }));

      console.log(`[useCollectionCreate] Inserting ${field.name}:`, insertData);

      const { error } = await supabase
        .from(junctionTable)
        .insert(insertData);

      if (error) {
        console.error(`[useCollectionCreate] Error saving ${field.name}:`, error);
      } else {
        console.log(`[useCollectionCreate] Successfully saved ${cleanIds.length} relationships for ${field.name}`);
      }

    } catch (error) {
      console.error(`[useCollectionCreate] Error processing ${field.name}:`, error);
    }
  }
};

export const useCollectionCreate = ({ config, initialRecord = {} }) => {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Start with a clean record
  const cleanInitialRecord = useMemo(() => 
    sanitizeRecord(initialRecord, config), [initialRecord, config]);

  const [modalOpen, setModalOpen] = useState(false);
  const [localRecord, setLocalRecord] = useState(cleanInitialRecord);
  const [isCreatingRecord, setIsCreatingRecord] = useState(false);
  
  // NEW: Store multiRelationship data separately during creation
  const [pendingMultiRelData, setPendingMultiRelData] = useState({});
  
  const hasCreatedRef = useRef(false);

  const modal = useMemo(() => searchParams.get('modal'), [searchParams]);
  const recordId = useMemo(() => searchParams.get('id'), [searchParams]);

  const isCreating = modal === 'create';
  const isEditing = modal === 'edit' && !!recordId;

  // Extract only valid fields from URL parameters
  const extractValidFieldsFromUrl = () => {
    const allUrlFields = {};
    searchParams.forEach((value, key) => {
      allUrlFields[key] = value;
    });
    return allUrlFields;
  };
  
  // Extract only once
  const validFieldsRef = useRef(null);
  if (!validFieldsRef.current) {
    validFieldsRef.current = extractValidFieldsFromUrl();
    console.debug('🧩 Extracted valid fields from URL:', validFieldsRef.current);
  }

  useEffect(() => {
    setModalOpen(isCreating || isEditing);

    const shouldCreate =
      isCreating &&
      !recordId &&
      !initialRecord?.id &&
      !localRecord?.id &&
      !isCreatingRecord &&
      !hasCreatedRef.current;

    if (shouldCreate) {
      hasCreatedRef.current = true;
      console.debug('🚀 Creating new record...');
      createNewRecord(validFieldsRef.current || {});
    }
  }, [isCreating, isEditing, recordId, initialRecord?.id, localRecord?.id, isCreatingRecord]);

  const createNewRecord = async (rawFields) => {
    setIsCreatingRecord(true);
  
    const now = getPostgresTimestamp();
  
    // ENHANCED: Separate multiRelationship data from main record data
    const mainRecordData = {};
    const multiRelData = {};
    
    Object.entries(rawFields).forEach(([key, value]) => {
      const field = config?.fields?.find(f => f.name === key);
      if (field?.type === 'multiRelationship') {
        multiRelData[key] = value;
      } else {
        mainRecordData[key] = value;
      }
    });

    const sanitizedFields = sanitizeRecord(mainRecordData, config);
  
    const payload = {
      ...sanitizedFields,
      created_at: now,
      updated_at: now
    };
  
    console.debug('✅ Main record payload:', payload);
    console.debug('✅ MultiRel data to save later:', multiRelData);
  
    const selectFields = config.fields
      .map(f => f.name)
      .filter(name => !name.startsWith('ui-'))
      .join(', ');
  
    try {
      // Create the main record
      const { data: created, error } = await supabase
        .from(config.name)
        .insert(payload)
        .select(selectFields)
        .single();
  
      if (error) {
        console.error('❌ Supabase error:', error.message || error);
        setIsCreatingRecord(false);
        return;
      }

      console.log('✅ Record created:', created);

      // NEW: Save multiRelationship data if we have any
      if (Object.keys(multiRelData).length > 0) {
        console.log('🔗 Saving multiRelationship data...');
        await saveMultiRelationshipData(supabase, config, created.id, multiRelData);
      }
  
      setLocalRecord(created);
      setPendingMultiRelData({}); // Clear pending data
      setIsCreatingRecord(false);
  
      const currentParams = new URLSearchParams(window.location.search);
      currentParams.set('modal', 'edit');
      currentParams.set('id', created.id);
      
      // Remove multiRelationship params from URL since they're now saved
      config?.fields?.forEach(field => {
        if (field.type === 'multiRelationship') {
          currentParams.delete(field.name);
        }
      });
      
      router.replace(`${window.location.pathname}?${currentParams.toString()}`);
    } catch (err) {
      console.error('❌ Unexpected error:', err.message || err);
      setIsCreatingRecord(false);
    }
  };

  // NEW: Enhanced setLocalRecord that can handle multiRelationship updates during creation
  const setSanitizedLocalRecord = (value) => {
    if (typeof value === 'function') {
      setLocalRecord(prev => {
        const newValue = value(prev);
        
        // If we're still creating and this update includes multiRel data, store it separately
        if (isCreatingRecord) {
          const multiRelUpdates = {};
          const mainUpdates = {};
          
          Object.entries(newValue).forEach(([key, val]) => {
            const field = config?.fields?.find(f => f.name === key);
            if (field?.type === 'multiRelationship') {
              multiRelUpdates[key] = val;
            } else {
              mainUpdates[key] = val;
            }
          });
          
          if (Object.keys(multiRelUpdates).length > 0) {
            setPendingMultiRelData(prevPending => ({ ...prevPending, ...multiRelUpdates }));
          }
          
          return sanitizeRecord(mainUpdates, config);
        }
        
        return sanitizeRecord(newValue, config);
      });
    } else {
      // If we're still creating and this includes multiRel data, store it separately
      if (isCreatingRecord && value) {
        const multiRelUpdates = {};
        const mainUpdates = {};
        
        Object.entries(value).forEach(([key, val]) => {
          const field = config?.fields?.find(f => f.name === key);
          if (field?.type === 'multiRelationship') {
            multiRelUpdates[key] = val;
          } else {
            mainUpdates[key] = val;
          }
        });
        
        if (Object.keys(multiRelUpdates).length > 0) {
          setPendingMultiRelData(prevPending => ({ ...prevPending, ...multiRelUpdates }));
        }
        
        setLocalRecord(sanitizeRecord(mainUpdates, config));
      } else {
        setLocalRecord(sanitizeRecord(value, config));
      }
    }
  };

  const handleCloseModal = () => {
    console.debug('🧹 Closing modal...');
    setModalOpen(false);
    hasCreatedRef.current = false;
    validFieldsRef.current = null;
    setPendingMultiRelData({}); // Clear pending data

    const params = new URLSearchParams(searchParams.toString());
    params.delete('modal');
    params.delete('id');

    router.replace(`${window.location.pathname}?${params.toString()}`);
  };

  // NEW: Function to manually save pending multiRel data (if needed)
  const savePendingMultiRelData = async () => {
    if (localRecord?.id && Object.keys(pendingMultiRelData).length > 0) {
      await saveMultiRelationshipData(supabase, config, localRecord.id, pendingMultiRelData);
      setPendingMultiRelData({});
    }
  };

  return {
    modalOpen,
    handleCloseModal,
    localRecord,
    setLocalRecord: setSanitizedLocalRecord,
    isCreatingRecord,
    pendingMultiRelData, // NEW: Expose pending data
    savePendingMultiRelData // NEW: Manual save function
  };
};