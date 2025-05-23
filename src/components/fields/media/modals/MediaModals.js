'use client';

import React from 'react';
import { MediaUploadModal } from '@/components/fields/media/modals/MediaUploadModal';
import { MediaLibraryPicker } from '@/components/fields/media/components/MediaLibraryPicker';
import { CollectionEditPopover } from '@/components/fields/media/modals/CollectionEditPopover'; // Use popover instead

/**
 * Manages all modals for the media field
 */
export const MediaModals = ({
  modalState,
  handlers,
  field,
  record,
  mediaConfig,
  isMulti,
  editAnchorEl = null // Add anchor element for popover positioning
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

      {/* Edit Popover using CollectionEditPopover - no modal conflicts! */}
      <CollectionEditPopover
        open={editModalOpen}
        anchorEl={editAnchorEl}
        onClose={() => {
          handlers.setEditModalOpen?.(false);
          handlers.setEditingMedia?.(null);
        }}
        onComplete={handleEditComplete}
        config={mediaConfig}
        record={editingMedia}
        isEditing={true}
        title={`Edit ${field?.label || 'Media'}`}
      />

      {/* External Link Popover using CollectionEditPopover */}
      <CollectionEditPopover
        open={externalLinkModalOpen}
        anchorEl={editAnchorEl}
        onClose={() => handlers.setExternalLinkModalOpen?.(false)}
        onComplete={handleExternalLinkComplete}
        config={mediaConfig}
        record={null}
        isEditing={false}
        defaultValues={{
          is_external: true,
          mime_type: 'external/url',
          status: 'linked',
          company_id: record?.company_id
        }}
        title={`Add External ${field?.label || 'Media'}`}
      />
    </>
  );
};