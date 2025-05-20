'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
import { createClient } from '@/lib/supabase/browser';
import { uploadAndCreateMediaRecord } from '@/lib/utils/uploadAndCreateMediaRecord';
import { getMimeTypeFromUrl } from '@/data/fileTypes';
import { MediaLibraryPicker } from '@/components/fields/media/MediaLibraryPicker';
import { fileTypeIcons } from '@/data/fileTypeIcons';

export const MediaUploadModal = ({
  open,
  onClose,
  onUploadComplete,
  record,
  field,
  config
}) => {
  const supabase = createClient();

  const [mode, setMode] = useState(null); // 'file' or 'manual'
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [manualEntries, setManualEntries] = useState([]);
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
  setSelectedFiles([]);
  setManualEntries([]);
  setMode(null);

  // 🔁 Infer company/project from context or record
  let inferredCompanyId = record?.company_id || '';
  let inferredProjectId = record?.project_id || '';

  const currentTable = config?.name;
  const currentId = record?.[`${currentTable}_id`] || record?.id || '';

  if (!inferredCompanyId && currentTable === 'company') {
    inferredCompanyId = currentId;
  }

  if (!inferredProjectId && currentTable === 'project') {
    inferredProjectId = currentId;
  }

  setCompanyId(inferredCompanyId || '');
  setProjectId(inferredProjectId || '');
}, [open, record, config]);

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
        title: '',
        altText: '',
        copyright: ''
      }))
    );
  };

  const handleUpload = async () => {
  setUploading(true);
  setError(null);

  const resolvedCompanyId = record?.company_id || (config?.name === 'company' ? record?.id : null);
  const resolvedProjectId = record?.project_id || (config?.name === 'project' ? record?.id : null);
  const metadata = {
    company_id: resolvedCompanyId,
    project_id: resolvedProjectId
  };

  let allMediaIds = [];

  try {
    if (mode === 'file') {
      for (const media of selectedFiles) {
        const uploaded = await uploadAndCreateMediaRecord({
          file: media.file,
          record,
          field,
          baseFolder: field.baseFolder || '',
          altText: media.altText,
          copyright: media.copyright,
          title: media.title
        });

        const { error: updateError } = await supabase
          .from('media')
          .update(metadata)
          .eq('id', uploaded.id);

        if (updateError) throw updateError;

        allMediaIds.push(uploaded.id);
      }
    } else if (mode === 'manual') {
      for (const media of manualEntries) {
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

        allMediaIds.push(data.id);
      }
    }

    // ✅ Refetch the uploaded media so you get all fields + thumbnails
    const { data: refreshedMedia, error: refetchError } = await supabase
      .from('media')
      .select('*')
      .in('id', allMediaIds);

    if (refetchError) throw refetchError;

const refreshedIds = refreshedMedia.map(m => m.id);
const { data: finalMedia, error: finalError } = await supabase
  .from('media')
  .select('*')
  .in('id', refreshedIds);

if (finalError) throw finalError;

onUploadComplete((prev) => {
  if (!field?.multi) return finalMedia[0];
  return [...(Array.isArray(prev) ? prev : []), ...finalMedia];
});
    onClose();
  } catch (err) {
    console.error('❌ Upload failed:', err);
    setError('Upload failed. Please try again.');
  } finally {
    setUploading(false);
  }
};


  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Upload Media</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

        {!mode && (
          <Box display="flex" gap={2}>
            <Button variant="contained" onClick={() => setMode('file')}>Upload Files</Button>
            <Button variant="outlined" onClick={() => setMode('manual')}>Add Manual Links</Button>
          </Box>
        )}

        {mode === 'file' && (
          <>
            {selectedFiles.map((media, idx) => (
              <Box key={idx} sx={{ display: 'flex', gap: 2 }}>

                    <Box
                      sx={{
                        width: 100,
                        height: 100,
                        borderRadius: 2,
                        border: '1px solid #ccc',
                        backgroundColor: '#f9f9f9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                      }}
                    >
                      {media.file?.type?.startsWith('image/') ? (
                        <img
                          src={media.previewUrl}
                          alt="Preview"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        (() => {
                          const mime = media.file?.type;
                          const Icon = fileTypeIcons[mime] || fileTypeIcons.default;
                          return <Icon size={32} color="#888" />;
                        })()
                      )}
                    </Box>

                    <Box flexGrow={1} display="flex" flexDirection="column" gap={1}>
                      <TextField
                        label="Title"
                        size="small"
                        value={media.title}
                        onChange={(e) => {
                          const updated = [...selectedFiles];
                          updated[idx].title = e.target.value;
                          setSelectedFiles(updated);
                        }}
                      />
                      <TextField
                        label="Alt Text"
                        size="small"
                        value={media.altText}
                        onChange={(e) => {
                          const updated = [...selectedFiles];
                          updated[idx].altText = e.target.value;
                          setSelectedFiles(updated);
                        }}
                      />
                      <TextField
                        label="Copyright"
                        size="small"
                        value={media.copyright}
                        onChange={(e) => {
                          const updated = [...selectedFiles];
                          updated[idx].copyright = e.target.value;
                          setSelectedFiles(updated);
                        }}
                      />

                  </Box>
              </Box>
            ))}
            <Button component="label" variant="outlined">
              Select Files
              <input type="file" hidden multiple onChange={handleFileChange} />
            </Button>
          </>
        )}

{mode === 'manual' && (
  <>
    <Button onClick={addManualEntry}>+ Add Manual Entry</Button>
    {manualEntries.map((entry, index) => (
      <Box key={index} sx={{ display: 'flex', gap: 2, mt: 2 }}>
       <Box
          sx={{
            width: 100,
            height: 100,
            borderRadius: 2,
            border: '1px solid #ccc',
            backgroundColor: '#f9f9f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {entry.url?.match(/\.(jpeg|jpg|png|webp|gif)$/i) ? (
            <img
              src={entry.url}
              alt="Preview"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            (() => {
              const mime = getMimeTypeFromUrl(entry.url);
              const Icon = fileTypeIcons[mime] || fileTypeIcons.default;
              return <Icon size={32} color="#888" />;
            })()
          )}
        </Box>

        <Box flexGrow={1} display="flex" flexDirection="column" gap={1}>
          <TextField
            fullWidth
            size="small"
            label="Image URL"
            value={entry.url}
            onChange={(e) => {
              const updated = [...manualEntries];
              updated[index].url = e.target.value;
              setManualEntries(updated);
            }}
          />
          <TextField
            fullWidth
            size="small"
            label="Title"
            value={entry.title}
            onChange={(e) => {
              const updated = [...manualEntries];
              updated[index].title = e.target.value;
              setManualEntries(updated);
            }}
          />
          <TextField
            fullWidth
            size="small"
            label="Alt Text"
            value={entry.altText}
            onChange={(e) => {
              const updated = [...manualEntries];
              updated[index].altText = e.target.value;
              setManualEntries(updated);
            }}
          />
          <TextField
            fullWidth
            size="small"
            label="Copyright"
            value={entry.copyright}
            onChange={(e) => {
              const updated = [...manualEntries];
              updated[index].copyright = e.target.value;
              setManualEntries(updated);
            }}
          />
        </Box>

        <IconButton onClick={() => removeManualEntry(index)} sx={{ alignSelf: 'start', mt: 1 }}>
          <XIcon />
        </IconButton>
      </Box>
    ))}
  </>
)}


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
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={uploading}>Cancel</Button>
        {mode && (
          <Button variant="contained" onClick={handleUpload} disabled={uploading}>
            {uploading ? 'Saving…' : 'Save'}
          </Button>
        )}
      </DialogActions>

      <MediaLibraryPicker
          open={chooseFromLibraryOpen}
          onClose={() => setChooseFromLibraryOpen(false)}
          onSelect={(media) => {
            onUploadComplete((prev) => {
              if (!field?.multi) return media; // 🎯 SINGLE field = return just 1
              return [...(Array.isArray(prev) ? prev : []), media];
            });
            setChooseFromLibraryOpen(false);
            onClose();
          }}
          record={record}
        />
    </Dialog>
  );
};
