'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  Slide,
  Box,
  Typography,
  CircularProgress,
  Alert
} from '@mui/material';
import  SectionBuilderHeader  from '@/components/builders/sectionBuilder/SectionBuilderHeader';
import  SectionList   from '@/components/builders/sectionBuilder/SectionList';
import AddSectionBar from '@/components/builders/sectionBuilder/AddSectionBar';
import SectionEditForm from '@/components/builders/sectionBuilder/SectionEditForm';
import { sectionTemplates } from '@/components/templates/sectionTemplates';
import { 
  fetchSectionsByParentId, 
  createSection, 
  updateSection, 
  deleteSection,
  ensureTemplateRecords
} from '@/components/builders/sectionBuilder/queries/sections';
import { useCurrentContact } from '@/hooks/useCurrentContact';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function SectionBuilderModal({ open, onClose, parentId }) {
  const [sections, setSections] = useState([]);
  const [editingSection, setEditingSection] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { contact } = useCurrentContact();

  // Load sections when modal opens
  useEffect(() => {
    if (!open || !parentId) return;
    initializeAndLoadSections();
  }, [open, parentId]);

  const initializeAndLoadSections = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // First, ensure template records exist in the database
      console.log('[SectionBuilderModal] Ensuring template records exist...');
      await ensureTemplateRecords(sectionTemplates);
      
      // Then load sections
      await loadSections();
    } catch (err) {
      console.error('[SectionBuilderModal] Error during initialization:', err);
      setError('Failed to initialize section builder: ' + err.message);
      setLoading(false);
    }
  };

  const loadSections = async () => {
    try {
      console.log('[SectionBuilderModal] Loading sections for parent:', parentId);
      const data = await fetchSectionsByParentId(parentId);
      
      // Hydrate sections with template data
      const hydrated = data.map(section => {
        const template = sectionTemplates.find(t => t.id === section.template_id);
        return {
          ...section,
          template,
          title: section.title || template?.title || 'Untitled Section',
        };
      });

      console.log('[SectionBuilderModal] Loaded and hydrated sections:', hydrated);
      setSections(hydrated);
    } catch (err) {
      console.error('[SectionBuilderModal] Error loading sections:', err);
      setError('Failed to load sections: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSection = async (templateId) => {
    if (!parentId || !contact?.id) {
      setError('Missing parent ID or user information');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const template = sectionTemplates.find(t => t.id === templateId);
      if (!template) {
        throw new Error(`Template not found: ${templateId}`);
      }

      console.log('[SectionBuilderModal] Creating new section:', {
        parentId,
        templateId,
        template: template.title,
        authorId: contact.id
      });

      // Create section in database
      const newSection = await createSection({
        parentId,
        templateKey: templateId, // Store template key as string
        title: template.title,
        authorId: contact.id
      });

      // Add template data and refresh sections
      const hydrated = {
        ...newSection,
        template,
        title: newSection.title || template.title
      };

      setSections(prev => [...prev, hydrated]);
      console.log('[SectionBuilderModal] Section created successfully:', hydrated);

    } catch (err) {
      console.error('[SectionBuilderModal] Error creating section:', err);
      setError('Failed to create section: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSection = async (sectionId, updatedFields) => {
    setLoading(true);
    setError(null);

    try {
      console.log('[SectionBuilderModal] Updating section:', { sectionId, updatedFields });

      // Extract database fields from updatedFields
      const { data, ...dbFields } = updatedFields;
      
      // Merge template field data into main update payload
      const updatePayload = { ...dbFields };
      
      if (data) {
        // Add template-specific fields to the main payload
        Object.keys(data).forEach(fieldName => {
          updatePayload[fieldName] = data[fieldName] || null;
        });
      }

      // Update in database
      const updatedSection = await updateSection(sectionId, updatePayload);

      // Update local state
      setSections(prev =>
        prev.map(section => {
          if (section.id === sectionId) {
            const template = sectionTemplates.find(t => t.id === updatedSection.template_id);
            return {
              ...updatedSection,
              template,
              title: updatedSection.title || template?.title || 'Untitled Section'
            };
          }
          return section;
        })
      );

      console.log('[SectionBuilderModal] Section updated successfully:', updatedSection);

    } catch (err) {
      console.error('[SectionBuilderModal] Error updating section:', err);
      setError('Failed to update section: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSection = async (sectionToDelete) => {
    if (!window.confirm('Are you sure you want to delete this section?')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('[SectionBuilderModal] Deleting section:', sectionToDelete.id);

      await deleteSection(sectionToDelete.id);

      // Remove from local state
      setSections(prev => prev.filter(section => section.id !== sectionToDelete.id));
      
      console.log('[SectionBuilderModal] Section deleted successfully');

    } catch (err) {
      console.error('[SectionBuilderModal] Error deleting section:', err);
      setError('Failed to delete section: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSection = (sectionToEdit) => {
    console.log('[SectionBuilderModal] Opening editor for section:', sectionToEdit);
    setEditingSection(sectionToEdit);
  };

  const handleSaveSection = async (updatedFields) => {
    if (!editingSection) return;

    await handleUpdateSection(editingSection.id, updatedFields);
    setEditingSection(null);
  };

  return (
    <>
      <Dialog fullScreen open={open} onClose={onClose} TransitionComponent={Transition}>
        <SectionBuilderHeader onClose={onClose} />
        <DialogContent sx={{ p: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
              <CircularProgress />
            </Box>
          )}
          
          <Box>
            <Typography variant="h6" gutterBottom>
              Section Builder
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Create and manage sections for this element
            </Typography>
            
            <SectionList
              sections={sections}
              onEdit={handleEditSection}
              onDelete={handleDeleteSection}
            />
            
            <AddSectionBar
              onAdd={handleAddSection}
              sectionTemplates={sectionTemplates}
            />
          </Box>
        </DialogContent>
      </Dialog>

      {editingSection && (
        <Dialog 
          open 
          onClose={() => setEditingSection(null)}
          maxWidth="md"
          fullWidth
        >
          <DialogContent sx={{ p: 3 }}>
            <SectionEditForm
              section={editingSection}
              onClose={() => setEditingSection(null)}
              onSave={handleSaveSection}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}