'use client';

import { useEffect, useState } from 'react';
import {
  Box, Typography, Stack, Button, CircularProgress, TextField, IconButton
} from '@mui/material';
import { Plus, Trash } from '@phosphor-icons/react';
import { useSections } from '@/components/fields/custom/sections/useSections';
import { useCurrentContact } from '@/hooks/useCurrentContact';
import RichTextFieldRenderer from '@/components/fields/text/richText/RichTextFieldRenderer';

export const SectionThread = ({ pivotTable, entityField, entityId }) => {
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newSectionContent, setNewSectionContent] = useState('');
  const [editingSection, setEditingSection] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const { contact, loading: contactLoading } = useCurrentContact();
  const { sections, addSection, updateSection, deleteSection, loading: sectionsLoading } = useSections({ pivotTable, entityField, entityId });

  const handleAddSection = async () => {
    if (!newSectionTitle.trim()) return;
    if (!contact?.id) return;

    await addSection(newSectionTitle.trim(), newSectionContent);
    setNewSectionTitle('');
    setNewSectionContent('');
  };

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

  if (sectionsLoading || contactLoading) return <CircularProgress size={24} />;

  return (
    <Box sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Sections</Typography>
        {contact && (
          <Button
            variant="outlined"
            startIcon={<Plus />}
            onClick={() => setEditingSection('new')}
            sx={{ minWidth: 'auto' }}
          >
            Add Section
          </Button>
        )}
      </Box>
      
      <Stack spacing={3}>
        {/* New section form */}
        {editingSection === 'new' && contact && (
          <Box sx={{ 
            p: 3, 
            borderRadius: 2, 
            backgroundColor: 'grey.50',
            border: '2px dashed',
            borderColor: 'primary.main'
          }}>
            <Typography variant="subtitle2" gutterBottom>
              New Section
            </Typography>
            <TextField
              fullWidth
              label="Section Title"
              value={newSectionTitle}
              onChange={(e) => setNewSectionTitle(e.target.value)}
              sx={{ mb: 2 }}
              autoFocus
            />
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Content
              </Typography>
              <RichTextFieldRenderer
                value={newSectionContent}
                editable={true}
                mode="create"
                onChange={setNewSectionContent}
                field={{ name: 'section_content' }}
              />
            </Box>
            <Stack direction="row" spacing={2}>
              <Button 
                variant="contained" 
                onClick={handleAddSection}
                disabled={!newSectionTitle.trim()}
              >
                Add Section
              </Button>
              <Button 
                variant="outlined" 
                onClick={() => {
                  setEditingSection(null);
                  setNewSectionTitle('');
                  setNewSectionContent('');
                }}
              >
                Cancel
              </Button>
            </Stack>
          </Box>
        )}

        {/* Existing sections */}
        {sections.map((section) => (
          <Box key={section.id} sx={{ 
            p: 3, 
            borderRadius: 2, 
            backgroundColor: 'primary.50',
            border: '1px solid',
            borderColor: '#e5e5e5',
            position: 'relative'
          }}>
            {editingSection === section.id ? (
              // Edit mode
              <>
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
                    value={editContent}
                    editable={true}
                    mode="edit"
                    onChange={setEditContent}
                    field={{ name: 'section_content' }}
                  />
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
                  </Box>
                )}
                
                <Typography variant="h6" gutterBottom sx={{ pr: 8 }}>
                  {section.title || 'Untitled Section'}
                </Typography>
                
                <Box sx={{ mt: 2 }}>
                  {section.content ? (
                    <RichTextFieldRenderer
                      value={section.content}
                      editable={false}
                      mode="view"
                    />
                  ) : (
                    <Typography variant="body2" color="text.secondary" fontStyle="italic">
                      No content
                    </Typography>
                  )}
                </Box>
              </>
            )}
          </Box>
        ))}

        {sections.length === 0 && editingSection !== 'new' && (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            No sections yet. Click "Add Section" to create the first one!
          </Typography>
        )}
      </Stack>

      {!contact && !contactLoading && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 3, textAlign: 'center' }}>
          Please log in to manage sections.
        </Typography>
      )}
    </Box>
  );
};