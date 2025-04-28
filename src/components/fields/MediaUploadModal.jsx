'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  DialogTitle,
  Button,
  Box,
  Typography,
  TextField,
  IconButton
} from '@mui/material';
import { X as XIcon } from '@phosphor-icons/react';
import { uploadAndCreateMediaRecord } from '@/lib/utils/uploadAndCreateMediaRecord';

export const MediaUploadModal = ({
  open,
  onClose,
  onUploadComplete,
  record,
  field,
  config,
  existingMedia = null, // 🧠 pass the current value here
}) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [altText, setAltText] = useState('');
  const [copyright, setCopyright] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  // 🧠 When opening, preload existing media if any
  useEffect(() => {
    if (existingMedia) {
      setPreviewUrl(existingMedia.url || '');
      setAltText(existingMedia.alt || '');
      setCopyright(existingMedia.copyright || '');
    } else {
      setPreviewUrl('');
      setAltText('');
      setCopyright('');
    }
    setSelectedFile(null); // always clear selected file initially
  }, [open, existingMedia]);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file)); // 🖼️ Show preview
  };

  const handleUpload = async () => {
    setUploading(true);
    setError(null);

    try {
      let mediaData;

      if (selectedFile) {
        // New file selected → upload it
        mediaData = await uploadAndCreateMediaRecord({
          file: selectedFile,
          record,
          field,
          baseFolder: field.baseFolder || '',
          altText,
          copyright,
        });
      } else {
        // No file picked → only update alt/copyright based on existing media
        mediaData = {
          ...existingMedia,
          alt: altText,
          copyright,
        };
      }

      onUploadComplete(mediaData);
      onClose();
    } catch (err) {
      console.error('❌ Upload failed:', err);
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleClear = () => {
    setPreviewUrl('');
    setSelectedFile(null);
    setAltText('');
    setCopyright('');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Upload Media</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
        <Box sx={{ width: 150, flexShrink: 0, position: 'relative' }}>
          {previewUrl ? (
            <>
              <img
                src={previewUrl}
                alt="Media Preview"
                style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: 8 }}
              />
              <IconButton
                size="small"
                onClick={handleClear}
                sx={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  backgroundColor: 'white',
                  boxShadow: 1,
                }}
              >
                <XIcon size={16} />
              </IconButton>
            </>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No file selected
            </Typography>
          )}

          <Button
            variant="outlined"
            component="label"
            fullWidth
            sx={{ mt: 1 }}
            disabled={uploading}
          >
            {selectedFile || previewUrl ? 'Change File' : 'Select File'}
            <input
              type="file"
              hidden
              onChange={handleFileChange}
              accept="image/*"
            />
          </Button>
        </Box>

        <Box flexGrow={1} display="flex" flexDirection="column" gap={2}>
          <TextField
            label="Alt Text"
            fullWidth
            size="small"
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
          />
          <TextField
            label="Copyright"
            fullWidth
            size="small"
            value={copyright}
            onChange={(e) => setCopyright(e.target.value)}
          />

          {error && (
            <Typography color="error" variant="caption">
              {error}
            </Typography>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={uploading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleUpload}
          disabled={uploading}
        >
          {uploading ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
