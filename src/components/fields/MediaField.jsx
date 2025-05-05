'use client';

import { useState } from 'react';
import { Box, Button, IconButton, Typography } from '@mui/material';
import { X as XIcon } from '@phosphor-icons/react';
import { MediaUploadModal } from '@/components/fields/MediaUploadModal';
import { fileTypeIcons } from '@/data/fileTypeIcons';
import { DownloadSimple } from '@phosphor-icons/react';


export const MediaField = ({ value, onChange, field, record, config }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [localMedia, setLocalMedia] = useState(value || null);
  const previewUrl = localMedia?.url || '';
  const isImage = localMedia?.mime_type?.startsWith('image');

  const handleUploadComplete = (media) => {
    if (media?.url) {
      setLocalMedia(media);
      onChange(media.id); // Send only ID back to parent
    }
    setModalOpen(false);
  };

  const handleRemove = () => {
    setLocalMedia(null);
    onChange(null);
  };

const mime = localMedia?.mime_type || '';
const FileIcon = fileTypeIcons[mime] || fileTypeIcons.default;

  return (
    <>
      <Box display="flex" flexDirection="column" gap={3} width="100%">
        {previewUrl ? (
          <Box
            position="relative"
            sx={{
              flexGrow: 1,
              flexBasis: 0,
              aspectRatio: '1 / 1',  
              borderRadius: 2,
              overflow: 'hidden',
              border: '1px solid #ccc',
              backgroundColor: '#f9f6ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              minWidth: 150,
              minHeight: 220,
              p: 1,
            }}
          >
            {isImage ? (
              <img
                src={previewUrl}
                alt={localMedia?.alt_text || field.label || 'Media preview'}
                style={{ width: '100%', height: '100%', objectFit: 'cover', aspectRatio: '1 / 1',  }}
              />
            ) : (
              <Box textAlign="center">
                <FileIcon size={48} weight="duotone" />
                <Typography variant="body2" fontWeight={500}>
                  {localMedia.alt_text || 'Unnamed file'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                {mime || 'Unknown type'}
                </Typography>
          </Box>

            )}

            <IconButton
              size="small"
              onClick={handleRemove}
              sx={{
                position: 'absolute',
                top: 4,
                right: 4,
                backgroundColor: 'rgba(255,255,255,0.8)',
              }}
            >
              <XIcon size={16} />
            </IconButton>
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No media uploaded
          </Typography>
        )}

<Box display="flex" gap={1}>
  <Button variant="outlined" onClick={() => setModalOpen(true)} fullWidth>
    {previewUrl ? 'Change Media' : 'Upload Media'}
  </Button>

  {previewUrl && (
    <IconButton
      component="a"
      href={previewUrl}
      download
      target="_blank"
      rel="noopener noreferrer"
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        ml: 1,
        color: 'white',
        backgroundColor: 'primary.main',
      }}
    >
      <DownloadSimple size={20} />
    </IconButton>
  )}
</Box>

      </Box>

      <MediaUploadModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onUploadComplete={handleUploadComplete}
        record={record}
        field={field}
        config={config}
        existingMedia={localMedia}
      />
    </>
  );
};
