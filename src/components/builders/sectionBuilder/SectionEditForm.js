'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Stack,
  Divider
} from '@mui/material';
import { sectionTemplates } from '@/components/templates/sectionTemplates';
import { GalleryRelationshipField } from '@/components/fields/media/GalleryRelationshipField';

// Map template field names to database column names
const FIELD_MAPPING = {
  'headline': 'headline',
  'subheadline': 'subheadline',
  'body_text': 'body_text',
  'button_text': 'button_text',
  'button_url': 'button_url',
  'layout_variant': 'layout_variant',
  'eyebrow': 'eyebrow',
  'content': 'content',
  'media_items': 'media_items' // This will be handled separately for pivot tables
};

// Field configurations for better UX
const FIELD_CONFIGS = {
  'headline': { label: 'Headline', type: 'text', multiline: false },
  'subheadline': { label: 'Subheadline', type: 'text', multiline: false },
  'eyebrow': { label: 'Eyebrow Text', type: 'text', multiline: false },
  'body_text': { label: 'Body Text', type: 'text', multiline: true, rows: 4 },
  'content': { label: 'Content', type: 'text', multiline: true, rows: 6 },
  'button_text': { label: 'Button Text', type: 'text', multiline: false },
  'button_url': { label: 'Button URL', type: 'url', multiline: false },
  'layout_variant': { 
    label: 'Layout Variant', 
    type: 'select', 
    options: [
      { value: 'default', label: 'Default' },
      { value: 'left', label: 'Left' },
      { value: 'right', label: 'Right' },
      { value: 'center', label: 'Center' }
    ]
  },
  'media_items': { 
    label: 'Media Items', 
    type: 'galleryRelationship',
    relation: {
      table: 'media',
      labelField: 'title',
      junctionTable: 'media_section',
      sourceKey: 'section_id',
      targetKey: 'media_id'
    }
  }
};

export default function SectionEditForm({ section, onSave, onClose }) {
  const [title, setTitle] = useState(section.title || '');
  const [templateId, setTemplateId] = useState(section.template_id || '');
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);

  const selectedTemplate = sectionTemplates.find(t => t.id === templateId);

  // Initialize form data when section or template changes
  useEffect(() => {
    if (!section) return;

    const newFormData = {};
    
    // Initialize with current section values
    Object.keys(FIELD_MAPPING).forEach(fieldName => {
      const dbColumn = FIELD_MAPPING[fieldName];
      
      if (fieldName === 'media_items') {
        // For media_items, we'll load this from the junction table
        // The GalleryRelationshipField will handle this automatically
        newFormData[fieldName] = [];
      } else {
        newFormData[fieldName] = section[dbColumn] || '';
      }
    });

    console.log('[SectionEditForm] Initialized form data:', newFormData);
    setFormData(newFormData);
  }, [section, templateId]);

  const handleFieldChange = (fieldName, value) => {
    console.log('[SectionEditForm] Field changed:', { fieldName, value });
    setFormData(prev => ({ ...prev, [fieldName]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    
    try {
      console.log('[SectionEditForm] Saving section with data:', { title, templateId, formData });

      // Map form data back to database columns
      const dbUpdates = {};
      Object.keys(formData).forEach(fieldName => {
        const dbColumn = FIELD_MAPPING[fieldName];
        if (dbColumn && dbColumn !== 'media_items') { // Handle media_items separately
          dbUpdates[dbColumn] = formData[fieldName] || null;
        }
      });

      // Prepare the complete update payload
      const updatePayload = {
        title,
        template_id: templateId,
        ...dbUpdates
      };

      console.log('[SectionEditForm] Update payload:', updatePayload);

      // Note: media_items relationships are handled automatically by the GalleryRelationshipField
      // through the junction table (media_section), so we don't need to include them in the main update
      await onSave(updatePayload);
      
    } catch (error) {
      console.error('[SectionEditForm] Error saving section:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderField = (fieldName) => {
    const config = FIELD_CONFIGS[fieldName] || { 
      label: fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), 
      type: 'text' 
    };
    
    const value = formData[fieldName] || '';

    switch (config.type) {
      case 'select':
        return (
          <FormControl fullWidth key={fieldName}>
            <InputLabel>{config.label}</InputLabel>
            <Select
              value={value}
              label={config.label}
              onChange={(e) => handleFieldChange(fieldName, e.target.value)}
            >
              {config.options?.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case 'url':
        return (
          <TextField
            key={fieldName}
            fullWidth
            label={config.label}
            type="url"
            value={value}
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
            placeholder="https://example.com"
          />
        );

      case 'galleryRelationship':
        // Create a proper field configuration for the GalleryRelationshipField
        const mediaField = {
          name: fieldName,
          label: config.label,
          type: 'galleryRelationship',
          relation: config.relation
        };

        // Create a mock record with the section ID for the relationship
        const mockRecord = {
          id: section?.id,
          ...section
        };

        return (
          <Box key={fieldName} sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              {config.label}
            </Typography>
            <GalleryRelationshipField
              field={mediaField}
              value={value}
              onChange={(newValue) => handleFieldChange(fieldName, newValue)}
              record={mockRecord}
              editable={true}
            />
          </Box>
        );

      default:
        return (
          <TextField
            key={fieldName}
            fullWidth
            label={config.label}
            value={value}
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
            multiline={config.multiline}
            rows={config.rows}
            placeholder={`Enter ${config.label.toLowerCase()}`}
          />
        );
    }
  };

  if (!section) {
    return (
      <Box>
        <Typography variant="h6">Section not found</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Edit Section
      </Typography>
      
      <Stack spacing={3} mt={2}>
        {/* Basic Info */}
        <Box>
          <Typography variant="subtitle2" gutterBottom color="text.secondary">
            Basic Information
          </Typography>
          
          <Stack spacing={2}>
            <TextField
              fullWidth
              label="Section Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a descriptive title for this section"
            />

            <FormControl fullWidth>
              <InputLabel>Template</InputLabel>
              <Select
                value={templateId}
                label="Template"
                onChange={(e) => setTemplateId(e.target.value)}
              >
                {sectionTemplates.map((template) => (
                  <MenuItem key={template.id} value={template.id}>
                    {template.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </Box>

        {/* Template Fields */}
        {selectedTemplate && (
          <>
            <Divider />
            <Box>
              <Typography variant="subtitle2" gutterBottom color="text.secondary">
                Template Fields ({selectedTemplate.title})
              </Typography>
              
              <Stack spacing={2}>
                {selectedTemplate.fields.map((field) => {
                  const fieldName = typeof field === 'string' ? field : field?.name;
                  if (!fieldName || !FIELD_MAPPING[fieldName]) {
                    console.warn('[SectionEditForm] Unknown field:', fieldName);
                    return null;
                  }
                  return renderField(fieldName);
                })}
              </Stack>
            </Box>
          </>
        )}

        {/* Actions */}
        <Divider />
        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSave}
            disabled={loading || !title.trim() || !templateId}
          >
            {loading ? 'Saving...' : 'Save Section'}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}