// lib/supabase/queries/table/media.js

/*
REQUIRED SQL MIGRATIONS:

-- Add missing columns referenced in config
ALTER TABLE media ADD COLUMN IF NOT EXISTS order_index integer DEFAULT 0;
ALTER TABLE media ADD COLUMN IF NOT EXISTS file_size bigint;

-- Update existing records to have proper order_index values (fixed SQL)
WITH ranked_media AS (
  SELECT id, 
    ROW_NUMBER() OVER (
      PARTITION BY COALESCE(parent_id, company_id, project_id, 0) 
      ORDER BY COALESCE(created_at, NOW()), id
    ) - 1 as new_order_index
  FROM media 
  WHERE order_index = 0 OR order_index IS NULL
)
UPDATE media 
SET order_index = ranked_media.new_order_index
FROM ranked_media 
WHERE media.id = ranked_media.id;
*/

import { createClient } from '@/lib/supabase/browser';
const supabase = createClient();

/**
 * Get a single media item by ID with all related data
 */
export const fetchMediaById = async (id) => {
  const { data, error } = await supabase
    .from('media')
    .select(`
      *,
      company:company_id(id, title),
      project:project_id(id, title, status),
      author:author_id(id, title, email),
      parent:parent_id(id, title, mime_type),
      projects:media_project(
        project:project_id(id, title, status)
      ),
      tags:category_media(
        category:category_id(id, title)
      ),
      child_media:media!parent_id(id, title, mime_type, is_folder, order_index)
    `)
    .eq('id', id)
    .single();

  // Transform nested data
  if (data) {
    data.projects = data.projects?.map(p => p.project) || [];
    data.tags = data.tags?.map(t => t.category) || [];
  }

  return { data, error };
};

/**
 * Get all media with optional filters
 */
export const fetchAllMedia = async (filters = {}) => {
  let query = supabase
    .from('media')
    .select(`
      id,
      title,
      url,
      mime_type,
      status,
      is_folder,
      is_external,
      alt_text,
      description,
      width,
      height,
      size,
      file_size,
      order_index,
      created_at,
      updated_at,
      company:company_id(id, title),
      project:project_id(id, title),
      author:author_id(id, title),
      parent:parent_id(id, title),
      project_count:media_project(count),
      child_count:media!parent_id(count)
    `)
    .eq('is_deleted', false);

  // Apply filters
  if (filters.mime_type) {
    query = query.eq('mime_type', filters.mime_type);
  }
  
  if (filters.status) {
    query = query.eq('status', filters.status);
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

  if (filters.is_folder !== undefined) {
    query = query.eq('is_folder', filters.is_folder);
  }

  if (filters.is_external !== undefined) {
    query = query.eq('is_external', filters.is_external);
  }

  // Apply sorting
  if (filters.sort) {
    const [field, direction] = filters.sort.split(':');
    query = query.order(field, { ascending: direction === 'asc' });
  } else {
    // Default sorting: folders first, then by order_index, then by title
    query = query.order('is_folder', { ascending: false, nullsFirst: false });
    query = query.order('order_index', { ascending: true, nullsFirst: false });
    query = query.order('title', { ascending: true });
  }

  const { data, error } = await query;
  return { data, error };
};

/**
 * Create a new media item
 */
export const createMedia = async (mediaData) => {
  // Get current max order_index for the parent/company/project combination
  let orderQuery = supabase
    .from('media')
    .select('order_index');

  if (mediaData.parent_id) {
    orderQuery = orderQuery.eq('parent_id', mediaData.parent_id);
  } else if (mediaData.project_id) {
    orderQuery = orderQuery.eq('project_id', mediaData.project_id);
  } else if (mediaData.company_id) {
    orderQuery = orderQuery.eq('company_id', mediaData.company_id);
  }

  const { data: existingMedia } = await orderQuery
    .order('order_index', { ascending: false })
    .limit(1);
    
  const nextOrderIndex = (existingMedia?.[0]?.order_index || -1) + 1;

  const { data, error } = await supabase
    .from('media')
    .insert([{
      ...mediaData,
      status: mediaData.status || 'uploaded',
      order_index: mediaData.order_index ?? nextOrderIndex,
      is_folder: mediaData.is_folder ?? false,
      is_external: mediaData.is_external ?? false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }])
    .select(`
      *,
      company:company_id(id, title),
      project:project_id(id, title),
      author:author_id(id, title),
      parent:parent_id(id, title)
    `)
    .single();

  return { data, error };
};

/**
 * Update media item
 */
export const updateMedia = async (id, updates) => {
  const { data, error } = await supabase
    .from('media')
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
      parent:parent_id(id, title)
    `)
    .single();

  return { data, error };
};

/**
 * Delete media item (soft delete)
 */
export const deleteMedia = async (id, softDelete = true) => {
  if (softDelete) {
    const { error } = await supabase
      .from('media')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
    return { success: !error, error };
  } else {
    const { error } = await supabase
      .from('media')
      .delete()
      .eq('id', id);
    return { success: !error, error };
  }
};

// ========== COMPANY/PROJECT RELATIONS ==========

/**
 * Get media by company
 */
export const fetchMediaByCompany = async (companyId) => {
  const { data, error } = await supabase
    .from('media')
    .select(`
      id,
      title,
      url,
      mime_type,
      status,
      is_folder,
      alt_text,
      order_index,
      created_at,
      project:project_id(id, title),
      child_count:media!parent_id(count)
    `)
    .eq('company_id', companyId)
    .eq('is_deleted', false)
    .order('is_folder', { ascending: false, nullsFirst: false })
    .order('order_index', { ascending: true, nullsFirst: false })
    .order('title', { ascending: true });

  return { data, error };
};

/**
 * Get media by project
 */
export const fetchMediaByProject = async (projectId) => {
  const { data, error } = await supabase
    .from('media')
    .select(`
      id,
      title,
      url,
      mime_type,
      status,
      is_folder,
      alt_text,
      order_index,
      created_at,
      updated_at,
      company:company_id(id, title),
      child_count:media!parent_id(count)
    `)
    .eq('project_id', projectId)
    .eq('is_deleted', false)
    .order('is_folder', { ascending: false, nullsFirst: false })
    .order('order_index', { ascending: true, nullsFirst: false })
    .order('title', { ascending: true });

  return { data, error };
};

// ========== HIERARCHICAL MANAGEMENT (FOLDERS) ==========

/**
 * Get media by parent (folder structure)
 */
export const fetchMediaByParent = async (parentId) => {
  const condition = parentId ? { parent_id: parentId } : { parent_id: null };

  const { data, error } = await supabase
    .from('media')
    .select(`
      id,
      title,
      url,
      mime_type,
      status,
      is_folder,
      is_external,
      alt_text,
      width,
      height,
      size,
      order_index,
      created_at,
      updated_at,
      company:company_id(id, title),
      project:project_id(id, title),
      child_count:media!parent_id(count)
    `)
    .match(condition)
    .eq('is_deleted', false)
    .order('is_folder', { ascending: false, nullsFirst: false })
    .order('order_index', { ascending: true, nullsFirst: false })
    .order('title', { ascending: true });

  return { data, error };
};

/**
 * Get root-level media (no parent folder)
 */
export const fetchRootMedia = async (companyId = null, projectId = null) => {
  let query = supabase
    .from('media')
    .select(`
      id,
      title,
      url,
      mime_type,
      status,
      is_folder,
      is_external,
      alt_text,
      order_index,
      created_at,
      company:company_id(id, title),
      project:project_id(id, title),
      child_count:media!parent_id(count)
    `)
    .is('parent_id', null)
    .eq('is_deleted', false);

  if (companyId) {
    query = query.eq('company_id', companyId);
  }

  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  query = query.order('is_folder', { ascending: false, nullsFirst: false })
    .order('order_index', { ascending: true, nullsFirst: false })
    .order('title', { ascending: true });

  const { data, error } = await query;
  return { data, error };
};

/**
 * Get child media (contents of a folder)
 */
export const fetchChildMedia = async (parentId) => {
  return await fetchMediaByParent(parentId);
};

/**
 * Get media folders only
 */
export const fetchMediaFolders = async (companyId = null, projectId = null) => {
  let query = supabase
    .from('media')
    .select(`
      id,
      title,
      description,
      order_index,
      created_at,
      company:company_id(id, title),
      project:project_id(id, title),
      child_count:media!parent_id(count)
    `)
    .eq('is_folder', true)
    .eq('is_deleted', false);

  if (companyId) {
    query = query.eq('company_id', companyId);
  }

  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  query = query.order('order_index', { ascending: true, nullsFirst: false })
    .order('title', { ascending: true });

  const { data, error } = await query;
  return { data, error };
};

// ========== FILE TYPE MANAGEMENT ==========

/**
 * Get media by MIME type
 */
export const fetchMediaByMimeType = async (mimeType, companyId = null, projectId = null) => {
  let query = supabase
    .from('media')
    .select(`
      id,
      title,
      url,
      alt_text,
      width,
      height,
      size,
      order_index,
      created_at,
      company:company_id(id, title),
      project:project_id(id, title)
    `)
    .eq('mime_type', mimeType)
    .eq('is_deleted', false);

  if (companyId) {
    query = query.eq('company_id', companyId);
  }

  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  query = query.order('order_index', { ascending: true, nullsFirst: false })
    .order('title', { ascending: true });

  const { data, error } = await query;
  return { data, error };
};

/**
 * Get images only
 */
export const fetchImages = async (companyId = null, projectId = null) => {
  let query = supabase
    .from('media')
    .select(`
      id,
      title,
      url,
      alt_text,
      width,
      height,
      order_index,
      created_at,
      company:company_id(id, title),
      project:project_id(id, title)
    `)
    .like('mime_type', 'image/%')
    .eq('is_deleted', false);

  if (companyId) {
    query = query.eq('company_id', companyId);
  }

  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  query = query.order('order_index', { ascending: true, nullsFirst: false })
    .order('title', { ascending: true });

  const { data, error } = await query;
  return { data, error };
};

/**
 * Get videos only
 */
export const fetchVideos = async (companyId = null, projectId = null) => {
  let query = supabase
    .from('media')
    .select(`
      id,
      title,
      url,
      alt_text,
      width,
      height,
      size,
      order_index,
      created_at,
      company:company_id(id, title),
      project:project_id(id, title)
    `)
    .like('mime_type', 'video/%')
    .eq('is_deleted', false);

  if (companyId) {
    query = query.eq('company_id', companyId);
  }

  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  query = query.order('order_index', { ascending: true, nullsFirst: false })
    .order('title', { ascending: true });

  const { data, error } = await query;
  return { data, error };
};

/**
 * Get documents only
 */
export const fetchDocuments = async (companyId = null, projectId = null) => {
  let query = supabase
    .from('media')
    .select(`
      id,
      title,
      url,
      alt_text,
      size,
      order_index,
      created_at,
      company:company_id(id, title),
      project:project_id(id, title)
    `)
    .in('mime_type', [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv'
    ])
    .eq('is_deleted', false);

  if (companyId) {
    query = query.eq('company_id', companyId);
  }

  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  query = query.order('order_index', { ascending: true, nullsFirst: false })
    .order('title', { ascending: true });

  const { data, error } = await query;
  return { data, error };
};

// ========== PROJECT RELATIONSHIPS ==========

/**
 * Link projects to media
 */
export const linkProjectsToMedia = async (mediaId, projectIds) => {
  if (!Array.isArray(projectIds)) {
    projectIds = [projectIds];
  }

  // Remove existing links first
  await supabase
    .from('media_project')
    .delete()
    .eq('media_id', mediaId);

  // Add new links
  const insertData = projectIds.map(projectId => ({
    media_id: mediaId,
    project_id: projectId,
    created_at: new Date().toISOString()
  }));

  const { data, error } = await supabase
    .from('media_project')
    .insert(insertData)
    .select(`
      project:project_id(id, title, status)
    `);

  return { 
    data: data?.map(item => item.project) || [], 
    error 
  };
};

/**
 * Get media projects
 */
export const fetchMediaProjects = async (mediaId) => {
  const { data, error } = await supabase
    .from('media_project')
    .select(`
      project:project_id(
        id,
        title,
        status,
        description
      )
    `)
    .eq('media_id', mediaId);

  return { 
    data: data?.map(item => item.project) || [], 
    error 
  };
};

// ========== TAG MANAGEMENT ==========

/**
 * Link tags to media
 */
export const linkTagsToMedia = async (mediaId, categoryIds) => {
  if (!Array.isArray(categoryIds)) {
    categoryIds = [categoryIds];
  }

  // Remove existing links first
  await supabase
    .from('category_media')
    .delete()
    .eq('media_id', mediaId);

  // Add new links
  const insertData = categoryIds.map(categoryId => ({
    media_id: mediaId,
    category_id: categoryId,
    created_at: new Date().toISOString()
  }));

  const { data, error } = await supabase
    .from('category_media')
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
 * Get media tags
 */
export const fetchMediaTags = async (mediaId) => {
  const { data, error } = await supabase
    .from('category_media')
    .select(`
      category:category_id(id, title)
    `)
    .eq('media_id', mediaId);

  return { 
    data: data?.map(item => item.category) || [], 
    error 
  };
};

// ========== FOLDER OPERATIONS ==========

/**
 * Create a media folder
 */
export const createMediaFolder = async (folderData) => {
  const folderMediaData = {
    ...folderData,
    is_folder: true,
    mime_type: 'folder',
    url: null // Folders don't have URLs
  };

  return await createMedia(folderMediaData);
};

/**
 * Move media to folder
 */
export const moveMediaToFolder = async (mediaId, newParentId, newOrderIndex = null) => {
  // Get next order_index if not provided
  if (newOrderIndex === null) {
    const parentCondition = newParentId ? { parent_id: newParentId } : { parent_id: null };
    
    const { data: existingMedia } = await supabase
      .from('media')
      .select('order_index')
      .match(parentCondition)
      .order('order_index', { ascending: false })
      .limit(1);
      
    newOrderIndex = (existingMedia?.[0]?.order_index || -1) + 1;
  }

  const { data, error } = await supabase
    .from('media')
    .update({
      parent_id: newParentId,
      order_index: newOrderIndex,
      updated_at: new Date().toISOString()
    })
    .eq('id', mediaId)
    .select('*')
    .single();

  return { data, error };
};

// ========== REORDERING ==========

/**
 * Reorder media within same container
 */
export const reorderMedia = async (containerId, mediaOrders, containerType = 'parent') => {
  const containerField = containerType === 'parent' ? 'parent_id' : 
                        containerType === 'company' ? 'company_id' : 'project_id';
  
  const updates = mediaOrders.map(({ id, order_index }) => 
    supabase
      .from('media')
      .update({ 
        order_index,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq(containerField, containerId)
  );
  
  const results = await Promise.all(updates);
  const errors = results.filter(result => result.error);
  
  return { 
    success: errors.length === 0,
    errors: errors.map(result => result.error)
  };
};

// ========== SEARCH ==========

/**
 * Search media by title, description, or alt text
 */
export const searchMedia = async (searchTerm, filters = {}) => {
  let query = supabase
    .from('media')
    .select(`
      id,
      title,
      url,
      mime_type,
      status,
      is_folder,
      alt_text,
      description,
      company:company_id(id, title),
      project:project_id(id, title)
    `)
    .eq('is_deleted', false);

  // Apply search
  if (searchTerm) {
    query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,alt_text.ilike.%${searchTerm}%`);
  }

  // Apply additional filters
  if (filters.mime_type) {
    query = query.eq('mime_type', filters.mime_type);
  }
  
  if (filters.company_id) {
    query = query.eq('company_id', filters.company_id);
  }
  
  if (filters.project_id) {
    query = query.eq('project_id', filters.project_id);
  }
  
  if (filters.is_folder !== undefined) {
    query = query.eq('is_folder', filters.is_folder);
  }

  query = query.order('is_folder', { ascending: false, nullsFirst: false })
    .order('title');

  const { data, error } = await query;
  return { data, error };
};

// ========== UTILITY FUNCTIONS ==========

/**
 * Duplicate media item
 */
export const duplicateMedia = async (mediaId, options = {}) => {
  const { newTitle, targetParentId, targetCompanyId, targetProjectId, includeProjects = true, includeTags = true } = options;

  // Get the original media
  const { data: originalMedia, error: fetchError } = await fetchMediaById(mediaId);
  
  if (fetchError) {
    return { data: null, error: fetchError };
  }

  // Prepare new media data
  const { id, created_at, updated_at, projects, tags, child_media, ...mediaData } = originalMedia;
  
  const newMediaData = {
    ...mediaData,
    title: newTitle || `${originalMedia.title} (Copy)`,
    parent_id: targetParentId !== undefined ? targetParentId : originalMedia.parent_id,
    company_id: targetCompanyId !== undefined ? targetCompanyId : originalMedia.company_id,
    project_id: targetProjectId !== undefined ? targetProjectId : originalMedia.project_id
  };

  // Create new media
  const { data: newMedia, error: createError } = await createMedia(newMediaData);
  
  if (createError) {
    return { data: null, error: createError };
  }

  // Copy relationships
  if (includeProjects && projects && projects.length > 0) {
    await linkProjectsToMedia(newMedia.id, projects.map(p => p.id));
  }

  if (includeTags && tags && tags.length > 0) {
    await linkTagsToMedia(newMedia.id, tags.map(t => t.id));
  }

  return { data: newMedia, error: null };
};

/**
 * Get media statistics
 */
export const getMediaStats = async (companyId = null, projectId = null) => {
  let query = supabase
    .from('media')
    .select('id, mime_type, is_folder, is_external, status, size')
    .eq('is_deleted', false);

  if (companyId) {
    query = query.eq('company_id', companyId);
  }

  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  const { data, error } = await query;

  if (error) {
    return { data: null, error };
  }

  const stats = {
    total: data.length,
    folders: data.filter(m => m.is_folder).length,
    files: data.filter(m => !m.is_folder).length,
    external: data.filter(m => m.is_external).length,
    byMimeType: {},
    byStatus: {}
  };

  // Group by MIME type categories
  stats.byMimeType = {
    images: data.filter(m => m.mime_type?.startsWith('image/')).length,
    videos: data.filter(m => m.mime_type?.startsWith('video/')).length,
    audio: data.filter(m => m.mime_type?.startsWith('audio/')).length,
    documents: data.filter(m => 
      m.mime_type?.includes('pdf') || 
      m.mime_type?.includes('word') || 
      m.mime_type?.includes('excel') ||
      m.mime_type?.includes('text/')
    ).length,
    fonts: data.filter(m => m.mime_type?.startsWith('font/')).length,
    archives: data.filter(m => 
      m.mime_type?.includes('zip') || 
      m.mime_type?.includes('rar') ||
      m.mime_type?.includes('tar')
    ).length,
    other: data.filter(m => 
      m.mime_type && 
      !m.mime_type.startsWith('image/') &&
      !m.mime_type.startsWith('video/') &&
      !m.mime_type.startsWith('audio/') &&
      !m.mime_type.startsWith('font/') &&
      !m.mime_type.includes('pdf') &&
      !m.mime_type.includes('word') &&
      !m.mime_type.includes('excel') &&
      !m.mime_type.includes('text/') &&
      !m.mime_type.includes('zip') &&
      !m.mime_type.includes('rar') &&
      !m.mime_type.includes('tar')
    ).length
  };

  // Get unique statuses and count them
  const statuses = [...new Set(data.map(m => m.status).filter(Boolean))];
  statuses.forEach(status => {
    stats.byStatus[status] = data.filter(m => m.status === status).length;
  });

  return { data: stats, error: null };
};

/**
 * Get media gallery for a specific context (company, project, folder)
 */
export const fetchMediaGallery = async (context = {}, filters = {}) => {
  let query = supabase
    .from('media')
    .select(`
      id,
      title,
      url,
      mime_type,
      alt_text,
      width,
      height,
      is_folder,
      order_index,
      created_at,
      child_count:media!parent_id(count)
    `)
    .eq('is_deleted', false);

  // Apply context
  if (context.company_id) {
    query = query.eq('company_id', context.company_id);
  }
  
  if (context.project_id) {
    query = query.eq('project_id', context.project_id);
  }
  
  if (context.parent_id !== undefined) {
    if (context.parent_id === null) {
      query = query.is('parent_id', null);
    } else {
      query = query.eq('parent_id', context.parent_id);
    }
  }

  // Apply filters
  if (filters.mime_type) {
    query = query.eq('mime_type', filters.mime_type);
  }
  
  if (filters.is_folder !== undefined) {
    query = query.eq('is_folder', filters.is_folder);
  }

  // Apply sorting
  if (filters.sort) {
    const [field, direction] = filters.sort.split(':');
    query = query.order(field, { ascending: direction === 'asc' });
  } else {
    query = query.order('is_folder', { ascending: false, nullsFirst: false })
      .order('order_index', { ascending: true, nullsFirst: false })
      .order('title', { ascending: true });
  }

  const { data, error } = await query;
  return { data, error };
};

/**
 * Get recent media uploads
 */
export const fetchRecentMedia = async (limit = 20, companyId = null) => {
  let query = supabase
    .from('media')
    .select(`
      id,
      title,
      url,
      mime_type,
      alt_text,
      created_at,
      company:company_id(id, title),
      project:project_id(id, title)
    `)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (companyId) {
    query = query.eq('company_id', companyId);
  }

  const { data, error } = await query;
  return { data, error };
};


/**
 * Get font files by font name
 */
export const fetchFontsByName = async (fontName) => {
  const { data, error } = await supabase
    .from('media')
    .select('url, title, mime_type')
    .ilike('title', `%${fontName}%`)
    .or('mime_type.ilike.%font%,mime_type.ilike.%woff%')
    .eq('is_deleted', false)
    .order('title', { ascending: true });

  return { data, error };
};

/**
 * Get regular font file by font name
 */
export const fetchRegularFont = async (fontName) => {
  const { data, error } = await supabase
    .from('media')
    .select('url, title')
    .ilike('title', `%${fontName}%`)
    .not('title', 'ilike', '%italic%')
    .or('mime_type.ilike.%font%,mime_type.ilike.%woff%')
    .eq('is_deleted', false)
    .limit(1)
    .single();

  return { data, error };
};

/**
 * Get italic font file by font name
 */
export const fetchItalicFont = async (fontName) => {
  const { data, error } = await supabase
    .from('media')
    .select('url, title')
    .ilike('title', `%${fontName}%`)
    .ilike('title', '%italic%')
    .or('mime_type.ilike.%font%,mime_type.ilike.%woff%')
    .eq('is_deleted', false)
    .limit(1)
    .single();

  return { data, error };
};