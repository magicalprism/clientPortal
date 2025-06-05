// Fixed ViewButtons.jsx
'use client';

import { IconButton, Box, Tooltip } from '@mui/material';
import { Eye, CornersOut } from '@phosphor-icons/react';
import { useModal } from '@/components/modals/ModalContext';
import * as collections from '@/collections';
import { createClient } from '@/lib/supabase/browser';
import { DeleteRecordButton } from '@/components/buttons/DeleteRecordButton';

export const ViewButtons = ({ 
  config, 
  id, 
  record, // Optional: pass full record to avoid extra fetch
  onRefresh, // Function to refresh parent data
  showDelete = true, // Whether to show delete button
  showFullView = true, // Whether to show full view button
  showModal = true, // Whether to show modal view button
  size = 'small', // Button size
  isInModal = false // NEW: indicates if these buttons are inside a modal
}) => {
  const { openModal, closeModal } = useModal(); // Added closeModal
  const fullConfig = collections[config.name] || config;
  const supabase = createClient();

  // Open modal view
  const handleOpenModal = async () => {
    let recordData = record;
    
    // If no record provided, fetch it
    if (!recordData && id) {
      const { data, error } = await supabase
        .from(fullConfig.name)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error(`[ViewButtons] Failed to fetch record ${id}:`, error);
        return;
      }
      
      recordData = data;
    }

    if (!recordData) {
      console.error('[ViewButtons] No record data available');
      return;
    }

    openModal('edit', {
      config: fullConfig,
      defaultValues: recordData,
      onRefresh: onRefresh // Pass refresh function to modal
    });
  };

  // Open full page view
  const handleOpenFullView = () => {
    if (fullConfig.editPathPrefix && id) {
      window.open(`${fullConfig.editPathPrefix}/${id}`, '_blank');
    }
  };

  // Handle delete success
  const handleDeleteSuccess = (deletedId) => {
    console.log('Record deleted from ViewButtons:', deletedId);
    
    // If we're in a modal, close it first
    if (isInModal) {
      closeModal();
    }
    
    // Then refresh the background data
    if (onRefresh) {
      // Small delay to ensure modal closes first
      setTimeout(() => {
        onRefresh();
      }, 100);
    }
  };

  return (
    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
      {/* Modal View Button */}
      {showModal && !isInModal && ( // Don't show modal button if already in modal
        <Tooltip title="Quick view">
          <IconButton size={size} onClick={handleOpenModal}>
            <Eye size={size === 'small' ? 16 : 20} />
          </IconButton>
        </Tooltip>
      )}

      {/* Full Page View Button */}
      {showFullView && fullConfig.editPathPrefix && (
        <Tooltip title="Open full view">
          <IconButton size={size} onClick={handleOpenFullView}>
            <CornersOut size={size === 'small' ? 16 : 20} />
          </IconButton>
        </Tooltip>
      )}

      {/* Delete Button */}
      {showDelete && (record || id) && (
        <DeleteRecordButton
          record={record || { id }}
          config={fullConfig}
          onDeleteSuccess={handleDeleteSuccess}
          iconOnly={true}
          size={size}
          tooltip={`Delete ${fullConfig?.singularLabel || 'item'}`}
        />
      )}
    </Box>
  );
};