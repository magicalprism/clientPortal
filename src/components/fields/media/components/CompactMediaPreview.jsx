'use client';

import React from 'react';
import { Box, Chip, Avatar, IconButton, Tooltip } from '@mui/material';
import { X as XIcon, Image, File, Link as LinkIcon } from '@phosphor-icons/react';

export const CompactMediaPreview = ({ 
  media, 
  onRemove,
  showRemove = true,
  size = 'small' // 'small' | 'medium'
}) => {
  if (!media) return null;

  const isImage = media.mime_type?.startsWith('image');
  const isExternal = media.is_external || media.mime_type?.startsWith('external/');
  const chipSize = size === 'medium' ? 'medium' : 'small';
  const avatarSize = size === 'medium' ? 32 : 24;

  const getIcon = () => {
    if (isExternal) return <LinkIcon size={16} />;
    if (isImage) return <Image size={16} />;
    return <File size={16} />;
  };

  const getAvatar = () => {
    if (isImage && media.url) {
      return (
        <Avatar
          src={media.url}
          sx={{ 
            width: avatarSize, 
            height: avatarSize,
            border: isExternal ? '2px solid' : 'none',
            borderColor: isExternal ? 'white' : 'transparent',
            bgcolor: 'white !important',
            
            
          }}
        >
          {getIcon()}
        </Avatar>
      );
    }
    
    return (
      <Avatar
        sx={{ 
          width: avatarSize, 
          height: avatarSize,
          bgcolor: 'white',
          color: 'black'
        }}
      >
        {getIcon()}
      </Avatar>
    );
  };

  const title = media.title || media.alt_text || `Media ${media.id}`;

  return (
    <Chip
      avatar={getAvatar()}
      label={title}
      size={chipSize}
      variant="outlined"
      sx={{
        maxWidth: '200px',
        padding: 1,
        height: 'auto',
        '& .MuiChip-label': {
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          paddingRight: showRemove ? 0 : 1
        },
        '& .MuiChip-avatar': {
          marginLeft: 1
        },
        border: isExternal ? '2px solid' : '1px solid',
        borderColor: isExternal ? 'info.main' : 'divider',
        backgroundColor: isExternal ? 'white' : 'transparent'
      }}
      deleteIcon={
        showRemove ? (
          <Tooltip title="Remove media">
            <IconButton size="small" sx={{ padding: 0.5 }}>
              <XIcon size={14} />
            </IconButton>
          </Tooltip>
        ) : undefined
      }
      onDelete={showRemove && onRemove ? onRemove : undefined}
    />
  );
};