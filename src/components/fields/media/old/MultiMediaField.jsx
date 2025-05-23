'use client';

import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Grid, 
  Card,
  CardContent,
  Typography,
  Menu,
  MenuItem
} from '@mui/material';
import { 
  Plus, 
  CaretDown,
  Upload,
  LinkSimple,
  Link as LinkIcon
} from '@phosphor-icons/react';
import { MediaUploadGalleryModal } from '../old/modals/MediaUploadGalleryModal';
import { MediaLibraryPicker } from '../MediaLibraryPicker';
import { ExternalLinkModal } from '../modals/ExternalLinkModal';
import { MediaPreviewCard } from '../old/components/MediaPreviewCard';

export const MultiMediaField = ({
  field,
  record,
  config,
  mediaItems = [],
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

  const handleUploadCompleteInternal = (newMediaItems) => {
    let itemsToAdd = [];
    
    if (typeof newMediaItems === 'function') {
      // Handle callback function from upload modal
      itemsToAdd = newMediaItems(mediaItems);
    } else if (Array.isArray(newMediaItems)) {
      itemsToAdd = [...mediaItems, ...newMediaItems];
    } else if (newMediaItems) {
      itemsToAdd = [...mediaItems, newMediaItems];
    } else {
      itemsToAdd = mediaItems;
    }

    onChange(itemsToAdd);
    setUploadModalOpen(false);
  };

  const handleLibrarySelect = (selectedMedia) => {
    if (Array.isArray(selectedMedia)) {
      onChange([...mediaItems, ...selectedMedia]);
    } else {
      onChange([...mediaItems, selectedMedia]);
    }
    setLibraryModalOpen(false);
  };

  const handleExternalLinkComplete = (linkData) => {
    onExternalLinkAdd(linkData);
    setExternalLinkModalOpen(false);
  };

  const handleRemove = (mediaId) => {
    const updatedItems = mediaItems.filter(item => item.id !== mediaId);
    onChange(updatedItems);
  };

  // Create menu options based on configuration
  const menuOptions = [];
  if (allowUpload) {
    menuOptions.push({
      label: 'Upload New Files',
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
        <Grid container spacing={2}>
          {mediaItems.map((media) => (
            <Grid item xs={12} sm={6} md={4} key={media.id}>
              <MediaPreviewCard 
                media={media} 
                onRemove={() => handleRemove(media.id)} 
                field={field}
                showControls={true}
                {...previewConfig}
              />
            </Grid>
          ))}
          
          {/* Add Media Card */}
          <Grid item xs={12} sm={6} md={4}>
            <Card 
              sx={{ 
                height: '100%', 
                minHeight: 200, 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px dashed #ccc',
                borderRadius: 2,
                cursor: 'pointer',
                bgcolor: 'background.paper',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: 'primary.50'
                }
              }}
              onClick={menuOptions.length === 1 ? menuOptions[0]?.onClick : handleMenuClick}
            >
              <CardContent sx={{ textAlign: 'center' }}>
                <Plus size={32} weight="light" />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Add Media
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Action Button */}
        <Box display="flex" gap={1}>
          {menuOptions.length > 1 ? (
            <>
              <Button 
                variant="outlined" 
                onClick={handleMenuClick}
                startIcon={<Plus size={16} />}
                endIcon={<CaretDown size={16} />}
                fullWidth
              >
                Add Media
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
              {menuOptions[0]?.label}
            </Button>
          ) : null}
        </Box>
      </Box>

      {/* Upload Modal */}
      <MediaUploadGalleryModal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onUploadComplete={handleUploadCompleteInternal}
        record={record}
        field={field}
        config={config}
        {...uploadConfig}
      />

      {/* Library Picker Modal */}
      <MediaLibraryPicker
        open={libraryModalOpen}
        onClose={() => setLibraryModalOpen(false)}
        onSelect={handleLibrarySelect}
        record={record}
        multi={true}
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