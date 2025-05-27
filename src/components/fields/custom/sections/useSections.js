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
          
          // Sort by order_index after processing, fallback to created_at
          processedSections.sort((a, b) => {
            if (a.order_index !== undefined && b.order_index !== undefined) {
              return a.order_index - b.order_index;
            }
            return new Date(a.created_at) - new Date(b.created_at);
          });
          
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
        return null;
      }

      // Get contact ID from user
      const { data: contact, error: contactError } = await supabase
        .from('contact')
        .select('id')
        .eq('email', userData.user.email)
        .single();

      if (contactError || !contact) {
        console.error('Failed to get contact:', contactError);
        return null;
      }

      const contactId = contact.id;

      // Insert new section with order_index
      const maxOrderIndex = sections.length > 0 ? Math.max(...sections.map(s => s.order_index || 0)) : 0;
      
      const { data: newSections, error: insertError } = await supabase
        .from('section')
        .insert([{ 
          title: title,
          content: content,
          author_id: contactId,
          order_index: maxOrderIndex + 1
        }])
        .select();

      if (insertError || !newSections || newSections.length === 0) {
        console.error('Error adding section:', insertError);
        return null;
      }

      const newSection = newSections[0];
      const sectionId = newSection.id;

      // Create link between section and entity
      const linkData = {};
      linkData[entityField] = entityId;
      linkData.section_id = sectionId;
      
      console.log('[Sections] Creating link with data:', linkData);
      console.log('[Sections] Pivot table:', pivotTable);
      
      const { error: linkError } = await supabase
        .from(pivotTable)
        .insert([linkData]);

      if (linkError) {
        console.error('Error creating link:', linkError);
        return null;
      }

      // Update local state
      setSections(prev => [...prev, newSection]);
      
      // Return the created section so caller can use its ID
      return newSection;
      
    } catch (error) {
      console.error('Error in addSection:', error);
      return null;
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

  const reorderSections = async (newOrderSections) => {
    try {
      // Update local state immediately for smooth UX
      setSections(newOrderSections);
      
      // Create updates with new order_index values
      const updates = newOrderSections.map((section, index) => ({
        id: section.id,
        order_index: index
      }));

      const { error } = await supabase
        .from('section')
        .upsert(updates, { onConflict: ['id'] });

      if (error) {
        console.error('Error reordering sections:', error);
        // Optionally revert local state on error
        return;
      }

      console.log('[Sections] Reordered successfully');
    } catch (error) {
      console.error('Error in reorderSections:', error);
    }
  };

  return { sections, addSection, updateSection, deleteSection, reorderSections, loading };
};