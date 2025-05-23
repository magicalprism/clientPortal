'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { LinkSimple } from '@phosphor-icons/react';

export const ExternalLinkModal = ({
  open,
  onClose,
  onComplete,
  field,
  config, // This is the media collection config
  record,
  existingMedia = null, // For editing existing media
  isEditing = false // Whether we're editing or creating
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Get field configurations from config using existing pattern
  const getFieldConfig = (fieldName) => {
    return config?.fields?.find(f => f.name === fieldName) || {};
  };

  // Get all available fields from config
  const availableFields = config?.fields || [];
  
  // Get external link types from config using existing pattern
  const mimeTypeField = getFieldConfig('mime_type');
  const availableMimeTypes = mimeTypeField?.options || [];
  const externalLinkTypes = availableMimeTypes
    .filter(type => type.value?.startsWith('external/'))
    .map(type => ({ value: type.value, label: type.label }));
    
  // Fallback if no external types in config
  const linkTypes = externalLinkTypes.length > 0 ? externalLinkTypes : [
    { value: 'external/url', label: 'General Link' }
  ];

  // Initialize form data dynamically based on config
  const getInitialFormData = () => {
    const initialData = {};
    
    if (isEditing && existingMedia) {
      // Pre-populate with existing media data
      availableFields.forEach(fieldConfig => {
        const fieldName = fieldConfig.name;
        initialData[fieldName] = existingMedia[fieldName] || '';
      });
      initialData.url = existingMedia.url || '';
      initialData.is_external = existingMedia.is_external || false;
    } else {
      // Creating new external link
      initialData.url = '';
      initialData.is_external = true;
      
      // Add fields that exist in config
      availableFields.forEach(fieldConfig => {
        const fieldName = fieldConfig.name;
        
        // Set default values based on field type
        if (fieldName === 'mime_type') {
          initialData[fieldName] = linkTypes[0]?.value || 'external/url';
        } else if (fieldConfig.type === 'boolean') {
          initialData[fieldName] = false;
        } else if (fieldConfig.type === 'select') {
          initialData[fieldName] = fieldConfig.options?.[0]?.value || '';
        } else {
          initialData[fieldName] = '';
        }
      });
    }
    
    return initialData;
  };

  const [formData, setFormData] = useState(getInitialFormData);

  // Update form data when existingMedia changes
  useEffect(() => {
    setFormData(getInitialFormData());
  }, [existingMedia, isEditing]);

  const handleChange = (fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
    
    // Clear error when user starts typing
    if (error) setError('');
  };

  const validateUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.url.trim()) {
      setError('URL is required');
      return;
    }

    if (!validateUrl(formData.url)) {
      setError('Please enter a valid URL');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create the external link data using config field structure
      const linkData = {};
      
      // Process each field that exists in config
      availableFields.forEach(fieldConfig => {
        const fieldName = fieldConfig.name;
        const fieldValue = formData[fieldName];
        
        // Only include fields that have values or are required
        if (fieldValue !== '' && fieldValue !== null && fieldValue !== undefined) {
          linkData[fieldName] = fieldValue;
        }
      });
      
      // Ensure required fields
      linkData.url = formData.url.trim();
      linkData.is_external = true;
      
      // Set defaults for common fields if they exist in config but no value provided
      const titleField = getFieldConfig('title');
      if (titleField && !linkData.title) {
        linkData.title = 'External Link';
      }
      
      const altTextField = getFieldConfig('alt_text');
      if (altTextField && !linkData.alt_text) {
        linkData.alt_text = linkData.title || 'External Link';
      }
      
      const statusField = getFieldConfig('status');
      if (statusField && !linkData.status) {
        linkData.status = 'linked';
      }
      
      // Add company_id if field exists in config and record has it
      const companyField = getFieldConfig('company_id');
      if (companyField && record?.company_id) {
        linkData.company_id = record.company_id;
      }

      onComplete(linkData);
      
      // Reset form
      setFormData(getInitialFormData());
    } catch (err) {
      console.error('Error creating external link:', err);
      setError('Failed to create external link');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData(getInitialFormData());
    setError('');
    onClose();
  };

  // Function to render field based on config
  const renderField = (fieldConfig) => {
    const fieldName = fieldConfig.name;
    const fieldValue = formData[fieldName] || '';
    
    // Skip URL field as it's handled separately
    if (fieldName === 'url') return null;
    
    // Skip system fields
    if (['id', 'created_at', 'updated_at', 'is_external'].includes(fieldName)) return null;
    
    const fieldProps = {
      key: fieldName,
      label: fieldConfig.label || fieldName,
      value: fieldValue,
      onChange: (e) => handleChange(fieldName, e.target.value),
      fullWidth: true
    };

    // Handle select fields (including mime_type)
    if (fieldConfig.type === 'select') {
      let options = fieldConfig.options || [];
      
      // Special handling for mime_type to filter external types
      if (fieldName === 'mime_type') {
        options = linkTypes;
      }
      
      if (options.length > 1) {
        return (
          <FormControl fullWidth key={fieldName}>
            <InputLabel>{fieldConfig.label}</InputLabel>
            <Select
              value={fieldValue}
              onChange={(e) => handleChange(fieldName, e.target.value)}
              label={fieldConfig.label}
            >
              {options.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );
      }
      return null;
    }

    // For all other field types, use a simple TextField
    // The existing field renderers handle complex logic elsewhere
    const isMultiline = ['description', 'alt_text', 'copyright'].includes(fieldName) || 
      fieldConfig.label?.toLowerCase().includes('description') ||
      fieldConfig.label?.toLowerCase().includes('notes') ||
      fieldConfig.type === 'richText';
      
    return (
      <TextField
        {...fieldProps}
        multiline={isMultiline}
        rows={isMultiline ? (fieldConfig.type === 'richText' ? 4 : 2) : 1}
        placeholder={`Enter ${fieldConfig.label?.toLowerCase() || fieldName}`}
      />
    );
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <LinkSimple size={20} />
          {isEditing ? 
            `Edit ${field?.label || 'Media'}` : 
            (field?.label ? `Add External ${field.label}` : 'Add External Link')
          }
        </Box>
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2}>
            {error && (
              <Alert severity="error">
                {error}
              </Alert>
            )}

            {/* URL field - always shown */}
            <TextField
              label="URL"
              value={formData.url}
              onChange={(e) => handleChange('url', e.target.value)}
              placeholder="https://example.com/file.pdf"
              required
              fullWidth
              error={!!error && !formData.url.trim()}
              helperText="Enter the full URL including https://"
            />

            {/* Dynamically render all other fields from config */}
            {availableFields.map(fieldConfig => renderField(fieldConfig))}
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !formData.url.trim()}
          >
            {loading ? (isEditing ? 'Updating...' : 'Adding...') : (isEditing ? 'Update' : 'Add Link')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};