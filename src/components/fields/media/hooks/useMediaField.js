'use client';
import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { Upload, LinkSimple, Link as LinkIcon } from '@phosphor-icons/react';

/**
 * Safe useMediaField - Prevents infinite loops by avoiding useEffect for value sync
 */
export const useMediaField = ({ field, parentId, value, onChange, record, config, readOnly }) => {
  console.log(`[useMediaField] ${field?.name} render with value:`, value);

  const isMulti = field?.relation?.isMulti || false;
  const canEdit = !readOnly && onChange !== null && onChange !== undefined;

  // ✅ MOVE THIS UP HERE
  const prevValueRef = useRef(value);

  const localSelectedItems = useMemo(() => {
    const current = prevValueRef.current;

    if (current === undefined || current === null) return [];

    if (isMulti) {
      if (Array.isArray(current)) return current.map(id => ({ id, title: `Item ${id}` }));
      if (current.details) return current.details;
      if (current.ids) return current.ids.map(id => ({ id, title: `Item ${id}` }));
    } else {
      if (typeof current === 'string' || typeof current === 'number') {
        return [{ id: current, title: `Item ${current}` }];
      }
    }

    return [];
  }, [JSON.stringify(prevValueRef.current), isMulti]);

  const [modalState, setModalState] = useState({
    uploadModalOpen: false,
    libraryModalOpen: false,
    externalLinkModalOpen: false,
    editModalOpen: false,
    editingMedia: null,
    menuAnchor: null,
    editAnchor: null
  });

  const [loading] = useState(false);
  const canAddMore = canEdit && (isMulti ? localSelectedItems.length < 10 : localSelectedItems.length === 0);

  const stableOnChange = useRef(onChange);
  stableOnChange.current = onChange;


useEffect(() => {
  const current = prevValueRef.current;
  const incoming = value;

  if (JSON.stringify(current) !== JSON.stringify(incoming)) {
    console.log(`[useMediaField] Detected value change from upstream`);
    prevValueRef.current = incoming;
  } else {
    // ✅ Do not trigger any change or state update here
    console.log(`[useMediaField] Value unchanged, skipping update`);
  }
}, [value]);

  const handleRemove = useCallback((mediaId) => {
    console.log(`[useMediaField] ${field?.name} remove:`, mediaId);
    if (!readOnly && stableOnChange.current) {
      const changeValue = isMulti
        ? (Array.isArray(value) ? value : []).filter(id => id !== mediaId)
        : null;

      if (JSON.stringify(prevValueRef.current) !== JSON.stringify(changeValue)) {
        prevValueRef.current = changeValue;
        stableOnChange.current(changeValue);
      }
    }
  }, [field?.name, isMulti, value]);

  const handleEditClick = useCallback((media, anchorEl) => {
    console.log(`[useMediaField] ${field?.name} edit:`, media);
    setModalState(prev => ({
      ...prev,
      editModalOpen: true,
      editingMedia: media,
      editAnchor: anchorEl
    }));
  }, []);

  const handleMenuClick = useCallback((event) => {
    console.log(`[useMediaField] ${field?.name} menu click`);
  }, []);

  const handleMenuClose = useCallback(() => {
    console.log(`[useMediaField] ${field?.name} menu close`);
  }, []);

const hasTriggeredRef = useRef(false);

const menuOptions = useMemo(() => {
  return [
    {
      label: 'Test Upload',
      icon: Upload,
      onClick: () => {
  if (hasTriggeredRef.current) {
    console.log('[useMediaField] Skipping repeated upload');
    return;
  }

  hasTriggeredRef.current = true;

  const testItem = { id: `test-${Date.now()}`, title: 'Test Item' };

  const changeValue = isMulti
    ? {
        ids: [...(Array.isArray(value?.ids) ? value.ids : []), testItem.id],
        details: [...(Array.isArray(value?.details) ? value.details : []), testItem]
      }
    : testItem.id;

  // ✅ Prevent infinite loop by checking if the value actually changed
  if (!readOnly && stableOnChange.current && JSON.stringify(value) !== JSON.stringify(changeValue)) {
    console.log('[useMediaField] Upload triggered');
    prevValueRef.current = changeValue; // Update ref so next memo won't see it as changed
    stableOnChange.current(changeValue);
  }

  // Reset flag after short delay
  setTimeout(() => {
    hasTriggeredRef.current = false;
  }, 1000);
}

    }
  ];
}, [field?.name, isMulti, value, readOnly]);


  const handlers = {
    handleRemove,
    handleEditClick,
    handleMenuClick,
    handleMenuClose,
    setEditModalOpen: (isOpen) => setModalState(prev => ({ ...prev, editModalOpen: isOpen })),
    setEditingMedia: (media) => setModalState(prev => ({ ...prev, editingMedia: media })),
    setUploadModalOpen: (isOpen) => setModalState(prev => ({ ...prev, uploadModalOpen: isOpen })),
    setLibraryModalOpen: (isOpen) => setModalState(prev => ({ ...prev, libraryModalOpen: isOpen })),
    setExternalLinkModalOpen: (isOpen) => setModalState(prev => ({ ...prev, externalLinkModalOpen: isOpen }))
  };

  console.log(`[useMediaField] Render for field: ${field?.name}, value:`, value);

  return {
    loading,
    filterError: null,
    localSelectedItems,
    mediaConfig: config || {},
    isMulti,
    canEdit,
    canAddMore,
    maxItems: 10,
    menuOptions,
    modalState,
    handlers
  };
};