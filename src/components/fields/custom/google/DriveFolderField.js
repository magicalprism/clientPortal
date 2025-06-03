'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Alert,
  Switch,
  FormControlLabel,
  CircularProgress,
  IconButton,
  Tooltip,
  Collapse
} from '@mui/material';
import { 
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
  DriveFileRenameOutline as RenameIcon,
  Launch as LaunchIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useGoogleDriveFolders } from '@/hooks/useGoogleDriveFolders';
import { useDriveRename } from '@/hooks/useDriveRename';

/**
 * Custom field type for Google Drive folder management
 * Handles creation, status display, and renaming automatically
 */
export const DriveFolderField = ({ 
  field, 
  record, 
  config, 
  onChange,
  onRecordUpdate,
  variant = 'full' // 'full', 'compact', 'minimal'
}) => {
  const [expanded, setExpanded] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Google Drive folder management
  const {
    isCreatingFolders,
    folderCreationError,
    foldersCreated,
    needsFolderCreation,
    createFolders,
    collectionType
  } = useGoogleDriveFolders({ record, config, onRecordUpdate });

  // Drive folder rename management
  const {
    isRenaming,
    renameError,
    renameSuccess,
    needsRename,
    performRename,
    originalName,
    currentName
  } = useDriveRename({ record, config, onRecordUpdate });

  // Auto-expand when there's activity
  useEffect(() => {
    if (isCreatingFolders || isRenaming || folderCreationError || renameError) {
      setExpanded(true);
    }
  }, [isCreatingFolders, isRenaming, folderCreationError, renameError]);

  // Don't render if this collection doesn't support Drive folders
  if (!collectionType) {
    return null;
  }

  const handleCreateFolderToggle = (enabled) => {
    onChange(field.name, enabled);
    if (enabled) {
      setExpanded(true);
    }
  };

  const getFolderUrl = () => {
    if (!record?.drive_folder_id) return null;
    return `https://drive.google.com/drive/folders/${record.drive_folder_id}`;
  };

  const getOverallStatus = () => {
    if (isCreatingFolders) return { type: 'creating', color: 'info', icon: CircularProgress };
    if (isRenaming) return { type: 'renaming', color: 'info', icon: CircularProgress };
    if (folderCreationError || renameError) return { type: 'error', color: 'error', icon: WarningIcon };
    if (renameSuccess) return { type: 'renamed', color: 'success', icon: CheckCircleIcon };
    if (foldersCreated && !needsRename) return { type: 'ready', color: 'success', icon: CheckCircleIcon };
    if (needsRename) return { type: 'needsRename', color: 'warning', icon: RenameIcon };
    if (needsFolderCreation) return { type: 'pending', color: 'warning', icon: FolderOpenIcon };
    if (record.create_folder && !foldersCreated) return { type: 'pending', color: 'warning', icon: FolderOpenIcon };
    return { type: 'disabled', color: 'default', icon: FolderIcon };
  };

  const status = getOverallStatus();
  const StatusIcon = status.icon;

  // Minimal variant - just a status chip
  if (variant === 'minimal') {
    if (!record.create_folder && !foldersCreated) return null;
    
    return (
      <Chip
        icon={status.icon === CircularProgress ? <CircularProgress size={16} /> : <StatusIcon sx={{ fontSize: 16 }} />}
        label={
          status.type === 'creating' ? 'Creating...' :
          status.type === 'renaming' ? 'Renaming...' :
          status.type === 'error' ? 'Error' :
          status.type === 'ready' ? 'Ready' :
          status.type === 'needsRename' ? 'Needs Rename' :
          status.type === 'pending' ? 'Pending' :
          'Folders'
        }
        color={status.color}
        variant="outlined"
        size="small"
        onClick={getFolderUrl() ? () => window.open(getFolderUrl(), '_blank') : undefined}
        clickable={!!getFolderUrl()}
      />
    );
  }

  // Compact variant - inline status
  if (variant === 'compact') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <FormControlLabel
          control={
            <Switch
              checked={record.create_folder || false}
              onChange={(e) => handleCreateFolderToggle(e.target.checked)}
              size="small"
            />
          }
          label="Drive Folders"
          sx={{ mr: 1 }}
        />
        
        {record.create_folder && (
          <>
            <Chip
              icon={status.icon === CircularProgress ? <CircularProgress size={16} /> : <StatusIcon sx={{ fontSize: 16 }} />}
              label={
                status.type === 'creating' ? 'Creating...' :
                status.type === 'renaming' ? 'Renaming...' :
                status.type === 'error' ? 'Error' :
                status.type === 'ready' ? 'Ready' :
                status.type === 'needsRename' ? 'Needs Rename' :
                'Pending'
              }
              color={status.color}
              size="small"
              variant="outlined"
            />
            
            {getFolderUrl() && (
              <IconButton 
                size="small" 
                onClick={() => window.open(getFolderUrl(), '_blank')}
                sx={{ p: 0.5 }}
              >
                <LaunchIcon sx={{ fontSize: 16 }} />
              </IconButton>
            )}
          </>
        )}
      </Box>
    );
  }

  // Full variant - complete interface
  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent sx={{ pb: '16px !important' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FolderIcon />
            {field.label || 'Google Drive Folders'}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Status chip */}
            <Chip
              icon={status.icon === CircularProgress ? <CircularProgress size={16} /> : <StatusIcon sx={{ fontSize: 16 }} />}
              label={
                status.type === 'creating' ? 'Creating Folders...' :
                status.type === 'renaming' ? 'Renaming Folder...' :
                status.type === 'error' ? 'Error' :
                status.type === 'renamed' ? 'Renamed' :
                status.type === 'ready' ? 'Ready' :
                status.type === 'needsRename' ? 'Needs Rename' :
                status.type === 'pending' ? 'Pending' :
                'Disabled'
              }
              color={status.color}
              size="small"
              variant={record.create_folder ? 'filled' : 'outlined'}
            />
            
            {/* Expand/collapse button */}
            <IconButton 
              size="small" 
              onClick={() => setExpanded(!expanded)}
              disabled={!record.create_folder}
            >
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
        </Box>

        {/* Enable/Disable Switch */}
        <FormControlLabel
          control={
            <Switch
              checked={record.create_folder || false}
              onChange={(e) => handleCreateFolderToggle(e.target.checked)}
            />
          }
          label="Enable Google Drive folder creation for this record"
        />

        {/* Expanded Content */}
        <Collapse in={expanded && record.create_folder}>
          <Box sx={{ mt: 2 }}>
            {/* Folder Creation Status */}
            {isCreatingFolders && (
              <Alert severity="info" icon={<CircularProgress size={20} />} sx={{ mb: 2 }}>
                Creating folder structure for "{record.title || 'this record'}"...
              </Alert>
            )}

            {foldersCreated && !needsRename && (
              <Alert 
                severity="success" 
                sx={{ mb: 2 }}
                action={
                  getFolderUrl() && (
                    <Button 
                      color="inherit" 
                      size="small" 
                      onClick={() => window.open(getFolderUrl(), '_blank')}
                      endIcon={<LaunchIcon />}
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
                sx={{ mb: 2 }}
                action={
                  <Button 
                    color="inherit" 
                    size="small" 
                    onClick={createFolders}
                    startIcon={<RefreshIcon />}
                  >
                    Retry
                  </Button>
                }
              >
                <Typography variant="body2" component="div">
                  <strong>Folder creation failed:</strong><br />
                  {folderCreationError}
                </Typography>
              </Alert>
            )}

            {needsFolderCreation && !isCreatingFolders && (
              <Alert 
                severity="warning" 
                sx={{ mb: 2 }}
                action={
                  <Button 
                    color="inherit" 
                    size="small" 
                    onClick={createFolders}
                    startIcon={<FolderIcon />}
                  >
                    Create Folders
                  </Button>
                }
              >
                Folder creation is enabled but folders haven't been created yet.
              </Alert>
            )}

            {/* Rename Status */}
            {isRenaming && (
              <Alert severity="info" icon={<CircularProgress size={20} />} sx={{ mb: 2 }}>
                Renaming folder from "{originalName}" to "{currentName}"...
              </Alert>
            )}

            {renameSuccess && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Folder successfully renamed to "{currentName}"
              </Alert>
            )}

            {renameError && (
              <Alert 
                severity="error" 
                sx={{ mb: 2 }}
                action={
                  <Button 
                    color="inherit" 
                    size="small" 
                    onClick={performRename}
                    startIcon={<RefreshIcon />}
                  >
                    Retry
                  </Button>
                }
              >
                <Typography variant="body2" component="div">
                  <strong>Folder rename failed:</strong><br />
                  {renameError}
                </Typography>
              </Alert>
            )}

            {needsRename && !isRenaming && (
              <Alert 
                severity="warning" 
                sx={{ mb: 2 }}
                action={
                  <Button 
                    color="inherit" 
                    size="small" 
                    onClick={performRename}
                    startIcon={<RenameIcon />}
                  >
                    Rename Folder
                  </Button>
                }
              >
                <Typography variant="body2" component="div">
                  The record name changed from "{originalName}" to "{currentName}".
                  <br />
                  The Google Drive folder should be renamed to match.
                </Typography>
              </Alert>
            )}

            {/* Debug Info */}
            {process.env.NODE_ENV === 'development' && (
              <Box sx={{ mt: 2 }}>
                <Button
                  size="small"
                  variant="text"
                  onClick={() => setShowDetails(!showDetails)}
                  startIcon={<InfoIcon />}
                >
                  Debug Info
                </Button>
                <Collapse in={showDetails}>
                  <Box sx={{ mt: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="caption" component="div">
                      <strong>Collection:</strong> {collectionType}<br />
                      <strong>Drive Folder ID:</strong> {record.drive_folder_id || 'None'}<br />
                      <strong>Original Name:</strong> {record.drive_original_name || 'None'}<br />
                      <strong>Current Title:</strong> {record.title || 'None'}<br />
                      <strong>Needs Creation:</strong> {String(needsFolderCreation)}<br />
                      <strong>Needs Rename:</strong> {String(needsRename)}<br />
                      <strong>Folders Created:</strong> {String(foldersCreated)}
                    </Typography>
                  </Box>
                </Collapse>
              </Box>
            )}
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};