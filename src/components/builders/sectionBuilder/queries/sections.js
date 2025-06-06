import { createClient } from '@/lib/supabase/browser';

export async function fetchSectionsByParentId(parentId) {
  const supabase = createClient();
  
  console.log('[fetchSectionsByParentId] Fetching sections for parent:', parentId);

  const { data, error } = await supabase
    .from('element_section')
    .select(`
      section_id,
      order_index,
      section:section_id (
        id,
        title,
        template_id,
        headline,
        subheadline,
        body_text,
        button_text,
        button_url,
        layout_variant,
        eyebrow,
        content,
        status,
        order_index,
        created_at,
        updated_at,
        template:template_id (
          id,
          layout_key,
          title
        )
      )
    `)
    .eq('element_id', parentId)
    .order('order_index', { ascending: true });

  if (error) {
    console.error('[fetchSectionsByParentId] Error fetching sections:', error);
    return [];
  }

  console.log('[fetchSectionsByParentId] Raw data:', data);

  // Flatten and return sections with template data
  const sections = data
    .map(item => ({
      ...item.section,
      pivot_order_index: item.order_index,
      // Use template.layout_key as the template_id for JavaScript compatibility
      template_id: item.section.template?.layout_key || item.section.template_id
    }))
    .filter(Boolean);

  console.log('[fetchSectionsByParentId] Processed sections:', sections);
  return sections;
}

export async function createSection({ parentId, templateKey, title, authorId }) {
  const supabase = createClient();
  
  console.log('[createSection] Creating section:', { parentId, templateKey, title });

  try {
    // First, find the template record that matches our templateKey
    const { data: templateData, error: templateError } = await supabase
      .from('template')
      .select('id, layout_key, title')
      .eq('layout_key', templateKey)
      .single();

    if (templateError || !templateData) {
      console.warn('[createSection] Template not found in database, creating without template_id:', templateKey);
      console.error('[createSection] Template error:', templateError);
    }

    const templateId = templateData?.id || null;
    console.log('[createSection] Found template ID:', templateId, 'for key:', templateKey);

    // Get the next order index for this parent
    const { data: maxOrderData } = await supabase
      .from('element_section')
      .select('order_index')
      .eq('element_id', parentId)
      .order('order_index', { ascending: false })
      .limit(1);
    
    const nextOrderIndex = (maxOrderData?.[0]?.order_index || 0) + 1;

    // Create the section in the sections table
    const sectionPayload = {
      title: title || 'Untitled Section',
      headline: '',
      subheadline: '',
      body_text: '',
      button_text: '',
      button_url: '',
      layout_variant: 'default',
      status: 'draft',
      author_id: authorId,
      order_index: nextOrderIndex,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Only add template_id if we found a matching template
    if (templateId) {
      sectionPayload.template_id = templateId;
    }

    const { data: sectionData, error: sectionError } = await supabase
      .from('section')
      .insert(sectionPayload)
      .select()
      .single();

    if (sectionError) {
      console.error('[createSection] Error creating section:', sectionError);
      throw sectionError;
    }

    console.log('[createSection] Section created:', sectionData);

    // Link the section to its parent element
    const { error: pivotError } = await supabase
      .from('element_section')
      .insert({
        element_id: parentId,
        section_id: sectionData.id,
        order_index: nextOrderIndex
      });

    if (pivotError) {
      console.error('[createSection] Error creating pivot link:', pivotError);
      // Clean up the section if pivot creation fails
      await supabase.from('section').delete().eq('id', sectionData.id);
      throw pivotError;
    }

    console.log('[createSection] Section linked to parent successfully');
    
    // Return section with template_key for JavaScript compatibility
    return {
      ...sectionData,
      template_id: templateKey, // Return the original string template key
      template: templateData
    };

  } catch (error) {
    console.error('[createSection] Failed to create section:', error);
    throw error;
  }
}

export async function updateSection(sectionId, updates) {
  const supabase = createClient();
  
  console.log('[updateSection] Updating section:', { sectionId, updates });

  const updatePayload = {
    ...updates,
    updated_at: new Date().toISOString()
  };

  // If updating template_id with a string key, find the corresponding template record
  if (updatePayload.template_id && typeof updatePayload.template_id === 'string') {
    const { data: templateData } = await supabase
      .from('template')
      .select('id')
      .eq('layout_key', updatePayload.template_id)
      .single();

    if (templateData) {
      updatePayload.template_id = templateData.id;
    } else {
      console.warn('[updateSection] Template not found for key:', updatePayload.template_id);
      delete updatePayload.template_id; // Don't update if template not found
    }
  }

  const { data, error } = await supabase
    .from('section')
    .update(updatePayload)
    .eq('id', sectionId)
    .select(`
      *,
      template:template_id (
        id,
        layout_key,
        title
      )
    `)
    .single();

  if (error) {
    console.error('[updateSection] Error updating section:', error);
    throw error;
  }

  console.log('[updateSection] Section updated successfully:', data);
  
  // Return with template layout_key for JavaScript compatibility
  return {
    ...data,
    template_id: data.template?.layout_key || data.template_id
  };
}

export async function deleteSection(sectionId) {
  const supabase = createClient();
  
  console.log('[deleteSection] Deleting section:', sectionId);

  try {
    // First remove from pivot table
    const { error: pivotError } = await supabase
      .from('element_section')
      .delete()
      .eq('section_id', sectionId);

    if (pivotError) {
      console.error('[deleteSection] Error removing pivot link:', pivotError);
      throw pivotError;
    }

    // Then delete the section itself
    const { error: sectionError } = await supabase
      .from('section')
      .delete()
      .eq('id', sectionId);

    if (sectionError) {
      console.error('[deleteSection] Error deleting section:', sectionError);
      throw sectionError;
    }

    console.log('[deleteSection] Section deleted successfully');
    return true;

  } catch (error) {
    console.error('[deleteSection] Failed to delete section:', error);
    throw error;
  }
}

export async function updateSectionOrder(parentId, sectionOrders) {
  const supabase = createClient();
  
  console.log('[updateSectionOrder] Updating section order:', { parentId, sectionOrders });

  try {
    const updates = sectionOrders.map(({ sectionId, orderIndex }) => 
      supabase
        .from('element_section')
        .update({ order_index: orderIndex })
        .eq('element_id', parentId)
        .eq('section_id', sectionId)
    );

    await Promise.all(updates);
    console.log('[updateSectionOrder] Section order updated successfully');
    return true;

  } catch (error) {
    console.error('[updateSectionOrder] Failed to update section order:', error);
    throw error;
  }
}

// Helper function to ensure template records exist for JavaScript templates
export async function ensureTemplateRecords(sectionTemplates) {
  const supabase = createClient();
  
  console.log('[ensureTemplateRecords] Checking template records...');

  try {
    // Get existing templates
    const { data: existingTemplates } = await supabase
      .from('template')
      .select('id, layout_key, title');

    const existingKeys = new Set(existingTemplates?.map(t => t.layout_key) || []);

    // Find missing templates
    const missingTemplates = sectionTemplates.filter(template => 
      !existingKeys.has(template.id)
    );

    if (missingTemplates.length > 0) {
      console.log('[ensureTemplateRecords] Creating missing template records:', missingTemplates.map(t => t.id));

      const templatesToInsert = missingTemplates.map(template => ({
        title: template.title,
        layout_key: template.id,
        type: 'section',
        status: 'active',
        fields: template.fields || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('template')
        .insert(templatesToInsert);

      if (error) {
        console.error('[ensureTemplateRecords] Error creating template records:', error);
        return false;
      }

      console.log('[ensureTemplateRecords] Successfully created template records');
    } else {
      console.log('[ensureTemplateRecords] All template records exist');
    }

    return true;

  } catch (error) {
    console.error('[ensureTemplateRecords] Error ensuring template records:', error);
    return false;
  }
}