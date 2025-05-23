'use client';

import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  IconButton, 
  Typography, 
  Menu,
  MenuItem
} from '@mui/material';
import { 
  X as XIcon, 
  DownloadSimple, 
  LinkSimple, 
  CaretDown,
  Upload,
  Link as LinkIcon
} from '@phosphor-icons/react';
import { MediaUploadSingleModal } from '../old/modals/MediaUploadSingleModal';
import { MediaLibraryPicker } from '../MediaLibraryPicker';
import { ExternalLinkModal } from '../modals/ExternalLinkModal';
import { MediaPreviewCard } from '../old/components/MediaPreviewCard';

export const SingleMediaField = ({
  field,
  record,
  config,
  mediaItem,
  allOptions,
  onChange,
  onUploadComplete,
  onExternalLinkAdd,
  allowUpload = true,
  allowExternalLink = true,
  uploadConfig = {},
  previewConfig = {}
}) => {
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [libraryModalOpen, setLibraryModalOpen] = useState(false);
  const [externalLinkModalOpen, setExternalLinkModalOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);

  const handleMenuClick = (event) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleUploadClick = () => {
    setUploadModalOpen(true);
    handleMenuClose();
  };

  const handleLibraryClick = () => {
    setLibraryModalOpen(true);
    handleMenuClose();
  };

  const handleExternalLinkClick = () => {
    setExternalLinkModalOpen(true);
    handleMenuClose();
  };

  const handleUploadCompleteInternal = async (media) => {
    if (media?.id) {
      // Fetch full media details
      const fullMedia = allOptions.find(opt => opt.id === media.id) || media;
      onUploadComplete(fullMedia);
    }
    setUploadModalOpen(false);
  };

  const handleLibrarySelect = (selectedMedia) => {
    onChange(selectedMedia);
    setLibraryModalOpen(false);
  };

  const handleExternalLinkComplete = (linkData) => {
    onExternalLinkAdd(linkData);
    setExternalLinkModalOpen(false);
  };

  const handleRemove = () => {
    onChange(null);
  };

  const hasMedia = !!mediaItem;
  const isImage = mediaItem?.mime_type?.startsWith('image');
  const isFolder = mediaItem?.is_folder === true;
  const isExternal = mediaItem?.is_external === true;

  // Create menu options based on configuration
  const menuOptions = [];
  if (allowUpload) {
    menuOptions.push({
      label: 'Upload New File',
      icon: Upload,
      onClick: handleUploadClick
    });
  }
  
  menuOptions.push({
    label: 'Choose from Library', 
    icon: LinkSimple,
    onClick: handleLibraryClick
  });

  if (allowExternalLink) {
    menuOptions.push({
      label: 'Add External Link',
      icon: LinkIcon,
      onClick: handleExternalLinkClick
    });
  }

  return (
    <>
      <Box display="flex" flexDirection="column" gap={2} width="100%">
        {hasMedia ? (
          <MediaPreviewCard
            media={mediaItem}
            onRemove={handleRemove}
            field={field}
            showControls={true}
            {...previewConfig}
          />
        ) : (
          <Box
            sx={{
              minHeight: 200,
              border: '2px dashed #ccc',
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f9f6ff',
              textAlign: 'center',
              p: 3
            }}
          >
            <Typography variant="body2" color="text.secondary">
              No media selected
            </Typography>
          </Box>
        )}

        <Box display="flex" gap={1}>
          {menuOptions.length > 1 ? (
            <>
              <Button
                variant="outlined"
                onClick={handleMenuClick}
                endIcon={<CaretDown size={16} />}
                fullWidth
              >
                {hasMedia ? 'Change Media' : 'Add Media'}
              </Button>
              <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={handleMenuClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'left',
                }}
              >
                {menuOptions.map((option, index) => {
                  const IconComponent = option.icon;
                  return (
                    <MenuItem key={index} onClick={option.onClick}>
                      <IconComponent size={16} style={{ marginRight: 8 }} />
                      {option.label}
                    </MenuItem>
                  );
                })}
              </Menu>
            </>
          ) : menuOptions.length > 0 ? (
            <Button
              variant="outlined"
              onClick={menuOptions[0]?.onClick}
              startIcon={menuOptions[0]?.icon ? React.createElement(menuOptions[0].icon, { size: 16 }) : null}
              fullWidth
            >
              {hasMedia ? 'Change Media' : menuOptions[0]?.label}
            </Button>
          ) : null}

          {hasMedia && (
            <IconButton
              component="a"
              href={mediaItem.url}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                color: 'white',
                backgroundColor: 'primary.main',
              }}
            >
              {isFolder || isExternal ? <LinkSimple size={20} /> : <DownloadSimple size={20} />}
            </IconButton>
          )}
        </Box>
      </Box>

      {/* Upload Modal */}
      <MediaUploadSingleModal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onUploadComplete={handleUploadCompleteInternal}
        record={record}
        field={field}
        config={config}
        existingMedia={mediaItem}
        {...uploadConfig}
      />

      {/* Library Picker Modal */}
      <MediaLibraryPicker
        open={libraryModalOpen}
        onClose={() => setLibraryModalOpen(false)}
        onSelect={handleLibrarySelect}
        record={record}
        multi={false}
      />

      {/* External Link Modal */}
      <ExternalLinkModal
        open={externalLinkModalOpen}
        onClose={() => setExternalLinkModalOpen(false)}
        onComplete={handleExternalLinkComplete}
        field={field}
      />
    </>
  );
};