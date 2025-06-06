'use client';

import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Stack, 
  IconButton,
  Chip,
  Tooltip
} from '@mui/material';
import { PencilSimple, Trash, Eye } from '@phosphor-icons/react';

export default function SectionList({ sections = [], onEdit, onDelete, onPreview }) {
  if (sections.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <Typography variant="body1" color="text.secondary">
          No sections created yet
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Use the "Add Section" button below to create your first section
        </Typography>
      </Box>
    );
  }

  const getTemplateColor = (templateId) => {
    const colors = {
      'textOnly': 'primary',
      'imageBlock': 'secondary', 
      'imageTop': 'success',
      'featureGrid': 'warning',
      'centeredCTA': 'error',
      'testimonialGrid': 'info',
      'logoBar': 'default'
    };
    return colors[templateId] || 'default';
  };

  const getSectionPreview = (section) => {
    const preview = [];
    if (section.headline) preview.push(section.headline);
    if (section.subheadline) preview.push(section.subheadline);
    if (section.body_text) preview.push(section.body_text);
    if (section.content) preview.push(section.content);
    
    return preview.join(' • ').substring(0, 100) + (preview.join(' • ').length > 100 ? '...' : '');
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Sections ({sections.length})
      </Typography>
      
      <Stack spacing={2}>
        {sections.map((section, index) => (
          <Paper
            key={section.id}
            variant="outlined"
            sx={{ 
              p: 3,
              '&:hover': {
                boxShadow: 2,
                borderColor: 'primary.main'
              },
              transition: 'all 0.2s ease-in-out'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {section.title || 'Untitled Section'}
                  </Typography>
                  
                  <Chip 
                    size="small"
                    label={section.template?.title || 'No Template'}
                    color={getTemplateColor(section.template_id)}
                    variant="outlined"
                  />
                  
                  <Typography variant="caption" color="text.secondary">
                    #{index + 1}
                  </Typography>
                </Box>

                {/* Preview Content */}
                {getSectionPreview(section) && (
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ 
                      mb: 1,
                      fontStyle: 'italic',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {getSectionPreview(section)}
                  </Typography>
                )}

                {/* Meta Info */}
                <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                  {section.layout_variant && section.layout_variant !== 'default' && (
                    <Typography variant="caption" color="text.secondary">
                      Layout: {section.layout_variant}
                    </Typography>
                  )}
                  
                  {section.updated_at && (
                    <Typography variant="caption" color="text.secondary">
                      Updated: {new Date(section.updated_at).toLocaleDateString()}
                    </Typography>
                  )}
                </Stack>
              </Box>

              {/* Actions */}
              <Stack direction="row" spacing={1}>
                {onPreview && (
                  <Tooltip title="Preview Section">
                    <IconButton 
                      size="small"
                      onClick={() => onPreview(section)}
                      sx={{ color: 'text.secondary' }}
                    >
                      <Eye size={18} />
                    </IconButton>
                  </Tooltip>
                )}
                
                <Tooltip title="Edit Section">
                  <IconButton 
                    size="small"
                    onClick={() => onEdit(section)}
                    sx={{ color: 'primary.main' }}
                  >
                    <PencilSimple size={18} />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="Delete Section">
                  <IconButton 
                    size="small"
                    onClick={() => onDelete(section)}
                    sx={{ color: 'error.main' }}
                  >
                    <Trash size={18} />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Box>
          </Paper>
        ))}
      </Stack>
    </Box>
  );
}