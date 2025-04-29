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
  IconButton,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import { X as XIcon } from '@phosphor-icons/react';
import { uploadAndCreateMediaRecord } from '@/lib/utils/uploadAndCreateMediaRecord';
import { MediaLibraryPicker } from '@/components/fields/MediaLibraryPicker';
import { createClient } from '@/lib/supabase/browser';

export const MediaUploadModal = ({
  open,
  onClose,
  onUploadComplete,
  record,
  field,
  config,
  existingMedia = null
}) => {
  const supabase = createClient();

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [altText, setAltText] = useState('');
  const [copyright, setCopyright] = useState('');
  const [manualUrl, setManualUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [chooseFromLibraryOpen, setChooseFromLibraryOpen] = useState(false);

  const [companyId, setCompanyId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [companies, setCompanies] = useState([]);
  const [projects, setProjects] = useState([]);

  const isProjectContext = config?.name === 'project';
  const isCompanyContext = config?.name === 'company';

  useEffect(() => {
    const loadOptions = async () => {
      const [{ data: companyData }, { data: projectData }] = await Promise.all([
        supabase.from('company').select('id, title'),
        supabase.from('project').select('id, title')
      ]);
      setCompanies(companyData || []);
      setProjects(projectData || []);
    };

    if (open) loadOptions();
  }, [open]);

  useEffect(() => {
    if (existingMedia) {
      setPreviewUrl(existingMedia.url || '');
      setManualUrl(existingMedia.url || '');
      setAltText(existingMedia.alt_text || '');
      setCopyright(existingMedia.copyright || '');
      setCompanyId(existingMedia.company_id || '');
      setProjectId(existingMedia.project_id || '');
    } else {
      setPreviewUrl('');
      setManualUrl('');
      setAltText('');
      setCopyright('');
      let inferredCompanyId = record?.company_id || null;
      let inferredProjectId = record?.project_id || null;

      if (!inferredCompanyId && !inferredProjectId) {
        const currentTable = config?.name;
        const id = record?.[`${currentTable}_id`] || record?.id || null;

        if (currentTable === 'company') {
          inferredCompanyId = id;
        }
        if (currentTable === 'project') {
          inferredProjectId = id;
        }
      }
      setCompanyId(inferredCompanyId || '');
      setProjectId(inferredProjectId || '');
    }
    setSelectedFile(null);
  }, [open, existingMedia, record, config]);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
  
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setManualUrl(''); // 🧹 Clear manual URL if uploading file
  };
  

  const handleClear = () => {
    setPreviewUrl('');
    setSelectedFile(null);
    setAltText('');
    setCopyright('');
  };

  const handleUpload = async () => {
    setUploading(true);
    setError(null);
  
    try {
      let mediaData;
  
      // Resolve both independently
      let resolvedCompanyId = null;
      let resolvedProjectId = null;
  
      if (record?.company_id) {
        resolvedCompanyId = record.company_id;
      } else if (config?.name === 'company') {
        resolvedCompanyId = record?.id || null;
      }
  
      if (record?.project_id) {
        resolvedProjectId = record.project_id;
      } else if (config?.name === 'project') {
        resolvedProjectId = record?.id || null;
      }
  
      const metadata = {
        alt_text: altText,
        copyright,
        company_id: resolvedCompanyId,
        project_id: resolvedProjectId,
      };
  
      if (manualUrl) {
        const { data, error: insertError } = await supabase
          .from('media')
          .insert({
            url: manualUrl,
            created: new Date().toISOString(),
            ...metadata,
          })
          .select()
          .single();
  
        if (insertError) throw insertError;
        mediaData = data;
      } else if (selectedFile) {
        mediaData = await uploadAndCreateMediaRecord({
          file: selectedFile,
          record,
          field,
          baseFolder: field.baseFolder || '',
          altText,
          copyright,
        });
  
        const { error: updateError } = await supabase
          .from('media')
          .update({
            company_id: metadata.company_id,
            project_id: metadata.project_id,
          })
          .eq('id', mediaData.id);
  
        if (updateError) throw updateError;
  
        mediaData = { ...mediaData, ...metadata };
      } else {
        mediaData = {
          ...existingMedia,
          ...metadata,
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
                style={{ width: '100%', height: 150, objectFit: 'cover', borderRadius: 8 }}
              />
              <IconButton
                size="small"
                onClick={handleClear}
                sx={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  backgroundColor: 'white',
                  boxShadow: 1
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

          <Button variant="outlined" component="label" fullWidth sx={{ mt: 1 }} disabled={uploading}>
            {selectedFile || previewUrl ? 'Change File' : 'Select File'}
            <input type="file" hidden onChange={handleFileChange} accept="image/*" />
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
          />
          <TextField
            fullWidth
            label="Alt Text"
            size="small"
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
          />
          <TextField
            fullWidth
            label="Copyright"
            size="small"
            value={copyright}
            onChange={(e) => setCopyright(e.target.value)}
          />
          {!isCompanyContext && (
            <FormControl fullWidth size="small">
              <InputLabel>Company</InputLabel>
              <Select
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                label="Company"
              >
                <MenuItem value="">None</MenuItem>
                {companies.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          {!isProjectContext && (
            <FormControl fullWidth size="small">
              <InputLabel>Project</InputLabel>
              <Select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                label="Project"
              >
                <MenuItem value="">None</MenuItem>
                {projects.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

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
          setSelectedFile(null);
          onUploadComplete(media);
          setChooseFromLibraryOpen(false);
          onClose();
        }}
      />

      <DialogActions>
        <Button onClick={onClose} disabled={uploading}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleUpload} disabled={uploading}>
          {uploading ? 'Saving…' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
