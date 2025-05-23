'use client';

import { useState } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { useMediaField } from '@/components/fields/media/hooks/useMediaField';
import { MediaDisplay } from '@/components/fields/media/components/MediaDisplay';
import { MediaActions } from '@/components/fields/media/components/MediaActions';
import { MediaModals } from '@/components/fields/media/modals/MediaModals';

/**
 * Unified Media Field - handles both single and multi media based on config
 * Refactored into smaller, focused components
 */
export const UnifiedMediaField = ({ 
  field, 
  parentId, 
  hideLabel = false,
  value,
  onChange,
  record,
  config,
  readOnly = false
}) => {
  // All the complex logic is now in a custom hook
  const {
    loading,
    filterError,
    localSelectedItems,
    mediaConfig,
    isMulti,
    canEdit,
    canAddMore,
    maxItems,
    menuOptions,
    modalState,
    handlers
  } = useMediaField({
    field,
    parentId,
    value,
    onChange,
    record,
    config,
    readOnly
  });

  console.log(`[UnifiedMediaField] Render for: ${field?.name}, value:`, value);
  const [editModalOpen, setEditModalOpen] = useState(false);

  return (
    <Box>

      {filterError && (
        <Typography variant="caption" color="error" sx={{ display: 'block', mb: 1 }}>
          Filter error: {filterError}
        </Typography>
      )}

      {loading ? (
        <CircularProgress size={20} />
      ) : (
        <Box display="flex" flexDirection="column" gap={2} width="100%">
          {/* Media Display Component */}
          <MediaDisplay
            isMulti={isMulti}
            localSelectedItems={localSelectedItems}
            canEdit={canEdit}
            canAddMore={canAddMore}
            menuOptions={menuOptions}
            field={field}
            mediaConfig={mediaConfig}
            onRemove={handlers.handleRemove}
            onEdit={handlers.handleEditClick}
            onMenuClick={handlers.handleMenuClick}
            onAddClick={menuOptions.length === 1 ? menuOptions[0]?.onClick : handlers.handleMenuClick}
          />

          {/* Action Buttons Component */}
          <MediaActions
            canEdit={canEdit}
            isMulti={isMulti}
            canAddMore={canAddMore}
            localSelectedItems={localSelectedItems}
            maxItems={maxItems}
            menuOptions={menuOptions}
            menuAnchor={modalState.menuAnchor}
            onMenuClick={handlers.handleMenuClick}
            onMenuClose={handlers.handleMenuClose}
          />

          {/* Count display for multi mode */}
          {isMulti && (
            <Typography variant="caption" color="text.secondary">
              {localSelectedItems.length} of {maxItems} items selected
            </Typography>
          )}
        </Box>
      )}

      {/* All Modals Component */}
      <MediaModals
        modalState={modalState}
        handlers={handlers}
        field={field}
        record={record}
        mediaConfig={mediaConfig}
        isMulti={isMulti}
        editAnchorEl={modalState.editAnchor}
      />
    </Box>
  );
};

export default UnifiedMediaField;