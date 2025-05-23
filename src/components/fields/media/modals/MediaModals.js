'use client';

import React from 'react';
import { MediaUploadModal } from '@/components/fields/media/modals/MediaUploadModal';
import { MediaLibraryPicker } from '@/components/fields/media/components/MediaLibraryPicker';
import { MediaEditModal } from '@/components/fields/media/modals/MediaEditModal';

/**
 * Manages all modals for the media field - Simplified version
 */
export const MediaModals = ({
  modalState,
  handlers,
  field,
  record,
  mediaConfig,
  isMulti,
  editAnchorEl = null
}) => {
  const {
    uploadModalOpen,
    libraryModalOpen,
    externalLinkModalOpen,
    editModalOpen,
    editingMedia
  } = modalState;

  const {
    handleUploadComplete,
    handleLibrarySelect,
    handleEditComplete,
    handleExternalLinkComplete
  } = handlers;


  return (
    <>
      {/* Upload Modal */}
      <MediaUploadModal
        open={uploadModalOpen}
        onClose={() => handlers.setUploadModalOpen?.(false)}
        onUploadComplete={handleUploadComplete}
        record={record}
        field={field}
        config={mediaConfig}
        isMulti={isMulti}
      />

      {/* Library Picker Modal */}
      <MediaLibraryPicker
        open={libraryModalOpen}
        onClose={() => handlers.setLibraryModalOpen?.(false)}
        onSelect={handleLibrarySelect}
        record={record}
        multi={isMulti}
      />

      {/* Edit Modal */}
      {editModalOpen && editingMedia && (
        <MediaEditModal
          open={editModalOpen}
          onClose={() => {
            console.log('[MediaModals] Closing edit modal');
            handlers.setEditModalOpen?.(false);
            handlers.setEditingMedia?.(null);
          }}
          config={mediaConfig}
          initialMedia={editingMedia}
          onSave={(updatedMedia) => {
            console.log('[MediaModals] Edit modal save:', updatedMedia);
            if (handleEditComplete) {
              handleEditComplete(updatedMedia);
            }
          }}
        />
      )}
    </>
  );
};