'use client';

import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  LinearProgress,
  Chip,
  Grid
} from '@mui/material';
import { Upload, X as XIcon } from '@phosphor-icons/react';
import { createClient } from '@/lib/supabase/browser';

export const MediaUploadModal = ({
  open,
  onClose,
  onUploadComplete,
  record,
  field,
  config, // This is the media collection config
  isMulti = false,
  maxFileSize = 10 * 1024 * 1024, // 10MB default
  maxFiles = isMulti ? 10 : 1,
  acceptedFileTypes = []
}) => {
  const supabase = createClient();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');

  // Get field configurations from config using existing pattern
  const getFieldConfig = (fieldName) => {
    return config?.fields?.find(f => f.name === fieldName) || {};
  };

  const titleField = getFieldConfig('title');
  const altTextField = getFieldConfig('alt_text');
  const copyrightField = getFieldConfig('copyright');
  const mimeTypeField = getFieldConfig('mime_type');
  const statusField = getFieldConfig('status');

  // Handle drag events
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, []);

  const handleFiles = (fileList) => {
    const files = Array.from(fileList);
    const validFiles = [];
    let errorMessages = [];

    files.forEach(file => {
      // Check file size
      if (file.size > maxFileSize) {
        errorMessages.push(`${file.name} is too large (max ${maxFileSize / 1024 / 1024}MB)`);
        return;
      }

      // Check file type if restrictions exist
      if (acceptedFileTypes.length > 0) {
        const isValidType = acceptedFileTypes.some(type => {
          if (type.startsWith('.')) {
            return file.name.toLowerCase().endsWith(type.toLowerCase());
          } else {
            return file.type.match(type);
          }
        });

        if (!isValidType) {
          errorMessages.push(`${file.name} file type not allowed`);
          return;
        }
      }

      validFiles.push(file);
    });

    // Check total file count
    const totalFiles = selectedFiles.length + validFiles.length;
    if (totalFiles > maxFiles) {
      errorMessages.push(`Maximum ${maxFiles} files allowed`);
      return;
    }

    if (errorMessages.length > 0) {
      setError(errorMessages.join(', '));
      return;
    }

    setError('');
    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const handleFileInput = (e) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select files to upload');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError('');

    try {
      const uploadedMedia = [];
      
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        
        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `media/${fileName}`;

        // Upload file to Supabase Storage
        const { data: storageData, error: storageError } = await supabase.storage
          .from('media') // Assuming 'media' bucket
          .upload(filePath, file);

        if (storageError) throw storageError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('media')
          .getPublicUrl(filePath);

        // Create media record using config fields and existing multi logic
        const mediaRecord = {};
        
        // Set URL - always required
        mediaRecord.url = publicUrl;
        
        // Set title if field exists in config
        if (titleField) {
          mediaRecord.title = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
        }
        
        // Set alt_text if field exists in config
        if (altTextField) {
          mediaRecord.alt_text = file.name.replace(/\.[^/.]+$/, "");
        }
        
        // Set mime_type if field exists in config
        if (mimeTypeField) {
          mediaRecord.mime_type = file.type;
        }
        
        // Set original_title if field exists in config
        const originalTitleField = getFieldConfig('original_title');
        if (originalTitleField) {
          mediaRecord.original_title = file.name;
        }
        
        // Set status if field exists in config
        if (statusField) {
          mediaRecord.status = 'uploaded';
        }
        
        // Add company_id if field exists in config and record has it
        const companyField = getFieldConfig('company_id');
        if (companyField && record?.company_id) {
          mediaRecord.company_id = record.company_id;
        }
        
        // Add author_id if field exists in config and we have user info
        const authorField = getFieldConfig('author_id');
        if (authorField && record?.user_id) {
          mediaRecord.author_id = record.user_id;
        }

        const { data: mediaData, error: mediaError } = await supabase
          .from('media')
          .insert(mediaRecord)
          .select()
          .single();

        if (mediaError) throw mediaError;

        uploadedMedia.push(mediaData);
        
        // Update progress
        setUploadProgress(((i + 1) / selectedFiles.length) * 100);
      }

      onUploadComplete(uploadedMedia);
      handleClose();
      
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFiles([]);
    setError('');
    setUploadProgress(0);
    setUploading(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <Upload size={20} />
          {isMulti ? 'Upload Files' : 'Upload File'}
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box display="flex" flexDirection="column" gap={3}>
          {error && (
            <Alert severity="error">
              {error}
            </Alert>
          )}

          {/* Upload Area */}
          <Box
            sx={{
              border: '2px dashed',
              borderColor: dragActive ? 'primary.main' : 'grey.300',
              borderRadius: 2,
              p: 4,
              textAlign: 'center',
              backgroundColor: dragActive ? 'primary.50' : 'grey.50',
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out'
            }}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-input').click()}
          >
            <Upload size={48} color={dragActive ? 'primary' : 'grey'} />
            <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
              {dragActive ? 'Drop files here' : 'Click to select or drag files here'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isMulti ? `Upload up to ${maxFiles} files` : 'Upload one file'}
              {maxFileSize && ` (max ${Math.round(maxFileSize / 1024 / 1024)}MB each)`}
            </Typography>
            
            {acceptedFileTypes.length > 0 && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Accepted types: {acceptedFileTypes.join(', ')}
                </Typography>
              </Box>
            )}

            <input
              id="file-input"
              type="file"
              multiple={isMulti}
              accept={acceptedFileTypes.join(',')}
              onChange={handleFileInput}
              style={{ display: 'none' }}
            />
          </Box>

          {/* Selected Files */}
          {selectedFiles.length > 0 && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Selected Files ({selectedFiles.length})
              </Typography>
              <Grid container spacing={1}>
                {selectedFiles.map((file, index) => (
                  <Grid item key={index}>
                    <Chip
                      label={`${file.name} (${Math.round(file.size / 1024)}KB)`}
                      onDelete={() => removeFile(index)}
                      deleteIcon={<XIcon size={16} />}
                      variant="outlined"
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* Upload Progress */}
          {uploading && (
            <Box>
              <Typography variant="body2" gutterBottom>
                Uploading... {Math.round(uploadProgress)}%
              </Typography>
              <LinearProgress variant="determinate" value={uploadProgress} />
            </Box>
          )}

          {/* Configuration Info */}
          <Box>
            <Typography variant="caption" color="text.secondary">
              Files will be categorized based on their type and stored in your media library.
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={uploading}>
          Cancel
        </Button>
        <Button
          onClick={uploadFiles}
          variant="contained"
          disabled={selectedFiles.length === 0 || uploading}
        >
          {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} file${selectedFiles.length !== 1 ? 's' : ''}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};