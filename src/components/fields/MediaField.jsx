'use client';

import { useState } from 'react';
import { Box, Button, IconButton, Typography } from '@mui/material';
import { X as XIcon } from '@phosphor-icons/react';
import { MediaUploadModal } from '@/components/fields/MediaUploadModal';

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

  return (
    <>
      <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
        {previewUrl ? (
          <Box
            position="relative"
            sx={{
              width: 150,
              height: 150,
              borderRadius: 2,
              overflow: 'hidden',
              border: '1px solid #ccc',
              backgroundColor: '#f9f9f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              p: 1,
            }}
          >
            {isImage ? (
              <img
                src={previewUrl}
                alt={localMedia?.alt_text || field.label || 'Media preview'}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <Box textAlign="center">
                <Typography variant="body2" fontWeight={500}>
                  {localMedia.alt_text || 'Unnamed file'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {localMedia.mime_type || 'File'}
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

        <Button variant="outlined" onClick={() => setModalOpen(true)}>
          {previewUrl ? 'Change Media' : 'Upload Media'}
        </Button>
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
