import React from 'react';
import { Box, Typography, Link, IconButton } from '@mui/material';
import { fileTypeIcons } from '@/data/fileTypeIcons';
import { X as XIcon } from '@phosphor-icons/react';

const CollectionItem = ({ item = {}, onClick, onDelete }) => {
  const mime = item.mime_type || '';
  const isImage = mime.startsWith('image/');
  const isFolder = item.is_folder || mime === 'folder';
  const title = item.title || 'Untitled';
  const description = item.description || '';
  const url = item.url || '#';

  const imageUrl = isImage ? item.url : '';
  const FileIcon = isFolder ? fileTypeIcons.folder : fileTypeIcons[mime] || fileTypeIcons.default;

  const handleDelete = (e) => {
    e.stopPropagation();
    e.preventDefault();
    console.log('[CollectionItem] X clicked for item:', item);
    if (typeof onDelete === 'function') {
      onDelete(item);
    } else {
      console.warn('[CollectionItem] onDelete is not a function or not provided');
    }
  };

  return (
    <Box
      sx={{
        width: 140,
        border: '2px solid transparent',
        borderRadius: 2,
        overflow: 'hidden',
        backgroundColor: 'background.paper',
        boxShadow: 1,
        transition: '0.2s',
        position: 'relative',
        '&:hover': { borderColor: 'primary.light', boxShadow: 3 },
      }}
    >
      {/* X Button */}
      {onDelete && (
        <IconButton
            size="small"
            onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                console.log('[CollectionItem] X clicked for item:', item); // ✅ full debug
                if (onDelete) onDelete(item);
            }}
            sx={{
                position: 'absolute',
                top: 4,
                right: 4,
                zIndex: 2,
                backgroundColor: 'white',
                '&:hover': { backgroundColor: 'grey.100' },
            }}
            >
            <XIcon size={16} />
            </IconButton>

      )}

      {/* Clickable content */}
      <Link
        href={url}
        target="_blank"
        underline="none"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          textDecoration: 'none',
          px: 1,
          pb: 1,
        }}
        onClick={onClick}
      >
        <Box
          sx={{
            width: '100%',
            aspectRatio: '1',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isImage ? (
            <img
              src={imageUrl}
              alt={title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <FileIcon size={32} />
          )}
        </Box>

        <Typography variant="body2" fontWeight={500} mt={1}>
          {title}
        </Typography>

        {description && (
          <Typography variant="caption" color="text.secondary">
            {description}
          </Typography>
        )}
      </Link>
    </Box>
  );
};

export default CollectionItem;
