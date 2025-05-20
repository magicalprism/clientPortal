'use client';

import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Box, Typography, TextField, IconButton, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { X as XIcon } from '@phosphor-icons/react';
import { MediaLibraryPicker } from '@/components/fields/media/MediaLibraryPicker';
import { createClient } from '@/lib/supabase/browser';
import { uploadAndCreateMediaRecord } from '@/lib/utils/uploadAndCreateMediaRecord';
import { useUploadFormState, useUploadHandlers } from '../helpers/useMediaUploadHelpers';
import { fileTypeIcons } from '@/data/fileTypeIcons';
import { getMimeTypeFromUrl } from '@/data/fileTypes';

export const MediaUploadSingleModal = ({
  open,
  onClose,
  onUploadComplete,
  record,
  field,
  config,
  existingMedia = null
}) => {
  const supabase = createClient();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [chooseFromLibraryOpen, setChooseFromLibraryOpen] = useState(false);
  const [mode, setMode] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [manualEntries, setManualEntries] = useState([]);

  // Debug log
  useEffect(() => {
    console.log('MediaUploadSingleModal props:', {
      open, record, field, config, existingMedia
    });
  }, [open, record, field, config, existingMedia]);

  const {
    companyId,
    setCompanyId,
    projectId,
    setProjectId,
    companies,
    projects,
    isProjectContext,
    isCompanyContext
  } = useUploadFormState({ 
    open, 
    record, 
    config, 
    supabase, 
    existingMedia 
  });

  // Pre-fill with existing media if provided
  useEffect(() => {
    if (open && existingMedia && !selectedFiles.length && !manualEntries.length) {
      if (existingMedia.url) {
        setMode('manual');
        setManualEntries([{
          url: existingMedia.url,
          title: existingMedia.title || '',
          altText: existingMedia.alt_text || '',
          copyright: existingMedia.copyright || ''
        }]);
      }
    }
  }, [open, existingMedia, selectedFiles.length, manualEntries.length]);

  const addManualEntry = () => {
    setManualEntries([...manualEntries, { url: '', title: '', altText: '', copyright: '' }]);
  };

  const removeManualEntry = (index) => {
    const next = [...manualEntries];
    next.splice(index, 1);
    setManualEntries(next);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    
    setSelectedFiles(
      files.map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
        title: file.name.split('.')[0] || '',
        altText: '',
        copyright: ''
      }))
    );
    
    setMode('file');
  };

  const handleUpload = async () => {
    setUploading(true);
    setError(null);

    // Prepare metadata
    const resolvedCompanyId = companyId || record?.company_id || (config?.name === 'company' ? record?.id : null);
    const resolvedProjectId = projectId || record?.project_id || (config?.name === 'project' ? record?.id : null);
    const metadata = {
      company_id: resolvedCompanyId,
      project_id: resolvedProjectId
    };

    let allMediaIds = [];

    try {
      // File upload handling
      if (mode === 'file' && selectedFiles.length > 0) {
        for (const media of selectedFiles) {
          if (!media.file) continue;
          
          const uploaded = await uploadAndCreateMediaRecord({
            file: media.file,
            record,
            field,
            baseFolder: field?.baseFolder || '',
            altText: media.altText,
            copyright: media.copyright,
            title: media.title
          });

          if (uploaded?.id) {
            // Update with company/project metadata
            const { error: updateError } = await supabase
              .from('media')
              .update(metadata)
              .eq('id', uploaded.id);

            if (updateError) throw updateError;
            allMediaIds.push(uploaded.id);
          }
        }
      } 
      // Manual URL entry handling
      else if (mode === 'manual' && manualEntries.length > 0) {
        for (const media of manualEntries) {
          if (!media.url) continue;
          
          const { data, error } = await supabase
            .from('media')
            .insert({
              url: media.url,
              title: media.title,
              alt_text: media.altText,
              copyright: media.copyright,
              mime_type: getMimeTypeFromUrl(media.url),
              created_at: new Date().toISOString(),
              ...metadata
            })
            .select()
            .single();

          if (error) throw error;
          if (data?.id) {
            allMediaIds.push(data.id);
          }
        }
      }

      // Fetch the complete media records with all fields
      if (allMediaIds.length > 0) {
        const { data: finalMedia, error: finalError } = await supabase
          .from('media')
          .select('*')
          .in('id', allMediaIds);

        if (finalError) throw finalError;

        // Return media based on field configuration (single or multi)
        onUploadComplete(finalMedia[0]); // Single field - return just the first item
      }

      onClose();
    } catch (err) {
      console.error('❌ Upload failed:', err);
      setError(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const selectedFile = selectedFiles[0] || {};
  const previewUrl = selectedFile?.previewUrl || existingMedia?.url || manualEntries[0]?.url || '';
  const title = selectedFile?.title || existingMedia?.title || manualEntries[0]?.title || '';
  const altText = selectedFile?.altText || existingMedia?.alt_text || manualEntries[0]?.altText || '';
  const copyright = selectedFile?.copyright || existingMedia?.copyright || manualEntries[0]?.copyright || '';

  // Determine file type and icon
  const isImage = previewUrl?.match(/\.(jpeg|jpg|png|gif|webp)$/i);
  const mime = selectedFile?.file?.type || getMimeTypeFromUrl(previewUrl) || '';
  const FileIcon = fileTypeIcons[mime] || fileTypeIcons.default;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Upload Media</DialogTitle>

      <DialogContent sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, pt: 3 }}>
        <Box sx={{ width: { xs: '100%', md: 150 }, flexShrink: 0, position: 'relative' }}>
          <Box sx={{
            width: '100%',
            height: 150,
            borderRadius: 2,
            border: '1px solid #ccc',
            backgroundColor: '#f9f9f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            mb: 2
          }}>
            {previewUrl ? (
              isImage ? (
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              ) : (
                <Box textAlign="center">
                  <FileIcon size={48} color="#888" />
                  <Typography variant="caption" color="text.secondary">
                    {mime || 'File'}
                  </Typography>
                </Box>
              )
            ) : (
              <Typography variant="body2" color="text.secondary">No file selected</Typography>
            )}
          </Box>

          <Button 
            variant="outlined" 
            component="label" 
            fullWidth 
            sx={{ mb: 1 }} 
            disabled={uploading}
          >
            {previewUrl ? 'Change File' : 'Select File'}
            <input type="file" hidden onChange={handleFileChange} />
          </Button>

          <Button 
            variant="outlined" 
            fullWidth 
            sx={{ mb: 1 }}
            onClick={() => setChooseFromLibraryOpen(true)}
          >
            Media Library
          </Button>

          <Button 
            variant="text" 
            fullWidth 
            onClick={() => {
              setMode('manual');
              if (!manualEntries.length) {
                addManualEntry();
              }
            }}
          >
            URL Instead
          </Button>
        </Box>

        <Box flexGrow={1} display="flex" flexDirection="column" gap={2}>
          <TextField
            fullWidth
            label="URL"
            value={manualEntries[0]?.url || ''}
            onChange={(e) => {
              if (manualEntries.length === 0) {
                setManualEntries([{ url: e.target.value, title: '', altText: '', copyright: '' }]);
                setMode('manual');
              } else {
                const updated = [...manualEntries];
                updated[0].url = e.target.value;
                setManualEntries(updated);
              }
            }}
          />

          <TextField
            fullWidth
            label="Title"
            value={title}
            onChange={(e) => {
              if (mode === 'file' && selectedFiles.length > 0) {
                const updated = [...selectedFiles];
                updated[0].title = e.target.value;
                setSelectedFiles(updated);
              } else if (mode === 'manual' && manualEntries.length > 0) {
                const updated = [...manualEntries];
                updated[0].title = e.target.value;
                setManualEntries(updated);
              }
            }}
          />

          <TextField
            fullWidth
            label="Alt Text"
            value={altText}
            onChange={(e) => {
              if (mode === 'file' && selectedFiles.length > 0) {
                const updated = [...selectedFiles];
                updated[0].altText = e.target.value;
                setSelectedFiles(updated);
              } else if (mode === 'manual' && manualEntries.length > 0) {
                const updated = [...manualEntries];
                updated[0].altText = e.target.value;
                setManualEntries(updated);
              }
            }}
          />

          <TextField
            fullWidth
            label="Copyright"
            value={copyright}
            onChange={(e) => {
              if (mode === 'file' && selectedFiles.length > 0) {
                const updated = [...selectedFiles];
                updated[0].copyright = e.target.value;
                setSelectedFiles(updated);
              } else if (mode === 'manual' && manualEntries.length > 0) {
                const updated = [...manualEntries];
                updated[0].copyright = e.target.value;
                setManualEntries(updated);
              }
            }}
          />

          {/* Company/Project Select */}
          {!isCompanyContext && (
            <FormControl fullWidth size="small">
              <InputLabel>Company</InputLabel>
              <Select value={companyId} onChange={(e) => setCompanyId(e.target.value)} label="Company">
                <MenuItem value="">None</MenuItem>
                {companies.map((c) => (
                  <MenuItem key={c.id} value={c.id}>{c.title}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          
          {!isProjectContext && (
            <FormControl fullWidth size="small">
              <InputLabel>Project</InputLabel>
              <Select value={projectId} onChange={(e) => setProjectId(e.target.value)} label="Project">
                <MenuItem value="">None</MenuItem>
                {projects.map((p) => (
                  <MenuItem key={p.id} value={p.id}>{p.title}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {error && <Typography color="error" variant="caption">{error}</Typography>}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={uploading}>Cancel</Button>
        <Button 
          variant="contained" 
          onClick={handleUpload} 
          disabled={uploading || (!selectedFiles.length && !manualEntries.length)}
        >
          {uploading ? 'Saving…' : 'Save'}
        </Button>
      </DialogActions>

      <MediaLibraryPicker
        open={chooseFromLibraryOpen}
        onClose={() => setChooseFromLibraryOpen(false)}
        onSelect={(media) => {
          onUploadComplete(media);
          setChooseFromLibraryOpen(false);
          onClose();
        }}
        record={record}
      />
    </Dialog>
  );
};