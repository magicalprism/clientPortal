'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Box, Typography, Stack, Button, CircularProgress, TextField, IconButton
} from '@mui/material';
import { Plus, Trash, DotsSixVertical } from '@phosphor-icons/react';
import { useSections } from '@/components/fields/custom/sections/useSections';
import { useCurrentContact } from '@/hooks/useCurrentContact';
import RichTextFieldRenderer from '@/components/fields/text/richText/RichTextFieldRenderer';
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
import { CompactMediaField } from '@/components/fields/media/components/CompactMediaField';

// Sortable Section Component
const SortableSection = ({ section, children }) => {
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

export const SectionThread = ({ 
  pivotTable, 
  entityField, 
  entityId, 
  label = 'Sections', 
  record, 
  mediaPivotTable = 'media_section' 
}) => {
  // Progressive creation states
  const [creationStep, setCreationStep] = useState('none'); // 'none', 'title', 'editing'
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newSectionContent, setNewSectionContent] = useState('');
  const [newSectionKey, setNewSectionKey] = useState(0);
  const [createdSectionId, setCreatedSectionId] = useState(null);
  
  // Edit states
  const [editingSection, setEditingSection] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [activeSection, setActiveSection] = useState(null);
  
  const { contact, loading: contactLoading } = useCurrentContact();
  const { 
    sections, 
    addSection, 
    updateSection, 
    deleteSection, 
    reorderSections, 
    loading: sectionsLoading 
  } = useSections({ pivotTable, entityField, entityId });

  const sensor = useSensor(PointerSensor);
  const sensors = useSensors(sensor);

  // Step 1: Create section with just title and immediately open edit
  const handleCreateSectionWithTitle = async () => {
    if (!newSectionTitle.trim() || !contact?.id) return;

    const newSection = await addSection(newSectionTitle.trim(), ''); // Empty content initially
    
    if (newSection?.id) {
      // Instead of step 2, immediately open edit mode
      setEditingSection(newSection.id);
      setEditTitle(newSectionTitle.trim());
      setEditContent('');
      
      // Reset creation state
      setCreationStep('none');
      setNewSectionTitle('');
      setNewSectionContent('');
      setNewSectionKey(prev => prev + 1);
    }
  };

  // Step 2: Update section with content and continue editing
  const handleFinishSectionCreation = async () => {
    if (!createdSectionId) return;

    await updateSection(createdSectionId, newSectionTitle.trim(), newSectionContent);
    
    // Reset creation state
    setCreationStep('none');
    setNewSectionTitle('');
    setNewSectionContent('');
    setCreatedSectionId(null);
    setNewSectionKey(prev => prev + 1);
  };

  // Cancel creation process
  const handleCancelCreation = () => {
    setCreationStep('none');
    setNewSectionTitle('');
    setNewSectionContent('');
    setCreatedSectionId(null);
    setNewSectionKey(prev => prev + 1);
  };

  // Regular edit functions
  const handleStartEdit = (section) => {
    setEditingSection(section.id);
    setEditTitle(section.title || '');
    setEditContent(section.content || '');
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) return;
    
    await updateSection(editingSection, editTitle.trim(), editContent);
    setEditingSection(null);
    setEditTitle('');
    setEditContent('');
  };

  const handleCancelEdit = () => {
    setEditingSection(null);
    setEditTitle('');
    setEditContent('');
  };

  const handleDeleteSection = async (sectionId) => {
    if (window.confirm('Are you sure you want to delete this section?')) {
      await deleteSection(sectionId);
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveSection(null);
    
    if (!active || !over || active.id === over.id) return;

    const oldIndex = sections.findIndex(section => section.id === active.id);
    const newIndex = sections.findIndex(section => section.id === over.id);
    
    if (oldIndex !== -1 && newIndex !== -1) {
      const newOrder = arrayMove(sections, oldIndex, newIndex);
      await reorderSections(newOrder);
    }
  };

  const handleDragStart = (event) => {
    setActiveSection(sections.find(section => section.id === event.active.id));
  };

  if (sectionsLoading || contactLoading) return <CircularProgress size={24} />;

  return (
    <Box sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">{label}</Typography>
        {contact && creationStep === 'none' && (
          <Button
            variant="outlined"
            startIcon={<Plus />}
            onClick={() => setCreationStep('title')}
            sx={{ minWidth: 'auto' }}
          >
            Add Section
          </Button>
        )}
      </Box>
      
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={sections.map(section => section.id)} strategy={verticalListSortingStrategy}>
          <Stack spacing={3}>
            
            {/* Step 1: Title Input */}
            {creationStep === 'title' && (
              <Box sx={{ 
                p: 3, 
                borderRadius: 2, 
                backgroundColor: 'primary.50',
                border: '2px solid',
                borderColor: 'primary.main'
              }}>
                <Typography variant="subtitle2" gutterBottom color="primary.main">
                  Step 1: Section Title
                </Typography>
                <TextField
                  fullWidth
                  label="What should this section be called?"
                  value={newSectionTitle}
                  onChange={(e) => setNewSectionTitle(e.target.value)}
                  sx={{ mb: 2 }}
                  autoFocus
                  placeholder="e.g., Introduction, Requirements, Summary..."
                />
                <Stack direction="row" spacing={2}>
                  <Button 
                    variant="contained" 
                    onClick={handleCreateSectionWithTitle}
                    disabled={!newSectionTitle.trim()}
                  >
                    Create Section
                  </Button>
                  <Button 
                    variant="outlined" 
                    onClick={handleCancelCreation}
                  >
                    Cancel
                  </Button>
                </Stack>
              </Box>
            )}



            {/* Existing sections */}
            {sections.map((section) => (
              <SortableSection key={section.id} section={section}>
                {({ listeners, attributes }) => (
                  <Box sx={{ 
                    p: 3, 
                    borderRadius: 2, 
                    backgroundColor: editingSection === section.id ? 'grey.50' : 'background.paper',
                    border: '1px solid',
                    borderColor: editingSection === section.id ? 'primary.main' : 'divider',
                    position: 'relative'
                  }}>
                    {editingSection === section.id ? (
                      // Edit mode
                      <>
                        <Typography variant="subtitle2" gutterBottom color="primary.main">
                          Editing Section
                        </Typography>
                        <TextField
                          fullWidth
                          label="Section Title"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          sx={{ mb: 2 }}
                          autoFocus
                        />
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            Content
                          </Typography>
                          <RichTextFieldRenderer
                            key={`edit-section-${section.id}`}
                            value={editContent}
                            editable={true}
                            mode="edit"
                            onChange={setEditContent}
                            field={{ name: 'section_content' }}
                          />
                        </Box>
                        
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            Media
                          </Typography>
                          <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                            <CompactMediaField
                              key={`edit-media-${section.id}`}
                              pivotTable={mediaPivotTable}
                              sourceField="section_id"
                              targetField="media_id"
                              parentId={section.id}
                              placeholder="No media attached to this section"
                              record={record}
                              editable={true}
                              size="medium"
                              maxItems={10}
                            />
                          </Box>
                        </Box>
                        
                        <Stack direction="row" spacing={2}>
                          <Button 
                            variant="contained" 
                            onClick={handleSaveEdit}
                            disabled={!editTitle.trim()}
                          >
                            Save Changes
                          </Button>
                          <Button 
                            variant="outlined" 
                            onClick={handleCancelEdit}
                          >
                            Cancel
                          </Button>
                        </Stack>
                      </>
                    ) : (
                      // View mode
                      <>
                        {contact && (
                          <Box sx={{ 
                            position: 'absolute', 
                            top: 12, 
                            right: 12,
                            display: 'flex',
                            gap: 1
                          }}>
                            <Button
                              size="small"
                              variant="text"
                              onClick={() => handleStartEdit(section)}
                            >
                              Edit
                            </Button>
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteSection(section.id)}
                              sx={{ color: 'error.main' }}
                            >
                              <Trash size={16} />
                            </IconButton>
                            <IconButton
                              size="small"
                              {...listeners}
                              {...attributes}
                              sx={{ cursor: 'grab' }}
                            >
                              <DotsSixVertical size={16} />
                            </IconButton>
                          </Box>
                        )}
                        
                        <Typography variant="h6" gutterBottom sx={{ pr: 10 }}>
                          {section.title || 'Untitled Section'}
                        </Typography>
                        
                        {section.content && (
                          <Box sx={ { mt: 2, mb: 2 }}>
                            <RichTextFieldRenderer
                              value={section.content}
                              editable={false}
                              mode="view"
                            />
                          </Box>
                        )}
                        
                        {/* Media display for view mode */}
                        <Box sx={{ mt: 2 }}>
                          <CompactMediaField
                            key={`view-media-${section.id}`}
                            pivotTable={mediaPivotTable}
                            sourceField="section_id"
                            targetField="media_id"
                            parentId={section.id}
                            placeholder=""
                            record={record}
                            editable={false}
                            size="medium"
                            maxItems={10}
                          />
                        </Box>
                      </>
                    )}
                  </Box>
                )}
              </SortableSection>
            ))}

            {sections.length === 0 && creationStep === 'none' && (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                No sections yet. Click "Add Section" to create the first one!
              </Typography>
            )}
          </Stack>
        </SortableContext>

        <DragOverlay dropAnimation={null}>
          {activeSection ? (
            <Box sx={{ 
              p: 3, 
              borderRadius: 2, 
              backgroundColor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: 3,
              opacity: 0.95
            }}>
              <Typography variant="h6" gutterBottom>
                {activeSection.title || 'Untitled Section'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Moving section...
              </Typography>
            </Box>
          ) : null}
        </DragOverlay>
      </DndContext>

      {!contact && !contactLoading && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 3, textAlign: 'center' }}>
          Please log in to manage sections.
        </Typography>
      )}
    </Box>
  );
};