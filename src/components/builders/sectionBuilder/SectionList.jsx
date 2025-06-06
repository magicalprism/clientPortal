'use client';

import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  IconButton,
  Stack,
  Chip,
  Alert,
  Paper,
  Drawer,
  Button,
  Divider
} from '@mui/material';
import { 
  PencilSimple, 
  Trash, 
  DotsSixVertical, 
  Note,
  X 
} from '@phosphor-icons/react';
import { CSS } from '@dnd-kit/utilities';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { sectionTemplates } from '@/components/templates/sectionTemplates';
import { getSpiritualFallback } from '@/data/spiritualLorem';
import RichTextFieldRenderer from '@/components/fields/text/richText/RichTextFieldRenderer';
import { reorderSections } from '@/components/builders/sectionBuilder/queries/sections';

// Sortable Wireframe Component
const SortableWireframe = ({ section, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: section.id });

  const style = {
    transform: transform ? CSS.Transform.toString(transform) : undefined,
    transition,
    zIndex: isDragging ? 10 : undefined
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      sx={{
        opacity: isDragging ? 0.7 : 1,
        backgroundColor: isDragging ? 'background.paper' : 'inherit',
        borderRadius: 2,
        boxShadow: isDragging ? 3 : 'none'
      }}
    >
      {children({ listeners, attributes })}
    </Box>
  );
};

// Individual wireframe preview component
const WireframePreview = ({ section, notesOpen, onToggleNotes, onEdit, onDelete, dragHandleProps }) => {
  const template = sectionTemplates.find(t => t.id === section.template_id);
  
  if (!template) {
    return (
      <Paper
        variant="outlined"
        sx={{ 
          p: 3,
          borderColor: 'error.main',
          bgcolor: 'error.50'
        }}
      >
        <Alert severity="error">
          <Typography variant="body2">
            Template "{section.template_id}" not found. Please select a valid template.
          </Typography>
        </Alert>
      </Paper>
    );
  }

  // Prepare data for template render function
  const prepareTemplateData = () => {
    const data = {};
    
    // Map template fields to section data with spiritual fallbacks
    if (template.fields) {
      template.fields.forEach(fieldName => {
        const dbValue = section[fieldName];
        
        // Handle special array fields
        if (fieldName === 'testimonials') {
          data[fieldName] = dbValue && Array.isArray(dbValue) ? dbValue : [
            {
              name: "Sarah, CEO of Quantum Wellness Co.",
              text: "This chakra-aligned approach totally transformed my abundance mindset!",
              avatar: null
            },
            {
              name: "Jennifer, Sacred Business Coach", 
              text: "I manifested my soul purpose AND a Tesla in just 21 days using these techniques.",
              avatar: null
            },
            {
              name: "Crystal, Divine Feminine Leader",
              text: "Finally, a high-vibrational method that doesn't require toxic hustle culture!",
              avatar: null
            }
          ];
        } else if (fieldName === 'features') {
          data[fieldName] = dbValue && Array.isArray(dbValue) ? dbValue : [
            "Quantum-activated abundance codes",
            "Sacred geometry infused workflows", 
            "Third-eye opening business strategies",
            "Chakra-aligned profit optimization"
          ];
        } else if (fieldName === 'logos') {
          data[fieldName] = dbValue && Array.isArray(dbValue) ? dbValue : [
            { name: "Cosmic Entrepreneur", url: "#" },
            { name: "Sacred Business Academy", url: "#" },
            { name: "Awakened CEO Institute", url: "#" },
            { name: "Divine Abundance Co.", url: "#" }
          ];
        } else {
          data[fieldName] = getSpiritualFallback(fieldName, dbValue);
        }
      });
    }
    
    return data;
  };

  const templateData = prepareTemplateData();
  
  return (
    <Paper
      variant="outlined"
      sx={{ 
        overflow: 'hidden',
        '&:hover': {
          boxShadow: 2,
          borderColor: 'primary.main'
        },
        transition: 'all 0.2s ease-in-out',
        position: 'relative'
      }}
    >
      {/* Control Bar */}
      <Box sx={{ 
        p: 2, 
        bgcolor: 'grey.50', 
        borderBottom: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <IconButton
            size="small"
            {...dragHandleProps}
            sx={{ cursor: 'grab' }}
          >
            <DotsSixVertical size={16} />
          </IconButton>
          
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {section.title || 'Untitled Section'}
          </Typography>
          
          <Chip 
            size="small"
            label={template.title}
            color="primary"
            variant="outlined"
          />
        </Stack>

        <Stack direction="row" spacing={1}>
          {section.content && (
            <IconButton
              size="small"
              onClick={onToggleNotes}
              sx={{ 
                color: notesOpen ? 'primary.main' : 'text.secondary',
                bgcolor: notesOpen ? 'primary.50' : 'transparent'
              }}
            >
              <Note size={16} />
            </IconButton>
          )}
          
          <IconButton 
            size="small"
            onClick={onEdit}
            sx={{ color: 'primary.main' }}
          >
            <PencilSimple size={16} />
          </IconButton>
          
          <IconButton 
            size="small"
            onClick={onDelete}
            sx={{ color: 'error.main' }}
          >
            <Trash size={16} />
          </IconButton>
        </Stack>
      </Box>

      {/* Wireframe Content */}
      <Box sx={{ 
        p: 3,
        minHeight: 200,
        bgcolor: 'background.paper'
      }}>
        {template.render ? (
          template.render(templateData)
        ) : (
          <Alert severity="warning">
            <Typography variant="body2">
              Template "{template.id}" has no render function
            </Typography>
          </Alert>
        )}
      </Box>

      {/* Meta Info */}
      <Box sx={{ 
        px: 2, 
        py: 1, 
        bgcolor: 'grey.25',
        borderTop: '1px solid',
        borderColor: 'divider'
      }}>
        <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center">
          <Typography variant="caption" color="text.secondary">
            Updated: {section.updated_at ? new Date(section.updated_at).toLocaleDateString() : 'Never'}
          </Typography>
          
          <Stack direction="row" spacing={1}>
            {template.fields?.map(field => {
              const hasContent = section[field] && section[field].trim();
              return (
                <Chip
                  key={field}
                  size="small"
                  label={field}
                  color={hasContent ? 'success' : 'default'}
                  variant={hasContent ? 'filled' : 'outlined'}
                  sx={{ fontSize: '0.6rem', height: 20 }}
                />
              );
            })}
          </Stack>
        </Stack>
      </Box>
    </Paper>
  );
};

export default function SectionWireframeList({ 
  sections = [], 
  onEdit, 
  onDelete, 
  onReorder 
}) {
  const [activeSection, setActiveSection] = useState(null);
  const [notesSection, setNotesSection] = useState(null);

  const sensor = useSensor(PointerSensor);
  const sensors = useSensors(sensor);

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveSection(null);
    
    if (!active || !over || active.id === over.id) return;

    const oldIndex = sections.findIndex(section => section.id === active.id);
    const newIndex = sections.findIndex(section => section.id === over.id);
    
    if (oldIndex !== -1 && newIndex !== -1) {
      const newOrder = arrayMove(sections, oldIndex, newIndex);
      onReorder?.(newOrder);
    }
  };

  const handleDragStart = (event) => {
    setActiveSection(sections.find(section => section.id === event.active.id));
  };

  const handleToggleNotes = (section) => {
    setNotesSection(notesSection?.id === section.id ? null : section);
  };

  if (sections.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No sections created yet
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Use the "Add Section" button to create your first wireframe section
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative' }}>
      {/* Main Content Area */}
      <Box sx={{ 
        marginRight: notesSection ? '400px' : 0,
        transition: 'margin-right 0.3s ease-in-out'
      }}>
        <Typography variant="h6" gutterBottom>
          Wireframe Previews ({sections.length})
        </Typography>
        
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext 
            items={sections.map(section => section.id)} 
            strategy={verticalListSortingStrategy}
          >
            <Stack spacing={3}>
              {sections.map((section) => (
                <SortableWireframe key={section.id} section={section}>
                  {({ listeners, attributes }) => (
                    <WireframePreview
                      section={section}
                      notesOpen={notesSection?.id === section.id}
                      onToggleNotes={() => handleToggleNotes(section)}
                      onEdit={() => onEdit(section)}
                      onDelete={() => onDelete(section)}
                      dragHandleProps={{ ...listeners, ...attributes }}
                    />
                  )}
                </SortableWireframe>
              ))}
            </Stack>
          </SortableContext>

          <DragOverlay dropAnimation={null}>
            {activeSection && (
              <Paper sx={{ 
                p: 3, 
                borderRadius: 2, 
                backgroundColor: 'background.paper',
                border: '2px solid',
                borderColor: 'primary.main',
                boxShadow: 4,
                opacity: 0.95
              }}>
                <Typography variant="h6" gutterBottom>
                  {activeSection.title || 'Untitled Section'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Moving section...
                </Typography>
              </Paper>
            )}
          </DragOverlay>
        </DndContext>
      </Box>

      {/* Slideout Notes Panel */}
      <Drawer
        anchor="right"
        open={!!notesSection}
        onClose={() => setNotesSection(null)}
        variant="persistent"
        sx={{
          '& .MuiDrawer-paper': {
            width: 400,
            position: 'relative',
            height: 'auto',
            boxShadow: '-2px 0 8px rgba(0,0,0,0.1)',
            borderLeft: '1px solid',
            borderColor: 'divider'
          }
        }}
      >
        {notesSection && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              mb: 2
            }}>
              <Typography variant="h6">
                Section Notes
              </Typography>
              <IconButton 
                size="small" 
                onClick={() => setNotesSection(null)}
              >
                <X size={20} />
              </IconButton>
            </Box>

            <Typography variant="subtitle2" gutterBottom color="primary.main">
              {notesSection.title || 'Untitled Section'}
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Typography variant="body2" color="text.secondary" gutterBottom>
              Content & Notes:
            </Typography>

            <Box sx={{ 
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              p: 2,
              bgcolor: 'grey.25',
              maxHeight: '60vh',
              overflow: 'auto'
            }}>
              {notesSection.content ? (
                <RichTextFieldRenderer
                  value={notesSection.content}
                  editable={false}
                  mode="view"
                />
              ) : (
                <Typography variant="body2" color="text.secondary" fontStyle="italic">
                  No content notes for this section
                </Typography>
              )}
            </Box>

            <Box sx={{ mt: 3 }}>
              <Button 
                variant="outlined" 
                onClick={() => onEdit(notesSection)}
                fullWidth
              >
                Edit Section
              </Button>
            </Box>
          </Box>
        )}
      </Drawer>
    </Box>
  );
}