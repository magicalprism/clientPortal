'use client';

import React from 'react';
import { 
  Box, 
  Chip, 
  Button, 
  CircularProgress, 
  Alert,
  Typography,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  PencilSimple,
  ArrowsClockwise,
  CheckCircle,
  Warning,
  Info
} from '@phosphor-icons/react';
import { useDriveRename } from '@/hooks/google/useDriveRename';

/**
 * Component to display and manage Google Drive folder rename status
 * Shows when folder names are out of sync and provides rename functionality
 */
export const GoogleDriveRenameStatus = ({ 
  record, 
  config, 
  onRecordUpdate,
  variant = 'full', // 'full', 'compact', 'chip-only'
  showActions = true,
  autoRename = false // Whether to automatically rename on detection
}) => {
  const {
    isRenaming,
    renameError,
    renameSuccess,
    needsRename,
    performRename,
    originalName,
    currentName,
    collectionType
  } = useDriveRename({ record, config, onRecordUpdate });

  // Don't render if this collection type doesn't support folders or no folder exists
  if (!collectionType || !record?.drive_folder_id) {
    return null;
  }

  // Don't render if no rename is needed and no recent rename activity
  if (!needsRename && !isRenaming && !renameError && !renameSuccess) {
    return null;
  }

  // Render chip-only variant
  if (variant === 'chip-only') {
    if (isRenaming) {
      return (
        <Chip
          icon={<CircularProgress size={16} />}
          label="Renaming..."
          color="info"
          variant="outlined"
          size="small"
        />
      );
    }

    if (renameError) {
      return (
        <Chip
          icon={<Warning size={16} />}
          label="Rename Failed"
          color="error"
          variant="outlined"
          size="small"
        />
      );
    }

    if (renameSuccess) {
      return (
        <Chip
          icon={<CheckCircle size={16} />}
          label="Renamed"
          color="success"
          variant="outlined"
          size="small"
        />
      );
    }

    if (needsRename) {
      return (
        <Chip
          icon={<PencilSimple size={16} />}
          label="Needs Rename"
          color="warning"
          variant="outlined"
          size="small"
          onClick={showActions ? performRename : undefined}
          clickable={showActions}
        />
      );
    }

    return null;
  }

  // Render compact variant
  if (variant === 'compact') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {isRenaming && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <CircularProgress size={16} />
            <Typography variant="caption" color="text.secondary">
              Renaming folder...
            </Typography>
          </Box>
        )}

        {renameSuccess && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <CheckCircle size={16} color="#2e7d32" />
            <Typography variant="caption" color="success.main">
              Folder renamed
            </Typography>
          </Box>
        )}

        {renameError && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Warning size={16} color="#d32f2f" />
            <Typography variant="caption" color="error.main">
              Rename failed
            </Typography>
            {showActions && (
              <Tooltip title="Retry rename">
                <IconButton 
                  size="small" 
                  onClick={performRename}
                  sx={{ p: 0.25 }}
                >
                  <ArrowsClockwise size={14} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        )}

        {needsRename && !isRenaming && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <PencilSimple size={16} color="#ed6c02" />
            <Typography variant="caption" color="warning.main">
              Name changed
            </Typography>
            {showActions && (
              <Button 
                size="small" 
                onClick={performRename}
                variant="outlined"
                sx={{ minWidth: 'auto', px: 1, py: 0.25, fontSize: '0.75rem' }}
              >
                Rename
              </Button>
            )}
          </Box>
        )}
      </Box>
    );
  }

  // Render full variant
  return (
    <Box sx={{ mb: 2 }}>
      {(needsRename || isRenaming || renameError || renameSuccess) && (
        <>
          <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <PencilSimple size={18} />
            Folder Name Sync
          </Typography>

          {isRenaming && (
            <Alert 
              severity="info" 
              icon={<CircularProgress size={20} />}
              sx={{ mb: 1 }}
            >
              Renaming Google Drive folder from "{originalName}" to "{currentName}"...
            </Alert>
          )}

          {renameSuccess && (
            <Alert 
              severity="success" 
              sx={{ mb: 1 }}
            >
              <Typography variant="body2">
                Folder successfully renamed to <strong>"{currentName}"</strong>
              </Typography>
            </Alert>
          )}

          {renameError && (
            <Alert 
              severity="error" 
              sx={{ mb: 1 }}
              action={
                showActions && (
                  <Button 
                    color="inherit" 
                    size="small" 
                    onClick={performRename}
                    startIcon={<ArrowsClockwise size={16} />}
                  >
                    Retry
                  </Button>
                )
              }
            >
              <Typography variant="body2" component="div">
                <strong>Folder rename failed:</strong>
                <br />
                {renameError}
              </Typography>
            </Alert>
          )}

          {needsRename && !isRenaming && (
            <Alert 
              severity="warning" 
              sx={{ mb: 1 }}
              action={
                showActions && (
                  <Button 
                    color="inherit" 
                    size="small" 
                    onClick={performRename}
                    startIcon={<PencilSimple size={16} />}
                  >
                    Rename Folder
                  </Button>
                )
              }
            >
              <Typography variant="body2" component="div">
                The {collectionType} name changed from <strong>"{originalName}"</strong> to <strong>"{currentName}"</strong>.
                <br />
                The Google Drive folder still has the old name and should be renamed to match.
              </Typography>
            </Alert>
          )}

          {/* Debug info in development */}
          {process.env.NODE_ENV === 'development' && (
            <Box sx={{ mt: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="caption" component="div">
                <strong>Debug:</strong> Original: "{originalName}", Current: "{currentName}", 
                Needs Rename: {String(needsRename)}, Folder ID: {record?.drive_folder_id}
              </Typography>
            </Box>
          )}
        </>
      )}
    </Box>
  );
};