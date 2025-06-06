// Updated SectionBuilderModal.js - Replace the imports and SectionList usage

'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  Slide,
  Box,
  Typography,
  CircularProgress,
  Alert,
   
} from '@mui/material';
import SectionBuilderHeader from '@/components/builders/sectionBuilder/SectionBuilderHeader';
// Replace SectionList import with SectionList
import SectionWireframeList from '@/components/builders/sectionBuilder/SectionList';
import AddSectionBar from '@/components/builders/sectionBuilder/AddSectionBar';
import SectionEditForm from '@/components/builders/sectionBuilder/SectionEditForm';
import SectionDebugInfo from '@/components/builders/sectionBuilder/SectionDebugInfo';
import { sectionTemplates } from '@/components/templates/sectionTemplates';
import { 
  fetchSectionsByParentId, 
  createSection, 
  updateSection, 
  deleteSection,
  validateSectionTemplates,
  reorderSections // Add this import
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
      console.log('[SectionBuilderModal] Loading sections...');
      await loadSections();
    } catch (err) {
      console.error('[SectionBuilderModal] Error during initialization:', err);
      setError('Failed to load sections: ' + err.message);
      setLoading(false);
    }
  };

  const loadSections = async () => {
    try {
      console.log('[SectionBuilderModal] Loading sections for parent:', parentId);
      const data = await fetchSectionsByParentId(parentId);
      
      // Validate templates before hydrating
      const validation = await validateSectionTemplates(data, sectionTemplates);
      if (!validation.valid) {
        console.warn('[SectionBuilderModal] Some sections have invalid templates:', validation.invalidSections);
      }
      
      // Hydrate sections with template data
      const hydrated = data.map(section => {
        const templateId = section.template_id;
        const template = sectionTemplates.find(t => t.id === templateId);
        
        return {
          ...section,
          template_id: templateId,
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

      const newSection = await createSection({
        parentId,
        template_id: templateId,
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

      const { data, ...dbFields } = updatedFields;
      const updatePayload = { ...dbFields };
      
      if (data) {
        Object.keys(data).forEach(fieldName => {
          updatePayload[fieldName] = data[fieldName] || null;
        });
      }

      const updatedSection = await updateSection(sectionId, updatePayload);

      setSections(prev =>
        prev.map(section => {
          if (section.id === sectionId) {
            const templateId = updatedSection.template_id;
            const template = sectionTemplates.find(t => t.id === templateId);
            return {
              ...updatedSection,
              template_id: templateId,
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

  // NEW: Handle wireframe reordering
  const handleReorderSections = async (newOrderSections) => {
    try {
      console.log('[SectionBuilderModal] Reordering sections:', newOrderSections.map(s => s.title));
      
      // Update local state immediately for smooth UX
      setSections(newOrderSections);
      
      // Update order_index in database
      await reorderSections(parentId, newOrderSections.map(s => s.id));
      
      console.log('[SectionBuilderModal] Sections reordered successfully');
    } catch (err) {
      console.error('[SectionBuilderModal] Error reordering sections:', err);
      setError('Failed to reorder sections: ' + err.message);
      // Reload sections to revert local state
      loadSections();
    }
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
              Create and manage wireframe sections for this element
            </Typography>
            
            {/* Debug Component - Remove once stable */}
            <SectionDebugInfo sections={sections} />
            
            {/* Replace SectionWireframeList with SectionWireframeList */}
            <SectionWireframeList
              sections={sections}
              onEdit={handleEditSection}
              onDelete={handleDeleteSection}
              onReorder={handleReorderSections}
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