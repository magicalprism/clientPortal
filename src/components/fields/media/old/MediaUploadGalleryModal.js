'use client';

import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Box, Typography, TextField, IconButton, MenuItem, Select, FormControl, InputLabel,
  Grid, Tabs, Tab
} from '@mui/material';
import { X as XIcon, Plus, Upload, Globe, FolderOpen } from '@phosphor-icons/react';
import { createClient } from '@/lib/supabase/browser';
import { useUploadFormState, useUploadHandlers } from '.@/hooks/useMediaUploadHelpers';
import { MediaLibraryPicker } from '@/components/fields/media/components/MediaLibraryPicker';
import { fileTypeIcons } from '@/data/fileTypeIcons';
import { getMimeTypeFromUrl } from '@/data/fileTypes';
import { MediaFieldEditor } from '@/components/fields/media/old/components/MediaFieldEditor';
import { getInitialMedia, getMediaAltText, mediaFieldDefaults } from '@/components/fields/media/old/components/data/mediaFieldConfig';

export const MediaUploadGalleryModal = ({
  open,
  onClose,
  onUploadComplete,
  record,
  field,
  config
}) => {
  const supabase = createClient();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [chooseFromLibraryOpen, setChooseFromLibraryOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const {
    mode,
    setMode,
    selectedFiles,
    setSelectedFiles,
    manualEntries,
    setManualEntries,
    companyId,
    setCompanyId,
    projectId,
    setProjectId,
    companies,
    projects,
    isProjectContext,
    isCompanyContext
  } = useUploadFormState({ open, record, config, supabase });

  const {
    addManualEntry,
    removeManualEntry,
    handleFileChange,
    handleUpload
  } = useUploadHandlers({
    mode,
    selectedFiles,
    setSelectedFiles,
    manualEntries,
    setManualEntries,
    onUploadComplete,
    onClose,
    record,
    field,
    config,
    setUploading,
    setError,
    supabase,
    companyId,
    projectId
  });

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    switch(newValue) {
      case 0:
        setMode('file');
        break;
      case 1:
        setMode('manual');
        if (manualEntries.length === 0) {
        setManualEntries([getInitialMedia('manual')]);
      }
        break;
      case 2:
        setMode('library');
        break;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Upload Media</DialogTitle>
      
      <Tabs 
        value={activeTab} 
        onChange={handleTabChange} 
        variant="fullWidth" 
        sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
      >
        <Tab icon={<Upload size={16} />} label="Upload Files" />
        <Tab icon={<Globe size={16} />} label="URL Links" />
        <Tab icon={<FolderOpen size={16} />} label="Media Library" />
      </Tabs>
      
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 3 }}>
        {activeTab === 0 && (
          <>
            <Grid container spacing={2}>
              {selectedFiles.map((media, idx) => (
                <Grid item xs={12} sm={6} md={4} key={idx}>
                  <Box sx={{ 
                    border: '1px solid #eee', 
                    borderRadius: 2, 
                    p: 2, 
                    position: 'relative',
                    height: '100%'
                  }}>
                    <IconButton 
                      sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'rgba(255,255,255,0.8)' }}
                      size="small"
                      onClick={() => {
                        const updated = [...selectedFiles];
                        updated.splice(idx, 1);
                        setSelectedFiles(updated);
                      }}
                    >
                      <XIcon size={16} />
                    </IconButton>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Box
                        sx={{
                          width: 80,
                          height: 80,
                          borderRadius: 1,
                          border: '1px solid #eee',
                          backgroundColor: '#f9f9f9',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                          mr: 2
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
                      
                      <Typography variant="body2" noWrap sx={{ flex: 1 }}>
                        {media.file?.name || 'File'}
                      </Typography>
                    </Box>
                    
                    <MediaFieldEditor
                      media={media}
                      index={idx}
                      onChange={(i, updatedMedia) => {
                        const updated = [...selectedFiles];
                        updated[i] = updatedMedia;
                        setSelectedFiles(updated);
                      }}
                      field={field}
                    />

                  </Box>
                </Grid>
              ))}
              
              <Grid item xs={12} sm={6} md={4}>
                <Box
                  sx={{
                    border: '2px dashed #ccc',
                    borderRadius: 2,
                    p: 3,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    '&:hover': { borderColor: 'primary.main' }
                  }}
                  component="label"
                >
                  <input type="file" hidden multiple onChange={handleFileChange} />
                  <Upload size={32} weight="thin" />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Select Files
                  </Typography>
                </Box>
              </Grid>
            </Grid>
            
            {selectedFiles.length > 0 && (
              <Button 
                component="label" 
                variant="outlined" 
                startIcon={<Plus size={16} />}
              >
                Add More Files
                <input type="file" hidden multiple onChange={handleFileChange} />
              </Button>
            )}
          </>
        )}
{activeTab === 2 && (
  <MediaLibraryPicker
    open={true}
    inline={true}
    onClose={() => setActiveTab(0)}
    onSelect={(media) => {
      onUploadComplete((prev) => {
        if (!field?.multi) return media;
        return [...(Array.isArray(prev) ? prev : []), media];
      });
      onClose();
    }}
    record={record}
    multi={field?.multi}
  />
)}
        {activeTab === 1 && (
          <>
            {manualEntries.map((entry, index) => (
              <Box key={index} sx={{ display: 'flex', gap: 2, mt: 2, position: 'relative' }}>
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
                      alt={getMediaAltText(entry)}
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
                  <MediaFieldEditor
                        media={entry}
                        index={index}
                        onChange={(i, updatedEntry) => {
                          const updated = [...manualEntries];
                          updated[i] = updatedEntry;
                          setManualEntries(updated);
                        }}
                        field={field}
                      />
                </Box>

                <IconButton 
                  onClick={() => removeManualEntry(index)} 
                  sx={{ alignSelf: 'start' }}
                  color="error"
                >
                  <XIcon size={20} />
                </IconButton>
              </Box>
            ))}
            
            <Button 
              onClick={addManualEntry} 
              variant="outlined" 
              startIcon={<Plus size={16} />}
              sx={{ mt: 2 }}
            >
              Add URL Entry
            </Button>
          </>
        )}

        {/* Contextual Selects */}
        <Box sx={{ mt: 2 }}>
          {!isCompanyContext && (
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
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
        </Box>

        {error && (
          <Typography color="error" variant="caption" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={uploading}>
          Cancel
        </Button>
        <Button 
          variant="contained" 
          onClick={handleUpload} 
          disabled={uploading || (activeTab === 0 && selectedFiles.length === 0) || (activeTab === 1 && manualEntries.length === 0)}
        >
          {uploading ? 'Saving…' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};