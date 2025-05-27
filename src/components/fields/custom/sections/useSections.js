// src/components/fields/custom/sections/useSections.js
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/browser';

export const useSections = ({ pivotTable, entityField, entityId }) => {
  const supabase = createClient();
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSections = async () => {
      console.log('[Sections] Pivot Table:', pivotTable);
      console.log('[Sections] Entity Field:', entityField);
      console.log('[Sections] Entity ID:', entityId);

      try {
        const { data, error } = await supabase
          .from(pivotTable)
          .select(`
            section(*, author:author_id(id, title)),
            id
          `)
          .eq(entityField, entityId);

        console.log('[Sections] Query:', { pivotTable, entityField, entityId });
        
        if (error) {
          console.error('[Sections] Error fetching:', error);
          setSections([]);
        } else {
          console.log('[Sections] Raw data:', data);
          const processedSections = data?.map(row => row.section).filter(Boolean) || [];
          
          // Sort by created_at after processing
          processedSections.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
          
          console.log('[Sections] Processed sections:', processedSections);
          setSections(processedSections);
        }
      } catch (err) {
        console.error('[Sections] Fetch error:', err);
        setSections([]);
      }

      setLoading(false);
    };

    if (entityId && pivotTable && entityField) {
      fetchSections();
    }
  }, [entityId, pivotTable, entityField]);

  const addSection = async (title, content = '') => {
    try {
      // Get current contact using your existing utility
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user?.id) {
        console.error('Failed to get user:', userError);
        return;
      }

      // Get contact ID from user
      const { data: contact, error: contactError } = await supabase
        .from('contact')
        .select('id')
        .eq('email', userData.user.email)
        .single();

      if (contactError || !contact) {
        console.error('Failed to get contact:', contactError);
        return;
      }

      const contactId = contact.id;

      // Insert new section
      const { data: newSections, error: insertError } = await supabase
        .from('section')
        .insert([{ 
          title: title,
          content: content,
          author_id: contactId
        }])
        .select();

      if (insertError || !newSections || newSections.length === 0) {
        console.error('Error adding section:', insertError);
        return;
      }

      const sectionId = newSections[0].id;

      // Create link between section and entity
      const { error: linkError } = await supabase
        .from(pivotTable)
        .insert([{ [entityField]: entityId, section_id: sectionId }]);

      if (linkError) {
        console.error('Error creating link:', linkError);
        return;
      }

      // Update local state
      setSections(prev => [...prev, newSections[0]]);
    } catch (error) {
      console.error('Error in addSection:', error);
    }
  };

  const updateSection = async (sectionId, title, content = '') => {
    try {
      const { data: updatedSections, error: updateError } = await supabase
        .from('section')
        .update({ 
          title: title,
          content: content,
          updated_at: new Date().toISOString()
        })
        .eq('id', sectionId)
        .select();

      if (updateError) {
        console.error('Error updating section:', updateError);
        return;
      }

      if (updatedSections && updatedSections.length > 0) {
        // Update local state
        setSections(prev => prev.map(section => 
          section.id === sectionId ? updatedSections[0] : section
        ));
      }
    } catch (error) {
      console.error('Error in updateSection:', error);
    }
  };

  const deleteSection = async (sectionId) => {
    try {
      // Delete the link first
      const { error: linkError } = await supabase
        .from(pivotTable)
        .delete()
        .eq('section_id', sectionId);

      if (linkError) {
        console.error('Error deleting section link:', linkError);
        return;
      }

      // Delete the section
      const { error: sectionError } = await supabase
        .from('section')
        .delete()
        .eq('id', sectionId);

      if (sectionError) {
        console.error('Error deleting section:', sectionError);
        return;
      }

      // Update local state
      setSections(prev => prev.filter(section => section.id !== sectionId));
    } catch (error) {
      console.error('Error in deleteSection:', error);
    }
  };

  return { sections, addSection, updateSection, deleteSection, loading };
};