'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Grid
} from '@mui/material';
import { LinkSimple, PencilSimple } from '@phosphor-icons/react';
import { createClient } from '@/lib/supabase/browser';

export const DynamicMediaModal = ({
  open,
  onClose,
  onComplete,
  field,
  config, // This is the media collection config
  record,
  existingMedia = null, // For editing existing media
  isEditing = false // Whether we're editing or creating
}) => {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  console.log('[DynamicMediaModal] Props:', {
    isEditing,
    existingMedia,
    configKeys: config ? Object.keys(config) : 'no config',
    configName: config?.name,
    fieldsLength: config?.fields?.length,
    fullConfig: config
  });

  // Get available fields from media config
  const availableFields = config?.fields || [];
  console.log('[DynamicMediaModal] Available fields:', availableFields.map(f => f.name));
  
  // Filter out system fields that shouldn't be editable
  const editableFields = availableFields.filter(fieldConfig => 
    !['id', 'created_at', 'updated_at'].includes(fieldConfig.name) &&
    fieldConfig.database !== false
  );

  console.log('[DynamicMediaModal] Editable fields:', editableFields.map(f => f.name));

  // Get default value based on field type
  const getDefaultValue = (fieldConfig) => {
    switch (fieldConfig.type) {
      case 'boolean':
        return false;
      case 'select':
      case 'status':
        return fieldConfig.options?.[0]?.value || '';
      case 'multiRelationship':
        return [];
      case 'relationship':
        return null;
      default:
        return '';
    }
  };

  // Initialize form data dynamically based on config
  const getInitialFormData = () => {
    const initialData = {};
    
    if (isEditing && existingMedia) {
      console.log('[DynamicMediaModal] Pre-populating with existing data:', existingMedia);
      // Pre-populate with existing media data
      editableFields.forEach(fieldConfig => {
        const fieldName = fieldConfig.name;
        initialData[fieldName] = existingMedia[fieldName] ?? getDefaultValue(fieldConfig);
      });
    } else {
      console.log('[DynamicMediaModal] Creating new external link');
      // Creating new external link
      editableFields.forEach(fieldConfig => {
        const fieldName = fieldConfig.name;
        
        // Set special defaults for external links
        if (fieldName === 'is_external') {
          initialData[fieldName] = true;
        } else if (fieldName === 'url') {
          initialData[fieldName] = '';
        } else if (fieldName === 'mime_type') {
          // Find external link types from config
          const mimeTypeField = config?.fields?.find(f => f.name === 'mime_type');
          const externalTypes = mimeTypeField?.options?.filter(opt => opt.value?.startsWith('external/'));
          initialData[fieldName] = externalTypes?.[0]?.value || 'external/url';
        } else if (fieldName === 'status') {
          initialData[fieldName] = 'linked';
        } else if (fieldName === 'company_id' && record?.company_id) {
          initialData[fieldName] = record.company_id;
        } else {
          initialData[fieldName] = getDefaultValue(fieldConfig);
        }
      });
    }
    
    console.log('[DynamicMediaModal] Initial form data:', initialData);
    return initialData;
  };

  // Initialize state
  useEffect(() => {
    if (open) {
      const newFormData = getInitialFormData();
      setFormData(newFormData);
      setHasChanges(false);
      setError('');
      console.log('[DynamicMediaModal] Form initialized with:', newFormData);
    }
  }, [open, existingMedia, isEditing]);

  const handleFieldChange = (fieldName, value) => {
    console.log(`[DynamicMediaModal] Field ${fieldName} changed:`, value);
    
    setFormData(prev => {
      const newData = {
        ...prev,
        [fieldName]: value
      };
      console.log('[DynamicMediaModal] New form data:', newData);
      return newData;
    });
    
    setHasChanges(true);
    
    // Clear error when user makes changes
    if (error) setError('');
  };

  const validateForm = () => {
    // URL is required for external links
    if (!isEditing || existingMedia?.is_external) {
      if (!formData.url?.trim()) {
        setError('URL is required');
        return false;
      }

      // Validate URL format
      try {
        new URL(formData.url);
      } catch {
        setError('Please enter a valid URL');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (isEditing && existingMedia?.id) {
        // Update existing media
        const updateData = { ...formData };
        
        // Remove any undefined or null values
        Object.keys(updateData).forEach(key => {
          if (updateData[key] === undefined || updateData[key] === null) {
            delete updateData[key];
          }
        });

        console.log('[DynamicMediaModal] Updating with data:', updateData);

        const { data, error: updateError } = await supabase
          .from('media')
          .update(updateData)
          .eq('id', existingMedia.id)
          .select()
          .single();

        if (updateError) throw updateError;

        onComplete(data);
      } else {
        // Create new media record
        const createData = { ...formData };
        
        // Ensure required fields for external links
        if (!createData.is_external) {
          createData.is_external = true;
        }
        
        // Set default title if not provided
        if (!createData.title && createData.url) {
          createData.title = 'External Link';
        }
        
        // Set default alt_text if not provided
        if (!createData.alt_text && createData.title) {
          createData.alt_text = createData.title;
        }

        console.log('[DynamicMediaModal] Creating with data:', createData);

        const { data, error: createError } = await supabase
          .from('media')
          .insert(createData)
          .select()
          .single();

        if (createError) throw createError;

        onComplete(data);
      }
      
      handleClose();
    } catch (err) {
      console.error('[DynamicMediaModal] Error:', err);
      setError(err.message || `Failed to ${isEditing ? 'update' : 'create'} media`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({});
    setError('');
    setHasChanges(false);
    onClose();
  };

  // Render field based on type
  const renderField = (fieldConfig) => {
    const fieldName = fieldConfig.name;
    const fieldValue = formData[fieldName] ?? '';
    const fieldLabel = fieldConfig.label || fieldName;

    console.log(`[DynamicMediaModal] Rendering field ${fieldName}:`, { 
      type: fieldConfig.type, 
      value: fieldValue,
      hasOptions: fieldConfig.options?.length 
    });

    // Handle different field types
    switch (fieldConfig.type) {
      case 'boolean':
        return (
          <FormControlLabel
            key={fieldName}
            control={
              <Checkbox
                checked={Boolean(fieldValue)}
                onChange={(e) => handleFieldChange(fieldName, e.target.checked)}
              />
            }
            label={fieldLabel}
          />
        );

      case 'select':
      case 'status':
        const options = fieldConfig.options || [];
        // Filter external types for mime_type when creating external links
        const filteredOptions = fieldName === 'mime_type' && !isEditing ? 
          options.filter(opt => opt.value?.startsWith('external/')) : 
          options;

        if (filteredOptions.length === 0) {
          return null;
        }

        return (
          <FormControl fullWidth key={fieldName}>
            <InputLabel>{fieldLabel}</InputLabel>
            <Select
              value={fieldValue || ''}
              onChange={(e) => handleFieldChange(fieldName, e.target.value)}
              label={fieldLabel}
            >
              {filteredOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case 'richText':
        return (
          <TextField
            key={fieldName}
            label={fieldLabel}
            value={fieldValue || ''}
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
            fullWidth
            multiline
            rows={4}
            placeholder={`Enter ${fieldLabel.toLowerCase()}`}
          />
        );

      case 'link':
        return (
          <TextField
            key={fieldName}
            label={fieldLabel}
            value={fieldValue || ''}
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
            fullWidth
            type="url"
            placeholder="https://example.com"
            required={fieldName === 'url'}
            error={fieldName === 'url' && error && !fieldValue?.trim()}
            helperText={fieldName === 'url' ? "Enter the full URL including https://" : undefined}
          />
        );

      case 'relationship':
        // For now, just render as text input for the ID
        // You could enhance this with a proper relationship picker
        return (
          <TextField
            key={fieldName}
            label={`${fieldLabel} ID`}
            value={fieldValue || ''}
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
            fullWidth
            type="number"
            placeholder={`Enter ${fieldLabel.toLowerCase()} ID`}
          />
        );

      default:
        // Default to text field
        const isMultiline = ['description', 'alt_text', 'copyright'].includes(fieldName) || 
          fieldLabel.toLowerCase().includes('description') ||
          fieldLabel.toLowerCase().includes('notes');

        return (
          <TextField
            key={fieldName}
            label={fieldLabel}
            value={fieldValue || ''}
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
            fullWidth
            multiline={isMultiline}
            rows={isMultiline ? 2 : 1}
            placeholder={`Enter ${fieldLabel.toLowerCase()}`}
          />
        );
    }
  };

  // Group fields by tab for better organization
  const fieldsByTab = editableFields.reduce((acc, fieldConfig) => {
    const tab = fieldConfig.tab || 'General';
    if (!acc[tab]) acc[tab] = [];
    acc[tab].push(fieldConfig);
    return acc;
  }, {});

  const tabs = Object.keys(fieldsByTab);
  const shouldShowTabs = tabs.length > 1;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          {isEditing ? <PencilSimple size={20} /> : <LinkSimple size={20} />}
          {isEditing ? 
            `Edit ${field?.label || 'Media'}` : 
            `Add ${field?.label || 'Media'}`
          }
        </Box>
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={3}>
            {error && (
              <Alert severity="error">
                {error}
              </Alert>
            )}

            {editableFields.length === 0 && (
              <Alert severity="warning">
                No editable fields found in media configuration.
              </Alert>
            )}

            {shouldShowTabs ? (
              // Render fields grouped by tabs
              tabs.map(tabName => (
                <Box key={tabName}>
                  <Typography variant="h6" gutterBottom color="primary">
                    {tabName}
                  </Typography>
                  <Grid container spacing={2}>
                    {fieldsByTab[tabName].map(fieldConfig => (
                      <Grid item xs={12} key={fieldConfig.name}>
                        {renderField(fieldConfig)}
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              ))
            ) : (
              // Render all fields in one group
              <Grid container spacing={2}>
                {editableFields.map(fieldConfig => (
                  <Grid item xs={12} key={fieldConfig.name}>
                    {renderField(fieldConfig)}
                  </Grid>
                ))}
              </Grid>
            )}

            {/* Show current values for debugging in development */}
            {process.env.NODE_ENV === 'development' && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="caption" display="block" gutterBottom>
                  Debug - Form Data ({Object.keys(formData).length} fields):
                </Typography>
                <pre style={{ fontSize: '0.75rem', overflow: 'auto', maxHeight: '200px' }}>
                  {JSON.stringify(formData, null, 2)}
                </pre>
              </Box>
            )}
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || (!hasChanges && isEditing)}
          >
            {loading ? 
              (isEditing ? 'Updating...' : 'Creating...') : 
              (isEditing ? 'Update' : 'Create')
            }
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};