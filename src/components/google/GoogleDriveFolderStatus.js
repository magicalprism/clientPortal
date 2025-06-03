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
  Folder, 
  FolderOpen,
  ArrowClockwise,
  Warning,
  CheckCircle,
  ArrowSquareOut
} from '@phosphor-icons/react';
import { useGoogleDriveFolders } from '@/hooks/google/useGoogleDriveFolders';

/**
 * Component to display and manage Google Drive folder status
 * Can be used in modals, detail views, or anywhere folder status is relevant
 */
export const GoogleDriveFolderStatus = ({ 
  record, 
  config, 
  onRecordUpdate,
  variant = 'full', // 'full', 'compact', 'chip-only'
  showActions = true 
}) => {
  const {
    isCreatingFolders,
    folderCreationError,
    foldersCreated,
    needsFolderCreation,
    createFolders,
    collectionType
  } = useGoogleDriveFolders({ record, config, onRecordUpdate });

  // Don't render if this collection type doesn't support folders
  if (!collectionType || !record?.create_folder) {
    return null;
  }

  // Generate folder URL (if available)
  const getFolderUrl = () => {
    if (!record?.drive_folder_id) return null;
    return `https://drive.google.com/drive/folders/${record.drive_folder_id}`;
  };

  // Render chip-only variant
  if (variant === 'chip-only') {
    if (isCreatingFolders) {
      return (
        <Chip
          icon={<CircularProgress size={16} />}
          label="Creating..."
          color="info"
          variant="outlined"
          size="small"
        />
      );
    }

    if (foldersCreated) {
      const folderUrl = getFolderUrl();
      return (
        <Chip
          icon={<Folder size={16} />}
          label="Folders Ready"
          color="success"
          variant="outlined"
          size="small"
          onClick={folderUrl ? () => window.open(folderUrl, '_blank') : undefined}
          clickable={!!folderUrl}
        />
      );
    }

    if (folderCreationError) {
      return (
        <Chip
          icon={<Warning size={16} />}
          label="Folder Error"
          color="error"
          variant="outlined"
          size="small"
        />
      );
    }

    if (needsFolderCreation) {
      return (
        <Chip
          icon={<FolderOpen size={16} />}
          label="Pending"
          color="warning"
          variant="outlined"
          size="small"
        />
      );
    }

    return null;
  }

  // Render compact variant
  if (variant === 'compact') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {isCreatingFolders && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <CircularProgress size={16} />
            <Typography variant="caption" color="text.secondary">
              Creating folders...
            </Typography>
          </Box>
        )}

        {foldersCreated && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <CheckCircle size={16} style={{ color: 'var(--mui-palette-success-main)' }} />
            <Typography variant="caption" color="success.main">
              Folders ready
            </Typography>
            {getFolderUrl() && (
              <IconButton 
                size="small" 
                onClick={() => window.open(getFolderUrl(), '_blank')}
                sx={{ p: 0.25 }}
              >
                <ArrowSquareOut size={14} />
              </IconButton>
            )}
          </Box>
        )}

        {folderCreationError && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Warning size={16} style={{ color: 'var(--mui-palette-error-main)' }} />
            <Typography variant="caption" color="error.main">
              Folder error
            </Typography>
            {showActions && (
              <Tooltip title="Retry folder creation">
                <IconButton 
                  size="small" 
                  onClick={createFolders}
                  sx={{ p: 0.25 }}
                >
                  <ArrowClockwise size={14} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        )}

        {needsFolderCreation && !isCreatingFolders && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <FolderOpen size={16} style={{ color: 'var(--mui-palette-warning-main)' }} />
            <Typography variant="caption" color="warning.main">
              Folders pending
            </Typography>
            {showActions && (
              <Button 
                size="small" 
                onClick={createFolders}
                variant="outlined"
                sx={{ minWidth: 'auto', px: 1, py: 0.25, fontSize: '0.75rem' }}
              >
                Create
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
      <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Folder size={18} />
        Google Drive Folders
      </Typography>

      {isCreatingFolders && (
        <Alert 
          severity="info" 
          icon={<CircularProgress size={20} />}
          sx={{ mb: 1 }}
        >
          Creating folder structure for {record.title}...
        </Alert>
      )}

      {foldersCreated && (
        <Alert 
          severity="success" 
          sx={{ mb: 1 }}
          action={
            getFolderUrl() && (
              <Button 
                color="inherit" 
                size="small" 
                onClick={() => window.open(getFolderUrl(), '_blank')}
                endIcon={<ArrowSquareOut size={16} />}
              >
                Open Folder
              </Button>
            )
          }
        >
          Folder structure created and ready to use.
        </Alert>
      )}

      {folderCreationError && (
        <Alert 
          severity="error" 
          sx={{ mb: 1 }}
          action={
            showActions && (
              <Button 
                color="inherit" 
                size="small" 
                onClick={createFolders}
                startIcon={<ArrowClockwise size={16} />}
              >
                Retry
              </Button>
            )
          }
        >
          <Typography variant="body2" component="div">
            <strong>Folder creation failed:</strong>
            <br />
            {folderCreationError}
          </Typography>
        </Alert>
      )}

      {needsFolderCreation && !isCreatingFolders && (
        <Alert 
          severity="warning" 
          sx={{ mb: 1 }}
          action={
            showActions && (
              <Button 
                color="inherit" 
                size="small" 
                onClick={createFolders}
                startIcon={<Folder size={16} />}
              >
                Create Folders
              </Button>
            )
          }
        >
          This {collectionType} is configured to create folders, but they haven't been created yet.
        </Alert>
      )}

      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <Box sx={{ mt: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="caption" component="div">
            <strong>Debug:</strong> Collection: {collectionType}, Create Folder: {String(record?.create_folder)}, 
            Drive ID: {record?.drive_folder_id || 'None'}
          </Typography>
        </Box>
      )}
    </Box>
  );
};