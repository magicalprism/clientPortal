// ===== ENHANCED useMediaField.js with Better Change Detection =====
'use client';
import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { Upload, LinkSimple, Link as LinkIcon } from '@phosphor-icons/react';
import { createClient } from '@/lib/supabase/browser';
import * as collections from '@/collections';
import { MediaEditModal } from '@/components/fields/media/modals/MediaEditModal';

export const useMediaField = ({ field, parentId, value, onChange, record, config, readOnly }) => {

  
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
     
      setCurrentValue(value);
    }
  }, [value, field?.name]);

  // Hydrate media items when value changes
  useEffect(() => {
    const hydrateMediaItems = async () => {
      const workingValue = currentValue !== undefined ? currentValue : value;
      

      
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
 
          setHydratedItems([workingValue]);
          return;
        } else if (typeof workingValue === 'object' && workingValue?.id) {
          itemsToHydrate = [workingValue.id];
        } else if (typeof workingValue === 'string' || typeof workingValue === 'number') {
          itemsToHydrate = [workingValue];
        }
      }

      if (itemsToHydrate.length === 0) {

        setHydratedItems([]);
        return;
      }

      setIsHydrating(true);
      try {

        
        const { data, error } = await supabase
          .from('media')
          .select('*')
          .in('id', itemsToHydrate);

        if (error) {

          setHydratedItems(itemsToHydrate.map(id => ({ id, title: `Item ${id}` })));
        } else {
   
          setHydratedItems(data || []);
        }
      } catch (err) {

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
   ;
    
    // Update local state immediately
    setCurrentValue(newValue);
    
    // CRITICAL: Call parent onChange with extensive logging
    if (onChangeRef.current) {

      
      try {
        // Use setTimeout to ensure the call happens in the next tick
        // This helps with React's batching and change detection
        setTimeout(() => {
          onChangeRef.current(newValue);
    
        }, 0);
        
      } catch (error) {

      }
    } else {

    }
  }, [field?.name, field?.type, isMulti, currentValue]);

  // ✅ Upload completion handler
  const handleUploadComplete = useCallback((uploadedMedia) => {

    
    const mediaArray = Array.isArray(uploadedMedia) ? uploadedMedia : [uploadedMedia];
    
    let newValue;
    if (isMulti || field?.type === 'multiRelationship') {
      // Multi mode - combine existing + new IDs
      const existingIds = Array.isArray(currentValue) ? currentValue : [];
      const newIds = mediaArray.map(m => parseInt(m.id));
      newValue = [...existingIds, ...newIds];
     
    } else {
      // Single mode - use first uploaded item ID
      newValue = parseInt(mediaArray[0].id);
      
    }
    
    // Update value and close modal
    handleValueChange(newValue);
    setModalState(prev => ({ ...prev, uploadModalOpen: false }));
  }, [isMulti, field?.type, field?.name, currentValue, handleValueChange]);

  // ✅ Library selection handler
  const handleLibrarySelect = useCallback((selectedMedia) => {

    
    const mediaArray = Array.isArray(selectedMedia) ? selectedMedia : [selectedMedia];
    
    let newValue;
    if (isMulti || field?.type === 'multiRelationship') {
      // Multi mode - combine existing + selected IDs
      const existingIds = Array.isArray(currentValue) ? currentValue : [];
      const selectedIds = mediaArray.map(m => parseInt(m.id));
      newValue = [...existingIds, ...selectedIds];
      
    } else {
      // Single mode - use selected item ID
      newValue = parseInt(mediaArray[0].id);

    }
    
    // Update value and close modal
    handleValueChange(newValue);
    setModalState(prev => ({ ...prev, libraryModalOpen: false }));
  }, [isMulti, field?.type, field?.name, currentValue, handleValueChange]);

  const handleRemove = useCallback((mediaId) => {

    
    if (!canEdit) {

      return;
    }
    
    let newValue;
    if (isMulti || field?.type === 'multiRelationship') {
      // Multi relationship - filter out the removed ID
      const currentIds = Array.isArray(currentValue) ? currentValue : [];
      newValue = currentIds.filter(id => parseInt(id) !== parseInt(mediaId));
      
    } else {
      // Single relationship - set to null
      newValue = null;

    }
    
    handleValueChange(newValue);
  }, [field?.name, field?.type, isMulti, currentValue, canEdit, handleValueChange]);

  const handleEditClick = useCallback((media, anchorEl) => {

    setModalState(prev => ({
      ...prev,
      editModalOpen: true,
      editingMedia: media,
      editAnchor: anchorEl
    }));
  }, [field?.name]);

  const handleMenuClick = useCallback((event) => {

    setModalState(prev => ({
      ...prev,
      menuAnchor: event.currentTarget
    }));
  }, [field?.name]);

  const handleMenuClose = useCallback(() => {

    setModalState(prev => ({ ...prev, menuAnchor: null }));
  }, [field?.name]);

  // ✅ Edit completion handler
  const handleEditComplete = useCallback((editedMedia) => {

    
    if (isMulti || field?.type === 'multiRelationship') {
      // Multi mode - update existing item or add new one
      const existingIds = Array.isArray(currentValue) ? currentValue : [];
      const editedId = parseInt(editedMedia.id);
      
      if (existingIds.includes(editedId)) {
        // Already exists - force re-hydration by updating state

        setCurrentValue([...existingIds]); // Trigger re-hydration
      } else {
        // New item - add to array
        const newValue = [...existingIds, editedId];
        
        handleValueChange(newValue);
      }
    } else {
      // Single mode - set to edited item ID
      const newValue = parseInt(editedMedia.id);

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

          handlers.setUploadModalOpen(true);
        }
      },
      {
        label: 'Choose from Library',
        icon: LinkIcon,
        onClick: () => {

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


  return hookResult;
};