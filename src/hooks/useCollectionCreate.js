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
  
    const sanitizedFields = sanitizeRecord(rawFields, config); // filter only DB fields
  
    const payload = {
      ...sanitizedFields,
      created_at: now,
      updated_at: now
    };
  
    console.debug('✅ Sanitized insert payload:', payload);
  
    const selectFields = config.fields
      .map(f => f.name)
      .filter(name => !name.startsWith('ui-'))
      .join(', ');
  
    try {
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
  
      setLocalRecord(created);
      setIsCreatingRecord(false);
  
      const currentParams = new URLSearchParams(window.location.search);
      currentParams.set('modal', 'edit');
      currentParams.set('id', created.id);
      router.replace(`${window.location.pathname}?${currentParams.toString()}`);
    } catch (err) {
      console.error('❌ Unexpected error:', err.message || err);
      setIsCreatingRecord(false);
    }
  };
  

  // Create a wrapper for setLocalRecord that sanitizes
  const setSanitizedLocalRecord = (value) => {
    if (typeof value === 'function') {
      setLocalRecord(prev => {
        const newValue = value(prev);
        return sanitizeRecord(newValue, config);
      });
    } else {
      setLocalRecord(sanitizeRecord(value, config));
    }
  };

  const handleCloseModal = () => {
    console.debug('🧹 Closing modal...');
    setModalOpen(false);
    hasCreatedRef.current = false;
    validFieldsRef.current = null;

    const params = new URLSearchParams(searchParams.toString());
    params.delete('modal');
    params.delete('id');

    router.replace(`${window.location.pathname}?${params.toString()}`);
  };

  return {
    modalOpen,
    handleCloseModal,
    localRecord,
    setLocalRecord: setSanitizedLocalRecord,
    isCreatingRecord
  };
};