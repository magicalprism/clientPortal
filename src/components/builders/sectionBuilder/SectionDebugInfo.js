'use client';

import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Stack,
  Alert
} from '@mui/material';
import { CaretDown, Bug } from '@phosphor-icons/react';
import { sectionTemplates } from '@/components/templates/sectionTemplates';

/**
 * Debug component to help diagnose section and template issues
 * Shows database schema status, template matching, and specific errors
 * Remove this component once debugging is complete
 */
export default function SectionDebugInfo({ sections }) {
  const [expanded, setExpanded] = useState(false);

  if (!sections || sections.length === 0) {
    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        <Typography variant="body2">
          No sections found. This could mean:
        </Typography>
        <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
          <li>The sections haven't been created yet</li>
          <li>The database query failed</li>
          <li>The <code>section</code> table doesn't exist</li>
        </ul>
      </Alert>
    );
  }

  const templateStats = {
    total: sections.length,
    withTemplate: sections.filter(s => s.template).length,
    withTemplateId: sections.filter(s => s.template_id).length,
    missingTemplate: sections.filter(s => {
      const templateId = s.template_id;
      return templateId && !sectionTemplates.find(t => t.id === templateId);
    }).length
  };

  const uniqueTemplateIds = [...new Set(
    sections.map(s => s.template_id).filter(Boolean)
  )];

  return (
    <Box sx={{ mb: 2 }}>
      <Accordion expanded={expanded} onChange={() => setExpanded(!expanded)}>
        <AccordionSummary expandIcon={<CaretDown />}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Bug size={20} />
            <Typography variant="subtitle2">
              Section Debug Info
            </Typography>
            <Chip 
              size="small" 
              label={`${templateStats.withTemplate}/${templateStats.total} templates loaded`}
              color={templateStats.withTemplate === templateStats.total ? 'success' : 'warning'}
            />
          </Stack>
        </AccordionSummary>
        
        <AccordionDetails>
          <Stack spacing={2}>
            {/* Database Schema Check */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Database Schema Status
              </Typography>
              <Stack spacing={1}>
                <Alert severity="info" sx={{ py: 1 }}>
                  <Typography variant="caption">
                    <strong>Required Tables:</strong>
                  </Typography>
                  <ul style={{ margin: '4px 0', paddingLeft: '16px' }}>
                    <li><code>section</code> - Main sections table</li>
                    <li><code>media_section</code> - Junction table for media relationships</li>
                  </ul>
                  <Typography variant="caption">
                    If these tables don't exist, sections won't load properly.
                  </Typography>
                </Alert>
                
                <Alert severity="warning" sx={{ py: 1 }}>
                  <Typography variant="caption">
                    <strong>Note:</strong> No <code>section_template</code> table needed! 
                    Templates are handled in JavaScript only.
                  </Typography>
                </Alert>
              </Stack>
            </Box>

            {/* Template Statistics */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Template Statistics
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Chip label={`Total sections: ${templateStats.total}`} />
                <Chip 
                  label={`With template object: ${templateStats.withTemplate}`}
                  color={templateStats.withTemplate > 0 ? 'success' : 'default'}
                />
                <Chip 
                  label={`With template ID: ${templateStats.withTemplateId}`}
                  color={templateStats.withTemplateId > 0 ? 'success' : 'default'}
                />
                <Chip 
                  label={`Missing templates: ${templateStats.missingTemplate}`}
                  color={templateStats.missingTemplate > 0 ? 'error' : 'success'}
                />
              </Stack>
            </Box>

            {/* Available Templates */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Available Templates ({sectionTemplates.length})
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {sectionTemplates.map(template => (
                  <Chip 
                    key={template.id} 
                    label={`${template.id}: ${template.title}`}
                    size="small"
                    variant="outlined"
                  />
                ))}
              </Stack>
            </Box>

            {/* Template IDs in Use */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Template IDs in Use ({uniqueTemplateIds.length})
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {uniqueTemplateIds.map(templateId => {
                  const template = sectionTemplates.find(t => t.id === templateId);
                  return (
                    <Chip 
                      key={templateId} 
                      label={templateId}
                      size="small"
                      color={template ? 'success' : 'error'}
                    />
                  );
                })}
              </Stack>
            </Box>

            {/* Individual Section Details */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Section Details
              </Typography>
              <Stack spacing={1}>
                {sections.map((section, index) => {
                  const templateId = section.template_id;
                  const template = sectionTemplates.find(t => t.id === templateId);
                  const hasHydratedTemplate = !!section.template;
                  
                  return (
                    <Box 
                      key={section.id} 
                      sx={{ 
                        p: 2, 
                        border: '1px solid #ddd', 
                        borderRadius: 1,
                        bgcolor: hasHydratedTemplate ? 'success.50' : 'warning.50'
                      }}
                    >
                      <Typography variant="caption" display="block">
                        <strong>#{index + 1}: {section.title || 'Untitled'}</strong>
                      </Typography>
                      <Typography variant="caption" display="block">
                        ID: {section.id}
                      </Typography>
                      <Typography variant="caption" display="block">
                        Template ID: {templateId || 'None'}
                      </Typography>
                      <Typography variant="caption" display="block">
                        Template Found: {template ? template.title : 'No'}
                      </Typography>
                      <Typography variant="caption" display="block">
                        Hydrated Template: {hasHydratedTemplate ? 'Yes' : 'No'}
                      </Typography>
                      
                      {!template && templateId && (
                        <Alert severity="error" sx={{ mt: 1, py: 0.5 }}>
                          <Typography variant="caption">
                            Template "{templateId}" not found in sectionTemplates array
                          </Typography>
                        </Alert>
                      )}
                    </Box>
                  );
                })}
              </Stack>
            </Box>

            {/* Common Issues & Solutions */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Common Issues & Quick Fixes
              </Typography>
              <Stack spacing={1}>
                {templateStats.missingTemplate > 0 && (
                  <Alert severity="error">
                    <Typography variant="caption">
                      <strong>Missing Templates:</strong> {templateStats.missingTemplate} sections have invalid template IDs. 
                      Edit these sections and select valid templates.
                    </Typography>
                  </Alert>
                )}
                
                {templateStats.withTemplate < templateStats.total && (
                  <Alert severity="warning">
                    <Typography variant="caption">
                      <strong>Template Hydration Issue:</strong> Some sections aren't getting their template objects. 
                      Check console logs for template loading errors.
                    </Typography>
                  </Alert>
                )}
                
                <Alert severity="info">
                  <Typography variant="caption">
                    <strong>If sections aren't loading:</strong> Check that the <code>section</code> table exists and has the correct schema.
                  </Typography>
                </Alert>
              </Stack>
            </Box>
          </Stack>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}