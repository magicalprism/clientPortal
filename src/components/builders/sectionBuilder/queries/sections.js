'use client';

import { createClient } from '@/lib/supabase/browser';

/**
 * Fetch all sections for a given element ID (through junction table)
 */
export async function fetchSectionsByParentId(parentId) {
  const supabase = createClient();
  
  try {
    console.log('[fetchSectionsByParentId] Fetching sections for element:', parentId);
    
    // Query through junction table to get sections for an element
    const { data, error } = await supabase
      .from('element_section')
      .select(`
        section:section_id (
          id,
          created_at,
          title,
          content,
          status,
          author_id,
          updated_at,
          parent_id,
          order_index,
          eyebrow,
          headline,
          subheadline,
          body_text,
          button_text,
          button_url,
          template_id,
          layout_variant
        )
      `)
      .eq('element_id', parentId);

    if (error) {
      console.error('[fetchSectionsByParentId] Supabase error:', error);
      throw error;
    }

    // Extract sections from the junction table response and sort by order_index
    const sections = (data || [])
      .map(item => item.section)
      .filter(Boolean)
      .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
    
    console.log('[fetchSectionsByParentId] Found sections:', sections);
    return sections;
    
  } catch (error) {
    console.error('[fetchSectionsByParentId] Error:', error);
    throw error;
  }
}

/**
 * Create a new section and link it to an element via junction table
 */
export async function createSection({ parentId, template_id, title, authorId, order_index }) {
  const supabase = createClient();
  
  try {
    console.log('[createSection] Creating section:', { parentId, template_id, title, authorId });
    
    // Get the next order index if not provided
    let finalOrderIndex = order_index;
    if (finalOrderIndex === undefined) {
      // Get existing sections for this element through junction table
      const { data: existingSections } = await supabase
        .from('element_section')
        .select('section:section_id(order_index)')
        .eq('element_id', parentId);
      
      const orderIndexes = (existingSections || [])
        .map(item => item.section?.order_index || 0)
        .filter(Boolean);
      
      finalOrderIndex = orderIndexes.length > 0 ? Math.max(...orderIndexes) + 1 : 1;
    }

    // Step 1: Create the section
    const sectionData = {
      template_id,
      title: title || 'Untitled Section',
      author_id: authorId,
      order_index: finalOrderIndex,
      status: 'published',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: newSection, error: sectionError } = await supabase
      .from('section')
      .insert(sectionData)
      .select()
      .single();

    if (sectionError) {
      console.error('[createSection] Section creation error:', sectionError);
      throw sectionError;
    }

    // Step 2: Create the junction table record to link section to element
    const { error: junctionError } = await supabase
      .from('element_section')
      .insert({
        element_id: parentId,
        section_id: newSection.id
      });

    if (junctionError) {
      console.error('[createSection] Junction table error:', junctionError);
      // Try to clean up the section if junction creation failed
      await supabase.from('section').delete().eq('id', newSection.id);
      throw junctionError;
    }

    console.log('[createSection] Section and junction record created:', newSection);
    return newSection;
    
  } catch (error) {
    console.error('[createSection] Error:', error);
    throw error;
  }
}

/**
 * Update an existing section
 */
export async function updateSection(sectionId, updates) {
  const supabase = createClient();
  
  try {
    console.log('[updateSection] Updating section:', { sectionId, updates });
    
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('section')
      .update(updateData)
      .eq('id', sectionId)
      .select()
      .single();

    if (error) {
      console.error('[updateSection] Supabase error:', error);
      throw error;
    }

    console.log('[updateSection] Section updated:', data);
    return data;
    
  } catch (error) {
    console.error('[updateSection] Error:', error);
    throw error;
  }
}

/**
 * Delete a section
 */
export async function deleteSection(sectionId) {
  const supabase = createClient();
  
  try {
    console.log('[deleteSection] Deleting section:', sectionId);
    
    // Step 1: Delete junction table records
    const { error: junctionError } = await supabase
      .from('element_section')
      .delete()
      .eq('section_id', sectionId);

    if (junctionError) {
      console.warn('[deleteSection] Error deleting element_section relationships:', junctionError);
      // Continue with deletion even if junction cleanup fails
    }

    // Step 2: Delete any media relationships
    const { error: mediaError } = await supabase
      .from('media_section')
      .delete()
      .eq('section_id', sectionId);

    if (mediaError) {
      console.warn('[deleteSection] Error deleting media relationships:', mediaError);
      // Continue with section deletion even if media cleanup fails
    }

    // Step 3: Delete the section
    const { error } = await supabase
      .from('section')
      .delete()
      .eq('id', sectionId);

    if (error) {
      console.error('[deleteSection] Supabase error:', error);
      throw error;
    }

    console.log('[deleteSection] Section deleted successfully');
    
  } catch (error) {
    console.error('[deleteSection] Error:', error);
    throw error;
  }
}

/**
 * Validate that template IDs in sections exist in the JavaScript templates
 * This replaces the database template table approach
 */
export async function validateSectionTemplates(sections, availableTemplates) {
  console.log('[validateSectionTemplates] Validating section templates...');
  
  const availableTemplateIds = new Set(availableTemplates.map(t => t.id));
  const sectionsWithInvalidTemplates = [];
  
  sections.forEach(section => {
    const templateId = section.template_id;
    if (templateId && !availableTemplateIds.has(templateId)) {
      sectionsWithInvalidTemplates.push({
        sectionId: section.id,
        templateId,
        sectionTitle: section.title
      });
    }
  });
  
  if (sectionsWithInvalidTemplates.length > 0) {
    console.warn('[validateSectionTemplates] Found sections with invalid templates:', sectionsWithInvalidTemplates);
  } else {
    console.log('[validateSectionTemplates] All section templates are valid');
  }
  
  return {
    valid: sectionsWithInvalidTemplates.length === 0,
    invalidSections: sectionsWithInvalidTemplates,
    availableTemplates: availableTemplateIds
  };
}

/**
 * Reorder sections
 */
export async function reorderSections(elementId, sectionIds) {
  const supabase = createClient();
  
  try {
    console.log('[reorderSections] Reordering sections for element:', { elementId, sectionIds });
    
    // Update order_index for each section
    const updates = sectionIds.map((sectionId, index) => ({
      id: sectionId,
      order_index: index + 1,
      updated_at: new Date().toISOString()
    }));

    // Update sections one by one to avoid conflicts
    for (const update of updates) {
      const { error } = await supabase
        .from('section')
        .update({ 
          order_index: update.order_index, 
          updated_at: update.updated_at 
        })
        .eq('id', update.id);

      if (error) {
        console.error('[reorderSections] Error updating section:', update.id, error);
        throw error;
      }
    }
    
    console.log('[reorderSections] Sections reordered successfully');
    
  } catch (error) {
    console.error('[reorderSections] Error:', error);
    throw error;
  }
}