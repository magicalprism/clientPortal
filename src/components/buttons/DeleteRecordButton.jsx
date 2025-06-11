// src/components/buttons/DeleteRecordButton.jsx
'use client';

import { useState } from 'react';
import { 
  Button, 
  IconButton,
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogContentText, 
  DialogActions, 
  CircularProgress,
  Tooltip
} from '@mui/material';
import { Trash as TrashIcon } from '@phosphor-icons/react';
import { deleteWithDependencies } from '@/lib/utils/deleteWithDependencies';
import { useRouter } from 'next/navigation';

export function DeleteRecordButton({
  record,
  config,
  isModal = false,
  onDeleteSuccess,
  onCancel,
  variant = 'contained', // 'contained', 'outlined', 'text', 'icon'
  size = 'medium',
  disabled = false,
  iconOnly = false, // New prop to show only icon
  tooltip = null, // Custom tooltip text
  color = 'error',
  confirmDialog = true, // ✅ New prop to optionally skip confirmation
  immediate = false // ✅ New prop for immediate deletion (like task completion)
}) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  // Don't show delete button if no record ID
  if (!record?.id) {
    console.log('DeleteRecordButton: No record ID provided', { record });
    return null;
  }

  const entityLabel = config?.singularLabel || config?.label || 'item';
  const collectionPath = config?.editPathPrefix || `/dashboard/${config?.name}`;
  const displayName = record.title || record.name || `${entityLabel} ${record.id}`;

  const handleDeleteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // ✅ If immediate deletion or no confirmation needed, delete right away
    if (immediate || !confirmDialog) {
      handleConfirmDelete();
    } else {
      setConfirmDialogOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    setConfirmDialogOpen(false);

    try {
      console.log('Deleting record:', record.id, 'from collection:', config.name);
      
      // ✅ Call onDeleteSuccess IMMEDIATELY for responsive UI (optimistic update)
      if (onDeleteSuccess) {
        console.log('Calling onDeleteSuccess callback immediately for responsive UI');
        onDeleteSuccess(record.id);
      }
      
      // Then perform actual deletion
      const { success, error } = await deleteWithDependencies(config.name, [record.id]);

      if (!success) {
        console.error('Delete failed:', error);
        
        // ✅ If deletion failed and we did optimistic update, we need to revert
        // This would require a "revert" callback, but for now we'll just show an error
        alert('Failed to delete: ' + error);
        
        // If there's a revert callback, call it
        if (onDeleteSuccess && typeof onDeleteSuccess === 'function') {
          // We can't easily revert the optimistic update, so we might need to refresh
          window.location.reload(); // Not ideal, but ensures consistency
        }
        
        setIsDeleting(false);
        return;
      }

      console.log('Delete successful for record:', record.id);

      // Handle based on context (but onDeleteSuccess was already called above)
      if (isModal && !onDeleteSuccess) {
        // In modal without custom success handler - close and let parent handle refresh
        console.log('Modal mode: calling onCancel to close modal');
        if (onCancel) {
          onCancel();
        }
      } else if (!isModal && !onDeleteSuccess) {
        // Full page without custom handler - redirect to collection list
        console.log('Redirecting to collection list:', collectionPath);
        router.push(collectionPath);
      }
      // If onDeleteSuccess was provided, it was already called above for responsive UI
      
      setIsDeleting(false);
    } catch (err) {
      console.error('Unexpected delete error:', err);
      alert('An unexpected error occurred while deleting');
      setIsDeleting(false);
      
      // If we did an optimistic update, we might need to refresh to revert
      if (onDeleteSuccess) {
        window.location.reload();
      }
    }
  };

  const handleCancelDelete = () => {
    setConfirmDialogOpen(false);
  };

  // Icon-only button
  if (iconOnly || variant === 'icon') {
    const iconButton = (
      <IconButton
        color={color}
        size={size}
        disabled={disabled || isDeleting}
        onClick={handleDeleteClick}
        sx={{ 
          '&:hover': { 
            backgroundColor: color === 'error' ? 'error.light' : 'action.hover' 
          }
        }}
      >
        {isDeleting ? (
          <CircularProgress size={size === 'small' ? 16 : 20} color="inherit" />
        ) : (
          <TrashIcon size={size === 'small' ? 16 : 20} />
        )}
      </IconButton>
    );

    return (
      <>
        {tooltip ? (
          <Tooltip title={tooltip || `Delete ${entityLabel}`}>
            {iconButton}
          </Tooltip>
        ) : (
          iconButton
        )}

        {/* ✅ Only show dialog if confirmDialog is true */}
        {confirmDialog && (
          <Dialog
            open={confirmDialogOpen}
            onClose={handleCancelDelete}
            aria-labelledby="delete-dialog-title"
            aria-describedby="delete-dialog-description"
          >
            <DialogTitle id="delete-dialog-title">
              Delete {entityLabel}?
            </DialogTitle>
            <DialogContent>
              <DialogContentText id="delete-dialog-description">
                Are you sure you want to delete "{displayName}"? 
                {!immediate && " This action cannot be undone and may also delete related data."}
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button 
                onClick={handleCancelDelete}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleConfirmDelete}
                color="error"
                variant="contained"
                disabled={isDeleting}
                startIcon={isDeleting ? <CircularProgress size={16} color="inherit" /> : <TrashIcon size={16} />}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </DialogActions>
          </Dialog>
        )}
      </>
    );
  }

  // Full button with text
  return (
    <>
      <Button
        color={color}
        variant={variant}
        size={size}
        startIcon={isDeleting ? <CircularProgress size={16} color="inherit" /> : <TrashIcon size={16} />}
        disabled={disabled || isDeleting}
        onClick={handleDeleteClick}
        sx={{ minWidth: variant === 'icon' ? 'auto' : undefined }}
      >
        {isDeleting ? 'Deleting...' : `Delete ${entityLabel}`}
      </Button>

      {/* ✅ Only show dialog if confirmDialog is true */}
      {confirmDialog && (
        <Dialog
          open={confirmDialogOpen}
          onClose={handleCancelDelete}
          aria-labelledby="delete-dialog-title"
          aria-describedby="delete-dialog-description"
        >
          <DialogTitle id="delete-dialog-title">
            Delete {entityLabel}?
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="delete-dialog-description">
              Are you sure you want to delete "{displayName}"? 
              {!immediate && " This action cannot be undone and may also delete related data."}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={handleCancelDelete}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmDelete}
              color="error"
              variant="contained"
              disabled={isDeleting}
              startIcon={isDeleting ? <CircularProgress size={16} color="inherit" /> : <TrashIcon size={16} />}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
}