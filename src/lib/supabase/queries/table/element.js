// lib/supabase/queries/table/element.js

/*
REQUIRED SQL MIGRATION for order_index standardization:

-- Add order_index column to element table
ALTER TABLE element ADD COLUMN IF NOT EXISTS order_index integer DEFAULT 0;

-- Update existing records to have proper order_index values (optional)
UPDATE element 
SET order_index = ROW_NUMBER() OVER (
  PARTITION BY COALESCE(parent_id, project_id, 0) 
  ORDER BY created_at
) - 1
WHERE order_index = 0 OR order_index IS NULL;
*/

import { createClient } from '@/lib/supabase/browser';
const supabase = createClient();

/**
 * Get a single element by ID with all related data
 */
export const fetchElementById = async (id) => {
  const { data, error } = await supabase
    .from('element')
    .select(`
      *,
      company:company_id(id, title),
      project:project_id(id, title, status),
      author:author_id(id, title, email),
      parent:parent_id(id, title),
      resource:resource_id(id, title, description),
      thumbnail:thumbnail_id(id, url, alt_text),
      tasks:task(
        id,
        title,
        status,
        due_date,
        assigned_id,
        order_index,
        assigned_contact:contact!assigned_id(id, title, email)
      ),
      media_items:element_media(
        media:media_id(id, title, url, alt_text, file_type, mime_type)
      ),
      sections:element_section(
        id,
        title,
        content,
        order_index,
        section_media:media_section(
          media:media_id(id, title, url, alt_text)
        )
      ),
      tags:category_element(
        category:category_id(id, title)
      ),
      child_elements:element!parent_id(id, title, type, status, order_index)
    `)
    .eq('id', id)
    .single();

  // Transform nested data for easier use
  if (data) {
    data.media_items = data.media_items?.map(m => m.media) || [];
    data.tags = data.tags?.map(t => t.category) || [];
    
    // Sort tasks and sections by order_index
    if (data.tasks) {
      data.tasks.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
    }
    if (data.sections) {
      data.sections.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
    }
    if (data.child_elements) {
      data.child_elements.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
    }
  }

  return { data, error };
};

/**
 * Get all elements with optional filters
 */
export const fetchAllElements = async (filters = {}) => {
  let query = supabase
    .from('element')
    .select(`
      id,
      title,
      type,
      status,
      url,
      staging_url,
      is_template,
      x,
      y,
      order_index,
      created_at,
      updated_at,
      company:company_id(id, title),
      project:project_id(id, title, status),
      author:author_id(id, title),
      parent:parent_id(id, title),
      resource:resource_id(id, title),
      thumbnail:thumbnail_id(id, url, alt_text),
      task_count:task(count),
      media_count:element_media(count),
      child_count:element!parent_id(count)
    `)
    .eq('is_deleted', false);

  // Apply filters
  if (filters.status && filters.status.length > 0) {
    query = query.in('status', filters.status);
  }
  
  if (filters.type && filters.type.length > 0) {
    query = query.in('type', filters.type);
  }
  
  if (filters.company_id) {
    query = query.eq('company_id', filters.company_id);
  }
  
  if (filters.project_id) {
    query = query.eq('project_id', filters.project_id);
  }
  
  if (filters.author_id) {
    query = query.eq('author_id', filters.author_id);
  }

  if (filters.parent_id !== undefined) {
    if (filters.parent_id === null || filters.parent_id === 'null') {
      query = query.is('parent_id', null);
    } else {
      query = query.eq('parent_id', filters.parent_id);
    }
  }

  if (filters.is_template !== undefined) {
    query = query.eq('is_template', filters.is_template);
  }

  // Apply sorting
  if (filters.sort) {
    const [field, direction] = filters.sort.split(':');
    query = query.order(field, { ascending: direction === 'asc' });
  } else {
    // Default sorting: by order_index, then by created_at
    query = query.order('order_index', { ascending: true, nullsFirst: false });
    query = query.order('created_at', { ascending: false });
  }

  const { data, error } = await query;
  return { data, error };
};

/**
 * Create a new element
 */
export const createElement = async (elementData) => {
  // Get current max order_index for the parent/project combination
  let orderQuery = supabase
    .from('element')
    .select('order_index');

  if (elementData.parent_id) {
    orderQuery = orderQuery.eq('parent_id', elementData.parent_id);
  } else if (elementData.project_id) {
    orderQuery = orderQuery.eq('project_id', elementData.project_id);
  }

  const { data: existingElements } = await orderQuery
    .order('order_index', { ascending: false })
    .limit(1);
    
  const nextOrderIndex = (existingElements?.[0]?.order_index || -1) + 1;

  const { data, error } = await supabase
    .from('element')
    .insert([{
      ...elementData,
      status: elementData.status || 'plan',
      order_index: elementData.order_index ?? nextOrderIndex,
      is_template: elementData.is_template ?? false,
      create_folder: elementData.create_folder ?? false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }])
    .select(`
      *,
      company:company_id(id, title),
      project:project_id(id, title),
      author:author_id(id, title),
      parent:parent_id(id, title),
      resource:resource_id(id, title)
    `)
    .single();

  return { data, error };
};

/**
 * Update element
 */
export const updateElement = async (id, updates) => {
  const { data, error } = await supabase
    .from('element')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select(`
      *,
      company:company_id(id, title),
      project:project_id(id, title),
      author:author_id(id, title),
      parent:parent_id(id, title),
      resource:resource_id(id, title)
    `)
    .single();

  return { data, error };
};

/**
 * Delete element (soft delete)
 */
export const deleteElement = async (id, softDelete = true) => {
  if (softDelete) {
    const { error } = await supabase
      .from('element')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
    return { success: !error, error };
  } else {
    const { error } = await supabase
      .from('element')
      .delete()
      .eq('id', id);
    return { success: !error, error };
  }
};

// ========== PROJECT/COMPANY RELATIONS ==========

/**
 * Get elements by company
 */
export const fetchElementsByCompany = async (companyId) => {
  const { data, error } = await supabase
    .from('element')
    .select(`
      id,
      title,
      type,
      status,
      url,
      staging_url,
      order_index,
      created_at,
      project:project_id(id, title),
      task_count:task(count)
    `)
    .eq('company_id', companyId)
    .eq('is_deleted', false)
    .order('order_index', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false });

  return { data, error };
};

/**
 * Get elements by project
 */
export const fetchElementsByProject = async (projectId) => {
  const { data, error } = await supabase
    .from('element')
    .select(`
      id,
      title,
      type,
      status,
      url,
      staging_url,
      is_template,
      order_index,
      x,
      y,
      created_at,
      updated_at,
      company:company_id(id, title),
      author:author_id(id, title),
      parent:parent_id(id, title),
      task_count:task(count),
      media_count:element_media(count),
      child_count:element!parent_id(count)
    `)
    .eq('project_id', projectId)
    .eq('is_deleted', false)
    .order('order_index', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false });

  return { data, error };
};

// ========== HIERARCHICAL MANAGEMENT ==========

/**
 * Get elements by parent (hierarchical)
 */
export const fetchElementsByParent = async (parentId) => {
  const condition = parentId ? { parent_id: parentId } : { parent_id: null };

  const { data, error } = await supabase
    .from('element')
    .select(`
      id,
      title,
      type,
      status,
      url,
      staging_url,
      order_index,
      x,
      y,
      created_at,
      updated_at,
      company:company_id(id, title),
      project:project_id(id, title),
      child_count:element!parent_id(count)
    `)
    .match(condition)
    .eq('is_deleted', false)
    .order('order_index', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false });

  return { data, error };
};

/**
 * Get root-level elements (no parent)
 */
export const fetchRootElements = async (projectId = null) => {
  let query = supabase
    .from('element')
    .select(`
      id,
      title,
      type,
      status,
      url,
      staging_url,
      order_index,
      x,
      y,
      created_at,
      company:company_id(id, title),
      project:project_id(id, title),
      child_count:element!parent_id(count)
    `)
    .is('parent_id', null)
    .eq('is_deleted', false);

  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  query = query.order('order_index', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false });

  const { data, error } = await query;
  return { data, error };
};

/**
 * Get child elements
 */
export const fetchChildElements = async (parentId) => {
  return await fetchElementsByParent(parentId);
};

// ========== STATUS & TYPE MANAGEMENT ==========

/**
 * Update element status
 */
export const updateElementStatus = async (id, newStatus) => {
  const { data, error } = await supabase
    .from('element')
    .update({
      status: newStatus,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select('id, status')
    .single();

  return { data, error };
};

/**
 * Get elements by type
 */
export const fetchElementsByType = async (type, projectId = null) => {
  let query = supabase
    .from('element')
    .select(`
      id,
      title,
      status,
      url,
      staging_url,
      order_index,
      created_at,
      company:company_id(id, title),
      project:project_id(id, title),
      parent:parent_id(id, title)
    `)
    .eq('type', type)
    .eq('is_deleted', false);

  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  query = query.order('order_index', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false });

  const { data, error } = await query;
  return { data, error };
};

/**
 * Get element templates
 */
export const fetchElementTemplates = async (type = null) => {
  let query = supabase
    .from('element')
    .select(`
      id,
      title,
      type,
      status,
      description,
      content,
      order_index,
      created_at,
      author:author_id(id, title)
    `)
    .eq('is_template', true)
    .eq('is_deleted', false);

  if (type) {
    query = query.eq('type', type);
  }

  query = query.order('order_index', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false });

  const { data, error } = await query;
  return { data, error };
};

// ========== GOOGLE DRIVE INTEGRATION ==========

/**
 * Update Google Drive folder information
 */
export const updateElementDriveFolder = async (id, driveData) => {
  const { data, error } = await supabase
    .from('element')
    .update({
      drive_folder_id: driveData.folder_id,
      drive_copy_drafts_id: driveData.copy_drafts_id,
      drive_final_deliverables_id: driveData.final_deliverables_id,
      drive_original_name: driveData.original_name,
      element_folder: driveData.folder_url,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select('id, drive_folder_id, element_folder')
    .single();

  return { data, error };
};

/**
 * Get elements with Drive folders
 */
export const fetchElementsWithDriveFolders = async (projectId = null) => {
  let query = supabase
    .from('element')
    .select(`
      id,
      title,
      drive_folder_id,
      element_folder,
      create_folder,
      project:project_id(id, title),
      company:company_id(id, title)
    `)
    .not('drive_folder_id', 'is', null)
    .eq('is_deleted', false);

  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  const { data, error } = await query;
  return { data, error };
};

// ========== POSITIONING ==========

/**
 * Update element position (x, y coordinates)
 */
export const updateElementPosition = async (id, x, y) => {
  const { data, error } = await supabase
    .from('element')
    .update({
      x,
      y,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select('id, x, y')
    .single();

  return { data, error };
};

/**
 * Bulk update element positions
 */
export const bulkUpdateElementPositions = async (positionUpdates) => {
  const updates = positionUpdates.map(({ id, x, y, order_index }) => 
    supabase
      .from('element')
      .update({ 
        x,
        y,
        order_index,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
  );
  
  const results = await Promise.all(updates);
  const errors = results.filter(result => result.error);
  
  return { 
    success: errors.length === 0,
    errors: errors.map(result => result.error)
  };
};

// ========== MEDIA MANAGEMENT ==========

/**
 * Link media to element
 */
export const linkMediaToElement = async (elementId, mediaIds) => {
  if (!Array.isArray(mediaIds)) {
    mediaIds = [mediaIds];
  }

  // Remove existing links first
  await supabase
    .from('element_media')
    .delete()
    .eq('element_id', elementId);

  // Add new links
  const insertData = mediaIds.map(mediaId => ({
    element_id: elementId,
    media_id: mediaId,
    created_at: new Date().toISOString()
  }));

  const { data, error } = await supabase
    .from('element_media')
    .insert(insertData)
    .select(`
      media:media_id(id, title, url, alt_text, file_type, mime_type)
    `);

  return { 
    data: data?.map(item => item.media) || [], 
    error 
  };
};

/**
 * Get element media gallery
 */
export const fetchElementMedia = async (elementId, filters = {}) => {
  let query = supabase
    .from('element_media')
    .select(`
      media:media_id(
        id,
        title,
        url,
        alt_text,
        file_type,
        mime_type,
        file_size,
        created_at
      )
    `)
    .eq('element_id', elementId);

  // Apply media filters
  if (filters.mime_type) {
    query = query.eq('media.mime_type', filters.mime_type);
  }

  // Apply sorting
  if (filters.sort) {
    const [field, direction] = filters.sort.split(':');
    query = query.order(`media.${field}`, { ascending: direction === 'asc' });
  } else {
    query = query.order('media.created_at', { ascending: false });
  }

  const { data, error } = await query;
  return { 
    data: data?.map(item => item.media) || [], 
    error 
  };
};

// ========== SECTION MANAGEMENT ==========

/**
 * Get element sections
 */
export const fetchElementSections = async (elementId) => {
  const { data, error } = await supabase
    .from('element_section')
    .select(`
      id,
      title,
      content,
      order_index,
      created_at,
      updated_at,
      section_media:media_section(
        media:media_id(id, title, url, alt_text)
      )
    `)
    .eq('element_id', elementId)
    .order('order_index');

  return { data, error };
};

/**
 * Create element section
 */
export const createElementSection = async (elementId, sectionData) => {
  // Get current max order_index for this element
  const { data: existingSections } = await supabase
    .from('element_section')
    .select('order_index')
    .eq('element_id', elementId)
    .order('order_index', { ascending: false })
    .limit(1);
    
  const nextOrderIndex = (existingSections?.[0]?.order_index || -1) + 1;

  const { data, error } = await supabase
    .from('element_section')
    .insert([{
      element_id: elementId,
      ...sectionData,
      order_index: sectionData.order_index ?? nextOrderIndex,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }])
    .select('*')
    .single();

  return { data, error };
};

// ========== TAG MANAGEMENT ==========

/**
 * Link tags to element
 */
export const linkTagsToElement = async (elementId, categoryIds) => {
  if (!Array.isArray(categoryIds)) {
    categoryIds = [categoryIds];
  }

  // Remove existing links first
  await supabase
    .from('category_element')
    .delete()
    .eq('element_id', elementId);

  // Add new links
  const insertData = categoryIds.map(categoryId => ({
    element_id: elementId,
    category_id: categoryId,
    created_at: new Date().toISOString()
  }));

  const { data, error } = await supabase
    .from('category_element')
    .insert(insertData)
    .select(`
      category:category_id(id, title)
    `);

  return { 
    data: data?.map(item => item.category) || [], 
    error 
  };
};

/**
 * Get element tags
 */
export const fetchElementTags = async (elementId) => {
  const { data, error } = await supabase
    .from('category_element')
    .select(`
      category:category_id(id, title)
    `)
    .eq('element_id', elementId);

  return { 
    data: data?.map(item => item.category) || [], 
    error 
  };
};

// ========== TASK MANAGEMENT ==========

/**
 * Get element tasks
 */
export const fetchElementTasks = async (elementId) => {
  const { data, error } = await supabase
    .from('task')
    .select(`
      id,
      title,
      status,
      due_date,
      priority,
      order_index,
      created_at,
      assigned_contact:assigned_id(id, title, email)
    `)
    .eq('element_id', elementId)
    .eq('is_deleted', false)
    .order('order_index');

  return { data, error };
};

// ========== UTILITY FUNCTIONS ==========

/**
 * Duplicate an element
 */
export const duplicateElement = async (elementId, options = {}) => {
  const { 
    newTitle, 
    targetParentId, 
    targetProjectId, 
    includeMedia = true, 
    includeSections = true, 
    includeTasks = false,
    includeTags = true,
    includeChildren = false
  } = options;

  // Get the original element
  const { data: originalElement, error: fetchError } = await fetchElementById(elementId);
  
  if (fetchError) {
    return { data: null, error: fetchError };
  }

  // Prepare new element data
  const { 
    id, 
    created_at, 
    updated_at, 
    drive_folder_id,
    drive_copy_drafts_id,
    drive_final_deliverables_id,
    media_items,
    sections, 
    tasks,
    tags,
    child_elements,
    ...elementData 
  } = originalElement;
  
  const newElementData = {
    ...elementData,
    title: newTitle || `${originalElement.title} (Copy)`,
    status: 'plan', // Reset status for copy
    parent_id: targetParentId !== undefined ? targetParentId : originalElement.parent_id,
    project_id: targetProjectId !== undefined ? targetProjectId : originalElement.project_id,
    // Reset Drive fields for copy
    drive_folder_id: null,
    drive_copy_drafts_id: null,
    drive_final_deliverables_id: null,
    element_folder: null
  };

  // Create new element
  const { data: newElement, error: createError } = await createElement(newElementData);
  
  if (createError) {
    return { data: null, error: createError };
  }

  // Copy relationships
  if (includeMedia && media_items && media_items.length > 0) {
    await linkMediaToElement(newElement.id, media_items.map(m => m.id));
  }

  if (includeTags && tags && tags.length > 0) {
    await linkTagsToElement(newElement.id, tags.map(t => t.id));
  }

  if (includeSections && sections && sections.length > 0) {
    const sectionCreationPromises = sections.map(section => 
      createElementSection(newElement.id, {
        title: section.title,
        content: section.content
      })
    );

    await Promise.all(sectionCreationPromises);
  }

  // Copy children if requested
  if (includeChildren && child_elements && child_elements.length > 0) {
    const childDuplicationPromises = child_elements.map(child => 
      duplicateElement(child.id, {
        targetParentId: newElement.id,
        targetProjectId: newElement.project_id,
        includeMedia,
        includeSections,
        includeTasks,
        includeTags,
        includeChildren: true
      })
    );

    await Promise.all(childDuplicationPromises);
  }

  return { data: newElement, error: null };
};

/**
 * Get element statistics
 */
export const getElementStats = async (projectId = null, companyId = null) => {
  let query = supabase
    .from('element')
    .select('id, type, status, is_template')
    .eq('is_deleted', false);

  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  if (companyId) {
    query = query.eq('company_id', companyId);
  }

  const { data, error } = await query;

  if (error) {
    return { data: null, error };
  }

  const stats = {
    total: data.length,
    templates: data.filter(e => e.is_template).length,
    byType: {
      page: data.filter(e => e.type === 'page').length,
      header: data.filter(e => e.type === 'header').length,
      footer: data.filter(e => e.type === 'footer').length,
      email: data.filter(e => e.type === 'email').length,
      popup: data.filter(e => e.type === 'popup').length
    },
    byStatus: {
      plan: data.filter(e => e.status === 'plan').length,
      copy: data.filter(e => e.status === 'copy').length,
      dev: data.filter(e => e.status === 'dev').length,
      edits: data.filter(e => e.status === 'edits').length,
      complete: data.filter(e => e.status === 'complete').length,
      default: data.filter(e => e.status === 'default').length
    }
  };

  return { data: stats, error: null };
};

/**
 * Get elements with URLs (for validation/linking)
 */
export const fetchElementsWithUrls = async (projectId = null, urlType = 'both') => {
  let query = supabase
    .from('element')
    .select(`
      id,
      title,
      url,
      staging_url,
      type,
      status,
      project:project_id(id, title)
    `)
    .eq('is_deleted', false);

  // Filter by URL type
  if (urlType === 'live') {
    query = query.not('url', 'is', null).neq('url', '');
  } else if (urlType === 'staging') {
    query = query.not('staging_url', 'is', null).neq('staging_url', '');
  } else {
    // Both - has either live or staging URL
    query = query.or('url.not.is.null,staging_url.not.is.null');
  }

  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  query = query.order('title');

  const { data, error } = await query;
  return { data, error };
};

/**
 * Move element to different parent/project
 */
export const moveElement = async (elementId, newParentId = null, newProjectId = null, newOrderIndex = null) => {
  // Get next order_index if not provided
  if (newOrderIndex === null) {
    let orderQuery = supabase
      .from('element')
      .select('order_index');

    if (newParentId) {
      orderQuery = orderQuery.eq('parent_id', newParentId);
    } else if (newProjectId) {
      orderQuery = orderQuery.eq('project_id', newProjectId);
    }

    const { data: existingElements } = await orderQuery
      .order('order_index', { ascending: false })
      .limit(1);
      
    newOrderIndex = (existingElements?.[0]?.order_index || -1) + 1;
  }

  const updateData = {
    order_index: newOrderIndex,
    updated_at: new Date().toISOString()
  };

  if (newParentId !== undefined) {
    updateData.parent_id = newParentId;
  }

  if (newProjectId !== undefined) {
    updateData.project_id = newProjectId;
  }

  const { data, error } = await supabase
    .from('element')
    .update(updateData)
    .eq('id', elementId)
    .select('*')
    .single();

  return { data, error };
};