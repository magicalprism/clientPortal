import React from 'react';
import { Box, Typography, Link } from '@mui/material';
import { fileTypeIcons } from '@/data/fileTypeIcons';

const CollectionItem = ({ item = {}, onClick }) => {
  const mime = item.mime_type || '';
  const isImage = mime.startsWith('image/');
  const isFolder = item.is_folder || mime === 'folder';
  const title = item.title || 'Untitled';
  const description = item.description || '';
  const url = item.url || '#';

  const imageUrl = isImage ? item.url : '';
  const FileIcon = isFolder ? fileTypeIcons.folder : fileTypeIcons[mime] || fileTypeIcons.default;

  return (
    <Link href={url} target="_blank" underline="none" sx={{ textDecoration: 'none' }}>
      <Box
        onClick={onClick}
        sx={{
          width: 140,
          border: '2px solid transparent',
          borderRadius: 2,
          overflow: 'hidden',
          backgroundColor: 'background.paper',
          boxShadow: 1,
          transition: '0.2s',
          '&:hover': { borderColor: 'primary.light', boxShadow: 3 },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        <Box sx={{ width: '100%', aspectRatio: '1', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {isImage ? (
            <img src={imageUrl} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <FileIcon size={32} />
          )}
        </Box>

        <Typography variant="body2" fontWeight={500} mt={1}>
          {title}
        </Typography>

        {description && (
          <Typography variant="caption" color="text.secondary" px={1} pb={1}>
            {description}
          </Typography>
        )}
      </Box>
    </Link>
  );
};

export default CollectionItem;
