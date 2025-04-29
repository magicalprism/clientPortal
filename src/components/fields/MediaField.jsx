'use client';

import { useState } from 'react';
import { Box, Button, IconButton, Typography } from '@mui/material';
import { X as XIcon } from '@phosphor-icons/react';
import { MediaUploadModal } from '@/components/fields/MediaUploadModal';

export const MediaField = ({
  value,
  onChange,
  field,
  record,
  config,
}) => {
  const [previewUrl, setPreviewUrl] = useState(value?.url || '');
  const [modalOpen, setModalOpen] = useState(false);
  const [localMedia, setLocalMedia] = useState(value || null);


  const handleUploadComplete = (media) => {
    if (media?.url) {
      setPreviewUrl(media.url);
      setLocalMedia(media);
      onChange(media.id); // ✅ IMPORTANT: pass only the id to parent
    }
    setModalOpen(false);
  };

  const handleRemoveImage = () => {
    setPreviewUrl('');
    setLocalMedia(null);
    onChange(null); // Clear relationship
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
              backgroundColor: '#f0f0f0',
            }}
          >
            <img
              src={previewUrl}
              alt="Uploaded Media"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <IconButton
              size="small"
              onClick={handleRemoveImage}
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

        <Button
          variant="outlined"
          onClick={() => setModalOpen(true)}
        >
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
