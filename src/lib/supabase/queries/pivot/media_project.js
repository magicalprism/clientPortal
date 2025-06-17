import { createClient } from '@/lib/supabase/browser';

const supabase = createClient();

/**
 * Get media items for a project
 */
export const fetchMediaForProject = async (projectId) => {
  return await supabase
    .from('media_project')
    .select(`
      media_id,
      media:media_id(*)
    `)
    .eq('project_id', projectId);
};

/**
 * Get projects for a media item
 */
export const fetchProjectsForMedia = async (mediaId) => {
  return await supabase
    .from('media_project')
    .select(`
      project_id,
      project:project_id(*)
    `)
    .eq('media_id', mediaId);
};

/**
 * Link a media item to a project
 */
export const linkMediaToProject = async (mediaId, projectId, metadata = {}) => {
  // Check if the relationship already exists
  const { data: existing } = await supabase
    .from('media_project')
    .select('*')
    .eq('media_id', mediaId)
    .eq('project_id', projectId)
    .maybeSingle();

  if (existing) {
    // If it exists and we have metadata to update, update it
    if (Object.keys(metadata).length > 0) {
      return await supabase
        .from('media_project')
        .update(metadata)
        .eq('media_id', mediaId)
        .eq('project_id', projectId)
        .select();
    }
    return { data: existing, error: null };
  }

  // Insert new relationship with optional metadata
  return await supabase
    .from('media_project')
    .insert({ 
      media_id: mediaId, 
      project_id: projectId,
      ...metadata
    })
    .select();
};

/**
 * Unlink a media item from a project
 */
export const unlinkMediaFromProject = async (mediaId, projectId) => {
  return await supabase
    .from('media_project')
    .delete()
    .eq('media_id', mediaId)
    .eq('project_id', projectId);
};

/**
 * Update media_project relationship metadata
 */
export const updateMediaProject = async (mediaId, projectId, metadata) => {
  return await supabase
    .from('media_project')
    .update(metadata)
    .eq('media_id', mediaId)
    .eq('project_id', projectId);
};

/**
 * Batch link media items to a project
 */
export const linkMediaItemsToProject = async (mediaIds, projectId, metadata = {}) => {
  if (!mediaIds || !mediaIds.length) {
    return { data: [], error: null };
  }

  const insertData = mediaIds.map(mediaId => ({
    media_id: mediaId,
    project_id: projectId,
    ...metadata
  }));

  return await supabase
    .from('media_project')
    .upsert(insertData, { onConflict: ['media_id', 'project_id'] })
    .select();
};

/**
 * Batch link projects to a media item
 */
export const linkProjectsToMedia = async (projectIds, mediaId, metadata = {}) => {
  if (!projectIds || !projectIds.length) {
    return { data: [], error: null };
  }

  const insertData = projectIds.map(projectId => ({
    media_id: mediaId,
    project_id: projectId,
    ...metadata
  }));

  return await supabase
    .from('media_project')
    .upsert(insertData, { onConflict: ['media_id', 'project_id'] })
    .select();
};

/**
 * Replace all media relationships for a project
 */
export const replaceMediaForProject = async (mediaIds, projectId, metadata = {}) => {
  // First delete all existing relationships
  const { error: deleteError } = await supabase
    .from('media_project')
    .delete()
    .eq('project_id', projectId);

  if (deleteError) {
    return { data: null, error: deleteError };
  }

  // If no media to add, we're done
  if (!mediaIds || !mediaIds.length) {
    return { data: [], error: null };
  }

  // Add new relationships
  return await linkMediaItemsToProject(mediaIds, projectId, metadata);
};

/**
 * Replace all project relationships for a media item
 */
export const replaceProjectsForMedia = async (projectIds, mediaId, metadata = {}) => {
  // First delete all existing relationships
  const { error: deleteError } = await supabase
    .from('media_project')
    .delete()
    .eq('media_id', mediaId);

  if (deleteError) {
    return { data: null, error: deleteError };
  }

  // If no projects to add, we're done
  if (!projectIds || !projectIds.length) {
    return { data: [], error: null };
  }

  // Add new relationships
  return await linkProjectsToMedia(projectIds, mediaId, metadata);
};

/**
 * Get media items for a project by type
 */
export const fetchMediaForProjectByType = async (projectId, mediaType) => {
  return await supabase
    .from('media_project')
    .select(`
      media_id,
      media:media_id(*)
    `)
    .eq('project_id', projectId)
    .eq('media.mime_type', mediaType);
};

/**
 * Get media items for a project with filters
 */
export const fetchMediaForProjectWithFilters = async (projectId, filters = {}) => {
  let query = supabase
    .from('media_project')
    .select(`
      media_id,
      media:media_id(*)
    `)
    .eq('project_id', projectId);

  // Apply filters to the joined media table
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query = query.eq(`media.${key}`, value);
    }
  });

  return await query;
};