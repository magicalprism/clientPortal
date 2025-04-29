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
import { MediaLibraryPicker } from '@/components/fields/MediaLibraryPicker';

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
  const [manualUrl, setManualUrl] = useState('');
  const [chooseFromLibraryOpen, setChooseFromLibraryOpen] = useState(false);
  const [companyId, setCompanyId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [companies, setCompanies] = useState([]);
  const [projects, setProjects] = useState([]);


  // 🧠 When opening, preload existing media if any
  useEffect(() => {
    if (existingMedia) {
      setPreviewUrl(existingMedia.url || '');
      setManualUrl(existingMedia.url || '');
      setAltText(existingMedia.alt_text || '');
      setCopyright(existingMedia.copyright || '');
    } else {
      setPreviewUrl('');
      setManualUrl('');
      setAltText('');
      setCopyright('');
    }
    setSelectedFile(null);
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
  
      if (manualUrl) {
        // 🧠 If user entered a manual URL
        const supabase = createClient();
  
        const { data, error: insertError } = await supabase
          .from('media')
          .insert({
            url: manualUrl,
            alt_text: altText,
            copyright: copyright,
            created: new Date().toISOString(),
          })
          .select()
          .single();
  
        if (insertError) {
          console.error('❌ Failed to save URL-only media:', insertError);
          throw insertError;
        }
  
        mediaData = data;
      } else if (selectedFile) {
        // 🧠 If user selected a file, upload normally
        mediaData = await uploadAndCreateMediaRecord({
          file: selectedFile,
          record,
          field,
          baseFolder: field.baseFolder || '',
          altText,
          copyright,
        });
      } else {
        // 🧠 Nothing selected — just update alt/copyright if existing media
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
  
          {/* Always show these buttons */}
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
  
          <Button
            variant="outlined"
            fullWidth
            onClick={() => setChooseFromLibraryOpen(true)}
            disabled={uploading}
            sx={{ mt: 1 }}
          >
            Explore Library
          </Button>
        </Box>
  

        <Box flexGrow={1} display="flex" flexDirection="column" gap={2}>
        <TextField
              fullWidth
              label="Image URL (optional)"
              placeholder="https://example.com/image.png"
              value={manualUrl}
              onChange={(e) => setManualUrl(e.target.value)}
              sx={{ mt: 2 }}
            />

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

      <MediaLibraryPicker
  open={chooseFromLibraryOpen}
  onClose={() => setChooseFromLibraryOpen(false)}
  onSelect={(media) => {
    setPreviewUrl(media.url);
    setManualUrl(media.url);
    setAltText(media.alt_text || '');
    setCopyright(media.copyright || '');
    setSelectedFile(null); // Clear any upload
    onUploadComplete(media); // Select immediately
    setChooseFromLibraryOpen(false);
    onClose(); // Optional: close upload modal too
  }}
/>


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
