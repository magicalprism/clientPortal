'use client';

import React from 'react';
import { Box, Typography, IconButton, Tooltip } from '@mui/material';
import { 
  LinkSimple, 
  Copy, 
  PencilSimple, 
  Eye, 
  X as XIcon 
} from '@phosphor-icons/react';
import { fileTypeIcons } from '@/data/fileTypeIcons';

/**
 * SimpleThumbnailTemplate - A simpler thumbnail template for media items
 * 
 * Features:
 * - Two-column layout: image/icon on left, title and actions on right
 * - Icons directly below title in right column
 * - Icons always visible (not just on hover)
 * - Hover effect changes icon color, not background
 */
export const SimpleThumbnailTemplate = ({ 
  media, 
  onRemove, 
  onEdit,
  showControls = true,
  size = 'medium' // 'small' | 'medium' | 'large'
}) => {
  if (!media) return null;

  const previewUrl = media?.url || '';
  const isImage = media?.mime_type?.startsWith('image');
  const isFolder = media?.is_folder === true;
  const isExternal = media?.is_external === true || media?.mime_type?.startsWith('external/');
  const mime = media?.mime_type || '';
  
  // Get title from media
  const title = media?.title || media?.alt_text || media?.original_title || `ID: ${media?.id}`;
  
  // Get file type icon based on mime type or fallback
  const FileIcon = isFolder 
    ? fileTypeIcons?.folder 
    : fileTypeIcons?.[mime] || fileTypeIcons?.default;

  // Copy URL to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(previewUrl);
  };

  // Fixed thumbnail size
  const thumbnailSize = {
    small: { width: 40, height: 40, iconSize: 14 },
    medium: { width: 40, height: 40, iconSize: 14 },
    large: { width: 40, height: 40, iconSize: 14 }
  }[size] || { width: 40, height: 40, iconSize: 14 };

  return (
    <Box 
      sx={{ 
        display: 'flex',
        width: '100%',
        p: 0, // No padding at all
        borderRadius: 0, // No border radius
        position: 'relative', // For absolute positioning of X button
      }}
    >
      {/* Left column - Image/Icon with no padding */}
      <Box 
        sx={{ 
          position: 'relative',
          width: thumbnailSize.width,
          height: thumbnailSize.height,
          overflow: 'hidden',
          
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isImage ? 'transparent' : 'background.paper',
          m: 0, // No margin
          mr: 1,
        }}
      >
        {isImage ? (
          <Box
            component="img"
            src={previewUrl}
            alt={title}
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <Box sx={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            p: 0, // No padding
            m: 0, // No margin
          }}>
            {FileIcon && <FileIcon size={thumbnailSize.width / 1} />}
          </Box>
        )}
      </Box>

      {/* Right column - Title and Actions stacked vertically */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'flex-start', 
        flex: 1, 
        minWidth: 0,
        p: 0, // No padding
        m: 0, // No margin
      }}>
        {/* Title */}
        <Typography 
          variant="caption"
          sx={{ 
            mb: 0.25, // Minimal space between title and icons
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            p: 0, // No padding
          }}
        >
          {title}
        </Typography>

        {/* Action Icons - directly below title - always visible */}
        {showControls && (
          <Box 
            sx={{ 
              display: 'flex',
              justifyContent: 'flex-start', // Left aligned
              gap: 1,
              p: 0, // No padding
              m: 0, // No margin
              height: 14, // Explicit height to match icon size
            }}
          >
            {/* View/Open button */}
            <Tooltip title={isFolder ? "Open folder" : isExternal ? "Open link" : "View file"}>
              <IconButton
                component="a"
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                disableRipple
                sx={{ 
                  p: 0,
                  m: 0,
                  minWidth: 0,
                  minHeight: 0,
                  width: 14,
                  height: 14,
                  '&:hover': {
                    color: 'primary.main', // Change color on hover
                  },
                }}
              >
                {isFolder || isExternal ? <LinkSimple size={14} /> : <Eye size={14} />}
              </IconButton>
            </Tooltip>

            {/* Copy URL button */}
            <Tooltip title="Copy URL">
              <IconButton
                disableRipple
                onClick={copyToClipboard}
                sx={{ 
                  p: 0,
                  m: 0,
                  minWidth: 0,
                  minHeight: 0,
                  width: 14,
                  height: 14,
                  '&:hover': {
                    color: 'primary.main', // Change color on hover
                  },
                }}
              >
                <Copy size={14} />
              </IconButton>
            </Tooltip>

            {/* Edit button (if provided) */}
            {onEdit && (
              <Tooltip title="Edit">
                <IconButton
                  disableRipple
                  onClick={(event) => {
                    onEdit(media, event.currentTarget);
                  }}
                  sx={{ 
                    p: 0,
                    m: 0,
                    minWidth: 0,
                    minHeight: 0,
                    width: 14,
                    height: 14,
                    '&:hover': {
                      color: 'primary.main', // Change color on hover
                    },
                  }}
                >
                  <PencilSimple size={14} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        )}
      </Box>
      
      {/* Remove button (at far right/top corner) - always visible */}
      {showControls && onRemove && (
        <IconButton
          disableRipple
          onClick={onRemove}
          sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: 14,
            height: 14,
            p: 0,
            m: 0,
            minWidth: 0,
            minHeight: 0,
            '&:hover': {
              color: 'primary.main', // Change color on hover
            },
          }}
        >
          <XIcon size={12} />
        </IconButton>
      )}
    </Box>
  );
};