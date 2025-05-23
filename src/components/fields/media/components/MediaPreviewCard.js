'use client';

import React from 'react';
import { Box, Card, CardMedia, CardContent, Typography, IconButton, Tooltip } from '@mui/material';
import { X as XIcon, DownloadSimple, LinkSimple, Copy, PencilSimple, Eye } from '@phosphor-icons/react';
import { fileTypeIcons } from '@/data/fileTypeIcons';

/**
 * Get media title based on config field priority
 */
const getMediaTitle = (media, config) => {
  // Try to get title field configuration
  const titleField = config?.fields?.find(f => f.name === 'title');
  const altTextField = config?.fields?.find(f => f.name === 'alt_text');
  
  // Use configured field priority or fallback
  if (titleField && media?.title) {
    return media.title;
  }
  
  if (altTextField && media?.alt_text) {
    return media.alt_text;
  }
  
  // Fallback to any available title-like field
  return media?.title || media?.alt_text || media?.original_title || `ID: ${media?.id}`;
};

/**
 * Get media subtitle/description based on config
 */
const getMediaSubtitle = (media, config) => {
  const copyrightField = config?.fields?.find(f => f.name === 'copyright');
  const descriptionField = config?.fields?.find(f => f.name === 'description');
  
  if (copyrightField && media?.copyright) {
    return `© ${media.copyright}`;
  }
  
  if (descriptionField && media?.description) {
    return media.description;
  }
  
  return null;
};

export const MediaPreviewCard = ({ 
  media, 
  onRemove, 
  onEdit,
  field, 
  config = {},
  showControls = true,
  showTitle = true,
  showSubtitle = true,
  aspectRatio = 'auto'
}) => {
  if (!media) return null;

  const previewUrl = media?.url || '';
  const isImage = media?.mime_type?.startsWith('image');
  const isFolder = media?.is_folder === true;
  const isExternal = media?.is_external === true || media?.mime_type?.startsWith('external/');
  const mime = media?.mime_type || '';
  
  const title = getMediaTitle(media, config);
  const subtitle = getMediaSubtitle(media, config);
  
  // Get file type icon based on config or fallback
  const FileIcon = isFolder 
    ? fileTypeIcons?.folder 
    : fileTypeIcons?.[mime] || fileTypeIcons?.default;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(previewUrl);
  };

  // Get display preferences from config
  const statusField = config?.fields?.find(f => f.name === 'status');
  const showStatus = statusField && media?.status;

  return (
    <Card 
      sx={{ 
        position: 'relative',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        ...(isExternal && {
          border: '2px solid',
          borderColor: 'info.main',
          '&::before': {
            content: '"External"',
            position: 'absolute',
            top: 4,
            left: 4,
            backgroundColor: 'info.main',
            color: 'white',
            fontSize: '0.75rem',
            px: 1,
            py: 0.5,
            borderRadius: 1,
            zIndex: 1
          }
        })
      }}
    >
      <Box 
        sx={{ 
          position: 'relative',
          height: aspectRatio === 'auto' ? 200 : 0,
          paddingTop: aspectRatio !== 'auto' ? aspectRatio : 0,
          backgroundColor: '#f9f6ff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {isFolder ? (
          <Box textAlign="center">
            {FileIcon && <FileIcon size={48} weight="duotone" />}
            <Typography variant="body2" fontWeight={500}>
              Folder
            </Typography>
          </Box>
        ) : isImage && !isExternal ? (
          <CardMedia
            component="img"
            image={previewUrl}
            alt={media?.alt_text || field?.label || 'Media preview'}
            sx={{ 
              height: '100%',
              width: '100%',
              objectFit: 'cover',
              position: aspectRatio !== 'auto' ? 'absolute' : 'static',
              top: 0,
              left: 0
            }}
          />
        ) : (
          <Box textAlign="center">
            {FileIcon && <FileIcon size={48} weight="duotone" />}
            <Typography variant="body2" fontWeight={500}>
              {isExternal ? 'External Link' : title}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {mime || 'Unknown type'}
            </Typography>
          </Box>
        )}

        {showControls && (
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              display: 'flex',
              gap: 0.5,
            }}
          >
            {onEdit && (
              <Tooltip title="Edit">
                <IconButton
                  size="small"
                  onClick={(event) => {
                    onEdit(media, event.currentTarget); // send anchorEl
                  }}
                  sx={{
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,1)',
                      color: 'primary.main'
                    }
                  }}
                >
                  <PencilSimple size={16} />
                </IconButton>
              </Tooltip>
            )}
            
            {onRemove && (
              <Tooltip title="Remove">
                <IconButton
                  size="small"
                  onClick={onRemove}
                  sx={{
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,1)',
                    }
                  }}
                >
                  <XIcon size={16} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        )}
      </Box>

      {/* ✅ FIXED: Reduced padding and spacing for content section */}
      <CardContent sx={{ flexGrow: 1, p: 1.5, pb: 0.5 }}>
        {showTitle && (
          <Typography variant="subtitle2" fontWeight={500} noWrap sx={{ mb: 0.5 }}>
            {title}
          </Typography>
        )}
        
        {showSubtitle && subtitle && (
          <Typography variant="caption" color="text.secondary" display="block" noWrap sx={{ mb: 0.5 }}>
            {subtitle}
          </Typography>
        )}
        
        {showStatus && (
          <Box sx={{ mt: 0.5 }}>
            <Typography 
              variant="caption" 
              sx={{ 
                backgroundColor: media.status === 'uploaded' ? 'success.light' : 'info.light',
                color: media.status === 'uploaded' ? 'success.contrastText' : 'info.contrastText',
                px: 1,
                py: 0.5,
                borderRadius: 1,
                textTransform: 'capitalize'
              }}
            >
              {media.status}
            </Typography>
          </Box>
        )}
      </CardContent>

      {/* ✅ FIXED: Reduced padding and added third button */}
      {showControls && (
        <Box sx={{ display: 'flex', p: 0.5, pt: 0, justifyContent: 'space-between', gap: 0.5 }}>
          {/* Left side - Open/View button */}
          <Tooltip title={isFolder ? "Open folder" : isExternal ? "Open link" : "View file"}>
            <IconButton
              component="a"
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              size="small"
              sx={{ 
                color: 'primary.main',
                backgroundColor: 'primary.50',
                '&:hover': {
                  backgroundColor: 'primary.100'
                }
              }}
            >
              {isFolder || isExternal ? <LinkSimple size={18} /> : <Eye size={18} />}
            </IconButton>
          </Tooltip>

          {/* Right side - Copy and Download buttons */}
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="Copy URL">
              <IconButton
                size="small"
                onClick={copyToClipboard}
                sx={{ color: 'text.secondary' }}
              >
                <Copy size={16} />
              </IconButton>
            </Tooltip>
            
            <Tooltip title={isExternal ? "Open in new tab" : "Download file"}>
              <IconButton
                component="a"
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                size="small"
                sx={{ color: 'text.secondary' }}
              >
                <DownloadSimple size={16} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      )}
    </Card>
  );
};