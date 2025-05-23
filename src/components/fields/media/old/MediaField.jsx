'use client';

import { useState, useEffect } from 'react';
import { Box, Button, IconButton, Typography, CircularProgress } from '@mui/material';
import { X as XIcon, DownloadSimple, LinkSimple } from '@phosphor-icons/react';
import { MediaUploadSingleModal } from './modals/MediaUploadSingleModal';
import { fileTypeIcons } from '@/data/fileTypeIcons';
import { createClient } from '@/lib/supabase/browser';

export const MediaField = ({ value, onChange, field, record, config }) => {
  const supabase = createClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [localMedia, setLocalMedia] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Important debug logging
  useEffect(() => {
    console.log('MediaField value:', value);
    console.log('MediaField field:', field);
  }, [value, field]);

  useEffect(() => {
    const fetchMediaDetails = async () => {
      // Skip fetch if no value
      if (!value) {
        setLocalMedia(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Handle both string IDs and object values
        const mediaId = typeof value === 'object' ? value.id : value;

        const { data, error } = await supabase
          .from('media')
          .select('*')
          .eq('id', mediaId)
          .single();

        if (error) throw error;
        
        if (data) {
          console.log('Fetched media data:', data);
          setLocalMedia(data);
        } else {
          console.warn('No media found for ID:', mediaId);
          setLocalMedia(null);
        }
      } catch (err) {
        console.error('❌ Failed to fetch media', err);
        setError('Failed to load media');
        setLocalMedia(null);
      } finally {
        setLoading(false);
      }
    };

    fetchMediaDetails();
  }, [value, supabase]);

  const previewUrl = localMedia?.url || '';
  const isImage = localMedia?.mime_type?.startsWith('image');
  const isFolder = localMedia?.is_folder === true;

  const handleUploadComplete = async (media) => {
    if (media?.id) {
      try {
        const { data, error } = await supabase
          .from('media')
          .select('*')
          .eq('id', media.id)
          .single();

        if (error) throw error;
        if (data) {
          setLocalMedia(data);
          onChange(data.id);
        }
      } catch (err) {
        console.error('❌ Failed to fetch media after upload:', err);
      }
    }

    setModalOpen(false);
  };

  const handleRemove = () => {
    setLocalMedia(null);
    onChange(null);
  };

  const mime = localMedia?.mime_type || '';
  const FileIcon = fileTypeIcons && (localMedia?.is_folder === true || mime === 'folder'
    ? fileTypeIcons.folder
    : (fileTypeIcons[mime] || fileTypeIcons.default));

  return (
    <>
      <Box display="flex" flexDirection="column" gap={3} width="100%">
        {loading ? (
          <Box display="flex" alignItems="center" justifyContent="center" py={3}>
            <CircularProgress size={24} />
          </Box>
        ) : error ? (
          <Typography color="error" variant="body2">{error}</Typography>
        ) : previewUrl ? (
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
            {isFolder ? (
              <Box textAlign="center">
                {FileIcon && <FileIcon size={48} weight="duotone" />}
                <Typography variant="body2" fontWeight={500}>
                  Folder
                </Typography>
              </Box>
            ) : isImage ? (
              <img
                src={previewUrl}
                alt={localMedia?.alt_text || field?.label || 'Media preview'}
                style={{ width: '100%', height: '100%', objectFit: 'cover', aspectRatio: '1 / 1' }}
              />
            ) : (
              <Box textAlign="center">
                {FileIcon && <FileIcon size={48} weight="duotone" />}
                <Typography variant="body2" fontWeight={500}>
                  {localMedia?.alt_text || localMedia?.title || 'Unnamed file'}
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
              {isFolder ? <LinkSimple size={20} /> : <DownloadSimple size={20} />}
            </IconButton>
          )}
        </Box>
      </Box>

      <MediaUploadSingleModal
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