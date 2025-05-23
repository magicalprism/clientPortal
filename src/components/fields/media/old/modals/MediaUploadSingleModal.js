'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Box, Typography, TextField, IconButton, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { X as XIcon } from '@phosphor-icons/react';
import { MediaLibraryPicker } from '@/components/fields/media/components/MediaLibraryPicker';
import { createClient } from '@/lib/supabase/browser';
import { uploadAndCreateMediaRecord } from '@/lib/utils/uploadAndCreateMediaRecord';
import { useUploadFormState, useUploadHandlers } from '../../hooks/useMediaUploadHelpers';
import { fileTypeIcons } from '@/data/fileTypeIcons';
import { getMimeTypeFromUrl } from '@/data/fileTypes';
import { MediaManualEntryEditor } from '@/components/fields/media/old/components/MediaManualEntryEditor';
import { getInitialMedia } from '@/components/fields/media/old/components/data/mediaFieldConfig';
import { MediaFieldEditor } from '@/components/fields/media/old/components/MediaFieldEditor';
import * as collections from '@/collections';

export const MediaUploadSingleModal = ({
  open,
  onClose,
  onUploadComplete,
  record,
  field,
  config,
  existingMedia = null,
}) => {
  const supabase = createClient();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [chooseFromLibraryOpen, setChooseFromLibraryOpen] = useState(false);
  const [mode, setMode] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [manualEntries, setManualEntries] = useState([]);
  const mediaFields = collections.media?.fields || [];

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
          ...getInitialMedia('manual'),
          id: existingMedia.id,
          url: existingMedia.url,
          title: existingMedia.title || '',
          altText: existingMedia.alt_text || '',
          copyright: existingMedia.copyright || '',
        }]);
      }
    }
  }, [open, existingMedia, selectedFiles.length, manualEntries.length]);

const addManualEntry = () => {
  setManualEntries([...manualEntries, getInitialMedia('manual')]);
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
     files.map((file) =>
getInitialMedia('file', {
  file,
  previewUrl: URL.createObjectURL(file),
  title: file.name.split('.')[0] || ''
})
)
    );
    
    setMode('file');
  };

  const handleUpload = async () => {
  setUploading(true);
  setError(null);

  const resolvedCompanyId = companyId || record?.company_id || (config?.name === 'company' ? record?.id : null);
  const resolvedProjectId = projectId || record?.project_id || (config?.name === 'project' ? record?.id : null);
  const metadata = {
    company_id: resolvedCompanyId,
    project_id: resolvedProjectId
  };

  let allMediaIds = [];

  try {
    const items = mode === 'file' ? selectedFiles : manualEntries;

    for (const media of items) {
      const payload = {};
      const multiRelational = [];

      for (const fieldDef of mediaFields) {
        const { name, type, relation } = fieldDef;
        const value = media[name];

        if (type === 'multiRelationship' && value?.length && relation?.junctionTable) {
          multiRelational.push({
            ids: value.map((v) => v.id || v),
            junctionTable: relation.junctionTable,
            sourceKey: relation.sourceKey || 'media_id',
            targetKey: relation.targetKey
          });
        } else {
          payload[name] = value;
        }

      }

let mediaUploadResult;

try {
if (mode === 'file') {
  // file upload logic (unchanged)
} else {
  const upsertPayload = {
    ...payload,
    url: media.url,
    mime_type: media.mime_type || getMimeTypeFromUrl(media.url || media.file?.name),
    ...metadata
  };

  if (existingMedia?.id) {
    // ✅ Update existing media entry
    console.log('✏️ Updating existing manual media:', existingMedia.id, upsertPayload);
    const { data, error } = await supabase
      .from('media')
      .update(upsertPayload)
      .eq('id', existingMedia.id)
      .select()
      .single();

    if (error) throw error;
    mediaUploadResult = data;
  } else {
    // ✅ Insert new media entry
    console.log('➕ Inserting new manual media:', upsertPayload);
    const { data, error } = await supabase
      .from('media')
      .insert({
        ...upsertPayload,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    mediaUploadResult = data;
  }
}
} catch (err) {
  console.error('❌ Upload failed:', {
    raw: err,
    message: err?.message,
    details: err?.details,
    hint: err?.hint,
    code: err?.code
  });

  setError(
    err?.message ||
    err?.details ||
    err?.hint ||
    JSON.stringify(err) ||
    'Upload failed. Please try again.'
  );
}

// ✅ Success path continues...
const mediaId = mediaUploadResult.id;
allMediaIds.push(mediaId);


      // Update metadata (for uploaded files)
      if (mode === 'file') {
        const { error: updateError } = await supabase
          .from('media')
          .update(metadata)
          .eq('id', mediaId);
        if (updateError) throw updateError;
      }

      // Insert tag relations
      for (const rel of multiRelational) {
        const relationInsert = rel.ids.map((id) => ({
          [rel.sourceKey]: mediaId,
          [rel.targetKey]: id
        }));
        const { error: relError } = await supabase.from(rel.junctionTable).insert(relationInsert);
        if (relError) throw relError;
      }
    }

    if (allMediaIds.length > 0) {
      const { data: finalMedia, error: finalError } = await supabase
        .from('media')
        .select('*')
        .in('id', allMediaIds);
      if (finalError) throw finalError;

      onUploadComplete(finalMedia[0]);
    }

    onClose();
  } catch (err) {
  console.error('❌ Upload failed:', {
    raw: err,
    message: err?.message,
    supabaseError: err?.details || err?.hint || err?.code,
  });

  setError(
    err?.message ||
    err?.details ||
    err?.hint ||
    JSON.stringify(err) ||
    'Upload failed. Please try again.'
  );
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


const stableField = useMemo(() => ({
  ...field,
  config
}), [field, config]);


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
          {mode === 'manual' && manualEntries.length > 0 ? (
            <MediaFieldEditor
              media={manualEntries[0]}
              index={0}
              onChange={(i, updated) => {
                const next = [...manualEntries];
                next[i] = updated;
                setManualEntries(next);
              }}
              field={stableField}
            />
          ) : mode === 'file' && selectedFiles.length > 0 ? (
            <MediaFieldEditor
              media={selectedFiles[0]}
              index={0}
              onChange={(i, updated) => {
                const next = [...selectedFiles];
                next[i] = updated;
                setSelectedFiles(next);
              }}
              field={field}
            />
          ) : null}



          {/* Company/Project Selects */}
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
                  <MenuItem key={c.id} value={c.id}>{c.title}</MenuItem>
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
                  <MenuItem key={p.id} value={p.id}>{p.title}</MenuItem>
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