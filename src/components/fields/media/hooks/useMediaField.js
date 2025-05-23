// ===== ENHANCED useMediaField.js with Better Change Detection =====
'use client';
import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { Upload, LinkSimple, Link as LinkIcon } from '@phosphor-icons/react';
import { createClient } from '@/lib/supabase/browser';
import * as collections from '@/collections';
import { MediaEditModal } from '@/components/fields/media/modals/MediaEditModal';

export const useMediaField = ({ field, parentId, value, onChange, record, config, readOnly }) => {
  console.log(`🔧 [useMediaField] ${field?.name} HOOK INIT:`, {
    value,
    hasOnChange: !!onChange,
    readOnly,
    recordId: record?.id || 'new'
  });
  
  const mediaConfig = collections.media;
  const isMulti = field?.relation?.isMulti || false;
  const canEdit = !readOnly && onChange !== null && onChange !== undefined;

  const [currentValue, setCurrentValue] = useState(value);
  const [hydratedItems, setHydratedItems] = useState([]);
  const [isHydrating, setIsHydrating] = useState(false);

  const supabase = createClient();

  // Store stable reference to onChange
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Sync value changes from parent
  useEffect(() => {
    if (JSON.stringify(currentValue) !== JSON.stringify(value)) {
      console.log(`🔄 [useMediaField] ${field?.name} syncing value:`, { from: currentValue, to: value });
      setCurrentValue(value);
    }
  }, [value, field?.name]);

  // Hydrate media items when value changes
  useEffect(() => {
    const hydrateMediaItems = async () => {
      const workingValue = currentValue !== undefined ? currentValue : value;
      
      console.log(`💧 [useMediaField] ${field?.name} hydrating:`, workingValue);
      
      if (!workingValue || (!Array.isArray(workingValue) && typeof workingValue !== 'object' && typeof workingValue !== 'string' && typeof workingValue !== 'number')) {
        setHydratedItems([]);
        return;
      }

      let itemsToHydrate = [];
      
      if (isMulti) {
        if (Array.isArray(workingValue)) {
          const hasFullObjects = workingValue.length > 0 && 
            typeof workingValue[0] === 'object' && 
            workingValue[0].url;
            
          if (hasFullObjects) {
            console.log(`📦 [useMediaField] ${field?.name} already hydrated objects`);
            setHydratedItems(workingValue);
            return;
          } else {
            itemsToHydrate = workingValue.map(item => 
              typeof item === 'object' ? item.id : item
            ).filter(Boolean);
          }
        }
      } else {
        if (typeof workingValue === 'object' && workingValue?.url) {
          console.log(`📦 [useMediaField] ${field?.name} already hydrated single object`);
          setHydratedItems([workingValue]);
          return;
        } else if (typeof workingValue === 'object' && workingValue?.id) {
          itemsToHydrate = [workingValue.id];
        } else if (typeof workingValue === 'string' || typeof workingValue === 'number') {
          itemsToHydrate = [workingValue];
        }
      }

      if (itemsToHydrate.length === 0) {
        console.log(`🚫 [useMediaField] ${field?.name} no items to hydrate`);
        setHydratedItems([]);
        return;
      }

      setIsHydrating(true);
      try {
        console.log(`🔍 [useMediaField] ${field?.name} fetching media:`, itemsToHydrate);
        
        const { data, error } = await supabase
          .from('media')
          .select('*')
          .in('id', itemsToHydrate);

        if (error) {
          console.error(`❌ [useMediaField] ${field?.name} fetch error:`, error);
          setHydratedItems(itemsToHydrate.map(id => ({ id, title: `Item ${id}` })));
        } else {
          console.log(`✅ [useMediaField] ${field?.name} hydrated ${data?.length || 0} items:`, data);
          setHydratedItems(data || []);
        }
      } catch (err) {
        console.error(`💥 [useMediaField] ${field?.name} hydration error:`, err);
        setHydratedItems(itemsToHydrate.map(id => ({ id, title: `Item ${id}` })));
      } finally {
        setIsHydrating(false);
      }
    };

    hydrateMediaItems();
  }, [currentValue, value, isMulti, supabase, field?.name]);

  const localSelectedItems = useMemo(() => {
    return hydratedItems;
  }, [hydratedItems]);

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
  const isLoading = loading || isHydrating;

  // ✅ CRITICAL: Enhanced value change handler with better logging
  const handleValueChange = useCallback((newValue) => {
    console.log(`🎯 [useMediaField] ${field?.name} VALUE CHANGE:`, {
      oldValue: currentValue,
      newValue: newValue,
      fieldType: field?.type,
      isMulti: isMulti,
      hasOnChange: !!onChangeRef.current
    });
    
    // Update local state immediately
    setCurrentValue(newValue);
    
    // CRITICAL: Call parent onChange with extensive logging
    if (onChangeRef.current) {
      console.log(`📤 [useMediaField] ${field?.name} CALLING PARENT onChange...`);
      
      try {
        // Use setTimeout to ensure the call happens in the next tick
        // This helps with React's batching and change detection
        setTimeout(() => {
          onChangeRef.current(newValue);
          console.log(`✅ [useMediaField] ${field?.name} onChange completed successfully`);
        }, 0);
        
      } catch (error) {
        console.error(`💥 [useMediaField] ${field?.name} onChange error:`, error);
      }
    } else {
      console.error(`❌ [useMediaField] ${field?.name} NO onChange handler available!`);
    }
  }, [field?.name, field?.type, isMulti, currentValue]);

  // ✅ Upload completion handler
  const handleUploadComplete = useCallback((uploadedMedia) => {
    console.log(`📁 [useMediaField] ${field?.name} UPLOAD COMPLETE:`, uploadedMedia);
    
    const mediaArray = Array.isArray(uploadedMedia) ? uploadedMedia : [uploadedMedia];
    
    let newValue;
    if (isMulti || field?.type === 'multiRelationship') {
      // Multi mode - combine existing + new IDs
      const existingIds = Array.isArray(currentValue) ? currentValue : [];
      const newIds = mediaArray.map(m => parseInt(m.id));
      newValue = [...existingIds, ...newIds];
      console.log(`📊 [useMediaField] ${field?.name} multi upload result:`, { existingIds, newIds, newValue });
    } else {
      // Single mode - use first uploaded item ID
      newValue = parseInt(mediaArray[0].id);
      console.log(`📊 [useMediaField] ${field?.name} single upload result:`, newValue);
    }
    
    // Update value and close modal
    handleValueChange(newValue);
    setModalState(prev => ({ ...prev, uploadModalOpen: false }));
  }, [isMulti, field?.type, field?.name, currentValue, handleValueChange]);

  // ✅ Library selection handler
  const handleLibrarySelect = useCallback((selectedMedia) => {
    console.log(`📚 [useMediaField] ${field?.name} LIBRARY SELECTION:`, selectedMedia);
    
    const mediaArray = Array.isArray(selectedMedia) ? selectedMedia : [selectedMedia];
    
    let newValue;
    if (isMulti || field?.type === 'multiRelationship') {
      // Multi mode - combine existing + selected IDs
      const existingIds = Array.isArray(currentValue) ? currentValue : [];
      const selectedIds = mediaArray.map(m => parseInt(m.id));
      newValue = [...existingIds, ...selectedIds];
      console.log(`📊 [useMediaField] ${field?.name} multi library result:`, { existingIds, selectedIds, newValue });
    } else {
      // Single mode - use selected item ID
      newValue = parseInt(mediaArray[0].id);
      console.log(`📊 [useMediaField] ${field?.name} single library result:`, newValue);
    }
    
    // Update value and close modal
    handleValueChange(newValue);
    setModalState(prev => ({ ...prev, libraryModalOpen: false }));
  }, [isMulti, field?.type, field?.name, currentValue, handleValueChange]);

  const handleRemove = useCallback((mediaId) => {
    console.log(`🗑️ [useMediaField] ${field?.name} REMOVE:`, mediaId);
    
    if (!canEdit) {
      console.log(`🚫 [useMediaField] ${field?.name} remove blocked - not editable`);
      return;
    }
    
    let newValue;
    if (isMulti || field?.type === 'multiRelationship') {
      // Multi relationship - filter out the removed ID
      const currentIds = Array.isArray(currentValue) ? currentValue : [];
      newValue = currentIds.filter(id => parseInt(id) !== parseInt(mediaId));
      console.log(`📊 [useMediaField] ${field?.name} multi remove result:`, { currentIds, removed: mediaId, newValue });
    } else {
      // Single relationship - set to null
      newValue = null;
      console.log(`📊 [useMediaField] ${field?.name} single remove result: null`);
    }
    
    handleValueChange(newValue);
  }, [field?.name, field?.type, isMulti, currentValue, canEdit, handleValueChange]);

  const handleEditClick = useCallback((media, anchorEl) => {
    console.log(`✏️ [useMediaField] ${field?.name} EDIT CLICK:`, media?.id);
    setModalState(prev => ({
      ...prev,
      editModalOpen: true,
      editingMedia: media,
      editAnchor: anchorEl
    }));
  }, [field?.name]);

  const handleMenuClick = useCallback((event) => {
    console.log(`📋 [useMediaField] ${field?.name} MENU CLICK`);
    setModalState(prev => ({
      ...prev,
      menuAnchor: event.currentTarget
    }));
  }, [field?.name]);

  const handleMenuClose = useCallback(() => {
    console.log(`📋 [useMediaField] ${field?.name} MENU CLOSE`);
    setModalState(prev => ({ ...prev, menuAnchor: null }));
  }, [field?.name]);

  // ✅ Edit completion handler
  const handleEditComplete = useCallback((editedMedia) => {
    console.log(`✏️ [useMediaField] ${field?.name} EDIT COMPLETE:`, editedMedia);
    
    if (isMulti || field?.type === 'multiRelationship') {
      // Multi mode - update existing item or add new one
      const existingIds = Array.isArray(currentValue) ? currentValue : [];
      const editedId = parseInt(editedMedia.id);
      
      if (existingIds.includes(editedId)) {
        // Already exists - force re-hydration by updating state
        console.log(`📊 [useMediaField] ${field?.name} refreshing existing item`);
        setCurrentValue([...existingIds]); // Trigger re-hydration
      } else {
        // New item - add to array
        const newValue = [...existingIds, editedId];
        console.log(`📊 [useMediaField] ${field?.name} adding new item:`, { existingIds, editedId, newValue });
        handleValueChange(newValue);
      }
    } else {
      // Single mode - set to edited item ID
      const newValue = parseInt(editedMedia.id);
      console.log(`📊 [useMediaField] ${field?.name} single edit result:`, newValue);
      handleValueChange(newValue);
    }
    
    // Close edit modal
    setModalState(prev => ({ 
      ...prev, 
      editModalOpen: false, 
      editingMedia: null 
    }));
  }, [isMulti, field?.type, field?.name, currentValue, handleValueChange]);

  const handlers = {
    handleRemove,
    handleEditClick,
    handleMenuClick,
    handleMenuClose,
    handleUploadComplete,
    handleLibrarySelect,
    handleEditComplete,
    setEditModalOpen: (isOpen) => {
      setModalState(prev => ({ 
        ...prev, 
        editModalOpen: isOpen,
        ...(isOpen === false && { editingMedia: null })
      }));
    },
    setEditingMedia: (media) => {
      setModalState(prev => ({ ...prev, editingMedia: media }));
    },
    setUploadModalOpen: (isOpen) => setModalState(prev => ({ ...prev, uploadModalOpen: isOpen })),
    setLibraryModalOpen: (isOpen) => setModalState(prev => ({ ...prev, libraryModalOpen: isOpen })),
    openExternalLinkEditor: () => {
      console.log(`🔗 [useMediaField] ${field?.name} EXTERNAL LINK EDITOR`);
      setModalState(prev => ({
        ...prev,
        editModalOpen: true,
        editingMedia: {
          url: '',
          mime_type: 'external/url',
          title: '',
          alt_text: '',
          company_id: record?.company_id || record?.company?.id || null,
          project_id: record?.project_id || record?.project?.id || null,
          status: 'active'
        }
      }));
    }
  };
  // Add this to your MediaModals component to debug what's happening

const MediaModals = ({
  modalState,
  handlers,
  field,
  record,
  mediaConfig,
  isMulti,
  editAnchorEl
}) => {
  console.log(`🎭 [MediaModals] ${field?.name} rendering modals:`, {
    uploadModalOpen: modalState.uploadModalOpen,
    libraryModalOpen: modalState.libraryModalOpen,
    editModalOpen: modalState.editModalOpen,
    editingMedia: !!modalState.editingMedia,
    externalLinkModalOpen: modalState.externalLinkModalOpen, // Check if this exists
    availableHandlers: Object.keys(handlers)
  });

  return (
    <>
      {/* Upload Modal */}
      {MediaUploadModal && (
        <MediaUploadModal
          open={modalState.uploadModalOpen}
          onClose={() => handlers.setUploadModalOpen(false)}
          onUploadComplete={handlers.handleUploadComplete}
          record={record}
          field={field}
          config={mediaConfig}
          isMulti={isMulti}
        />
      )}

      {/* Library Picker */}
      {MediaLibraryPicker && (
        <MediaLibraryPicker
          open={modalState.libraryModalOpen}
          onClose={() => handlers.setLibraryModalOpen(false)}
          onSelect={handlers.handleLibrarySelect}
          record={record}
          multi={isMulti}
        />
      )}

      {/* Edit Modal - handles both regular editing AND external link creation */}
      {MediaEditModal && modalState.editModalOpen && (
        <MediaEditModal
          open={modalState.editModalOpen}
          onClose={() => handlers.setEditModalOpen(false)}
          config={mediaConfig}
          initialMedia={modalState.editingMedia}
          onSave={handlers.handleEditComplete}
          anchorEl={editAnchorEl}
        />
      )}
      
      {/* ✅ Add debug info */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{ position: 'fixed', bottom: 10, right: 10, background: 'rgba(0,0,0,0.8)', color: 'white', padding: '10px', fontSize: '12px', zIndex: 9999 }}>
          <div>Upload: {modalState.uploadModalOpen ? '✅' : '❌'}</div>
          <div>Library: {modalState.libraryModalOpen ? '✅' : '❌'}</div>
          <div>Edit: {modalState.editModalOpen ? '✅' : '❌'}</div>
          <div>External Link: {modalState.externalLinkModalOpen ? '✅' : '❌'}</div>
        </div>
      )}
    </>
  );
};

  const menuOptions = useMemo(() => {
    return [
      {
        label: 'Upload File',
        icon: Upload,
        onClick: () => {
          console.log(`📤 [useMediaField] ${field?.name} opening upload modal`);
          handlers.setUploadModalOpen(true);
        }
      },
      {
        label: 'Choose from Library',
        icon: LinkIcon,
        onClick: () => {
          console.log(`📚 [useMediaField] ${field?.name} opening library modal`);
          handlers.setLibraryModalOpen(true);
        }
      },
      {
        label: 'Link External URL',
        icon: LinkSimple,
        onClick: handlers.openExternalLinkEditor
      }
    ];
  }, [handlers, field?.name]);

  const hookResult = {
    loading: isLoading,
    filterError: null,
    localSelectedItems,
    mediaConfig,
    isMulti,
    canEdit,
    canAddMore,
    maxItems: 10,
    menuOptions,
    modalState,
    handlers
  };

  console.log(`🔧 [useMediaField] ${field?.name} HOOK RESULT:`, {
    loading: hookResult.loading,
    itemCount: localSelectedItems.length,
    canEdit: hookResult.canEdit,
    canAddMore: hookResult.canAddMore,
    modalStates: Object.entries(modalState).filter(([k, v]) => v === true).map(([k]) => k)
  });

  return hookResult;
};