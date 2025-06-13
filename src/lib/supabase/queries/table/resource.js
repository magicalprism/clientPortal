import { createClient } from '@/lib/supabase/browser';

const supabase = createClient();

// ===============================
// CORE CRUD OPERATIONS
// ===============================

/**
 * Get a single resource by ID
 */
export const fetchResourceById = async (id) => {
  return await supabase
    .from('resource')
    .select('*')
    .eq('id', id)
    .eq('is_deleted', false)
    .single();
};

/**
 * Get all resources
 */
export const fetchAllResources = async () => {
  return await supabase
    .from('resource')
    .select('*')
    .eq('is_deleted', false)
    .order('order_index')
    .order('title');
};

/**
 * Insert a new resource
 */
export const createResource = async (resourceData) => {
  const { order_index, ...otherData } = resourceData;
  
  // Get next order_index if not provided
  let finalOrderIndex = order_index;
  if (finalOrderIndex === undefined) {
    const { data: maxOrder } = await supabase
      .from('resource')
      .select('order_index')
      .eq('parent_id', resourceData.parent_id || null)
      .order('order_index', { ascending: false })
      .limit(1)
      .single();
    
    finalOrderIndex = (maxOrder?.order_index || 0) + 1;
  }

  return await supabase
    .from('resource')
    .insert({
      ...otherData,
      order_index: finalOrderIndex,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();
};

/**
 * Update resource by ID
 */
export const updateResource = async (id, updates) => {
  return await supabase
    .from('resource')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();
};

/**
 * Delete resource by ID (soft delete)
 */
export const deleteResource = async (id) => {
  return await supabase
    .from('resource')
    .update({ 
      is_deleted: true, 
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', id);
};

// ===============================
// RELATIONSHIP QUERIES
// ===============================

/**
 * Get resources by company ID
 */
export const fetchResourcesByCompanyId = async (companyId) => {
  return await supabase
    .from('resource')
    .select(`
      *,
      company:company_id(id, title)
    `)
    .eq('company_id', companyId)
    .eq('is_deleted', false)
    .order('order_index')
    .order('title');
};

/**
 * Get resources by project ID
 */
export const fetchResourcesByProjectId = async (projectId) => {
  return await supabase
    .from('resource')
    .select(`
      *,
      project:project_id(id, title)
    `)
    .eq('project_id', projectId)
    .eq('is_deleted', false)
    .order('order_index')
    .order('title');
};

/**
 * Get resources by status
 */
export const fetchResourcesByStatus = async (status) => {
  return await supabase
    .from('resource')
    .select('*')
    .eq('status', status)
    .eq('is_deleted', false)
    .order('order_index')
    .order('title');
};

/**
 * Get resources by type
 */
export const fetchResourcesByType = async (type) => {
  return await supabase
    .from('resource')
    .select('*')
    .eq('type', type)
    .eq('is_deleted', false)
    .order('order_index')
    .order('title');
};

/**
 * Get resources by author
 */
export const fetchResourcesByAuthorId = async (authorId) => {
  return await supabase
    .from('resource')
    .select('*')
    .eq('author_id', authorId)
    .eq('is_deleted', false)
    .order('order_index')
    .order('title');
};

/**
 * Get internal only resources
 */
export const fetchInternalResources = async () => {
  return await supabase
    .from('resource')
    .select('*')
    .eq('internal_only', true)
    .eq('is_deleted', false)
    .order('order_index')
    .order('title');
};

/**
 * Get public resources (not internal only)
 */
export const fetchPublicResources = async () => {
  return await supabase
    .from('resource')
    .select('*')
    .eq('internal_only', false)
    .eq('is_deleted', false)
    .order('order_index')
    .order('title');
};

/**
 * Get resource with full details including relationships
 */
export const fetchResourceWithDetails = async (id) => {
  return await supabase
    .from('resource')
    .select(`
      *,
      company:company_id(id, title),
      project:project_id(id, title),
      author:author_id(id, title),
      parent:parent_id(id, title),
      thumbnail:thumbnail_id(id, title, file_path)
    `)
    .eq('id', id)
    .eq('is_deleted', false)
    .single();
};

// ===============================
// HIERARCHICAL FUNCTIONS
// ===============================

/**
 * Get child resources
 */
export const fetchChildResources = async (parentId) => {
  return await supabase
    .from('resource')
    .select('*')
    .eq('parent_id', parentId)
    .eq('is_deleted', false)
    .order('order_index')
    .order('title');
};

/**
 * Get resource hierarchy (parent and children)
 */
export const fetchResourceHierarchy = async (resourceId) => {
  const { data: resource, error: resourceError } = await fetchResourceById(resourceId);
  if (resourceError) return { data: null, error: resourceError };

  const { data: children, error: childrenError } = await fetchChildResources(resourceId);
  if (childrenError) return { data: null, error: childrenError };

  let parent = null;
  if (resource.parent_id) {
    const { data: parentData, error: parentError } = await fetchResourceById(resource.parent_id);
    if (!parentError) parent = parentData;
  }

  return {
    data: {
      resource,
      parent,
      children: children || []
    },
    error: null
  };
};

/**
 * Reorder resources within the same parent
 */
export const reorderResources = async (resourceIds, parentId = null) => {
  const updates = resourceIds.map((id, index) => ({
    id,
    order_index: index,
    updated_at: new Date().toISOString()
  }));

  const promises = updates.map(update => 
    supabase
      .from('resource')
      .update({ order_index: update.order_index, updated_at: update.updated_at })
      .eq('id', update.id)
  );

  const results = await Promise.all(promises);
  return { data: results, error: null };
};

// ===============================
// MEDIA RELATIONSHIP FUNCTIONS
// ===============================

/**
 * Link media to a resource
 */
export const linkMediaToResource = async (mediaId, resourceId) => {
  return await supabase
    .from('media_resource')
    .insert({ media_id: mediaId, resource_id: resourceId })
    .select();
};

/**
 * Unlink media from a resource
 */
export const unlinkMediaFromResource = async (mediaId, resourceId) => {
  return await supabase
    .from('media_resource')
    .delete()
    .eq('media_id', mediaId)
    .eq('resource_id', resourceId);
};

/**
 * Get media for a resource
 */
export const fetchMediaForResource = async (resourceId) => {
  return await supabase
    .from('media_resource')
    .select(`
      media_id,
      media:media_id(*)
    `)
    .eq('resource_id', resourceId);
};

/**
 * Get resources for media
 */
export const fetchResourcesForMedia = async (mediaId) => {
  return await supabase
    .from('media_resource')
    .select(`
      resource_id,
      resource:resource_id(*)
    `)
    .eq('media_id', mediaId);
};

// ===============================
// TAG RELATIONSHIP FUNCTIONS
// ===============================

/**
 * Link a tag (category) to a resource
 */
export const linkTagToResource = async (categoryId, resourceId) => {
  return await supabase
    .from('category_resource')
    .insert({ category_id: categoryId, resource_id: resourceId })
    .select();
};

/**
 * Unlink a tag from a resource
 */
export const unlinkTagFromResource = async (categoryId, resourceId) => {
  return await supabase
    .from('category_resource')
    .delete()
    .eq('category_id', categoryId)
    .eq('resource_id', resourceId);
};

/**
 * Get tags for a resource
 */
export const fetchTagsForResource = async (resourceId) => {
  return await supabase
    .from('category_resource')
    .select(`
      category_id,
      category:category_id(*)
    `)
    .eq('resource_id', resourceId);
};

/**
 * Get resources for a tag
 */
export const fetchResourcesForTag = async (categoryId) => {
  return await supabase
    .from('category_resource')
    .select(`
      resource_id,
      resource:resource_id(*)
    `)
    .eq('category_id', categoryId);
};

// ===============================
// UTILITY FUNCTIONS
// ===============================

/**
 * Duplicate a resource
 */
export const duplicateResource = async (resourceId, newTitle = null) => {
  const { data: originalResource, error: fetchError } = await fetchResourceById(resourceId);
  if (fetchError) return { data: null, error: fetchError };

  const { id, created_at, updated_at, slug, ...resourceData } = originalResource;
  
  const duplicatedData = {
    ...resourceData,
    title: newTitle || `${originalResource.title} (Copy)`,
    slug: null // Will be auto-generated
  };

  return await createResource(duplicatedData);
};

/**
 * Get resource statistics
 */
export const getResourceStats = async (resourceId) => {
  // Get basic resource info
  const { data: resource, error: resourceError } = await fetchResourceById(resourceId);
  if (resourceError) return { data: null, error: resourceError };

  // Get related counts
  const { count: mediaCount } = await supabase
    .from('media_resource')
    .select('*', { count: 'exact', head: true })
    .eq('resource_id', resourceId);

  const { count: tagCount } = await supabase
    .from('category_resource')
    .select('*', { count: 'exact', head: true })
    .eq('resource_id', resourceId);

  const { count: childrenCount } = await supabase
    .from('resource')
    .select('*', { count: 'exact', head: true })
    .eq('parent_id', resourceId)
    .eq('is_deleted', false);

  return {
    data: {
      resource,
      mediaCount: mediaCount || 0,
      tagCount: tagCount || 0,
      childrenCount: childrenCount || 0
    },
    error: null
  };
};

/**
 * Search resources with advanced filtering
 */
export const searchResources = async (searchTerm = '', filters = {}) => {
  let query = supabase
    .from('resource')
    .select(`
      *,
      company:company_id(id, title),
      project:project_id(id, title),
      author:author_id(id, title)
    `)
    .eq('is_deleted', false);

  // Apply search term
  if (searchTerm) {
    query = query.or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,goal.ilike.%${searchTerm}%`);
  }

  // Apply filters
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '' && value !== null) {
      if (Array.isArray(value)) {
        query = query.in(key, value);
      } else {
        query = query.eq(key, value);
      }
    }
  });

  // Default ordering
  query = query.order('order_index').order('title');

  return await query;
};

/**
 * Get resources with advanced filtering and pagination
 */
export const fetchResourcesWithFilters = async (filters = {}, searchQuery = '', page = 1, limit = 50) => {
  const offset = (page - 1) * limit;

  let query = supabase
    .from('resource')
    .select(`
      *,
      company:company_id(id, title),
      project:project_id(id, title),
      author:author_id(id, title)
    `, { count: 'exact' })
    .eq('is_deleted', false);

  // Apply search
  if (searchQuery) {
    query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,goal.ilike.%${searchQuery}%`);
  }

  // Apply filters
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '' && value !== null) {
      if (Array.isArray(value)) {
        query = query.in(key, value);
      } else {
        query = query.eq(key, value);
      }
    }
  });

  // Apply sorting
  if (filters.sort) {
    const [field, direction] = filters.sort.split(':');
    query = query.order(field, { ascending: direction === 'asc' });
  } else {
    query = query.order('order_index').order('title');
  }

  // Apply pagination
  query = query.range(offset, offset + limit - 1);

  return await query;
};

/**
 * Get resources by multiple types
 */
export const fetchResourcesByTypes = async (types) => {
  return await supabase
    .from('resource')
    .select('*')
    .in('type', types)
    .eq('is_deleted', false)
    .order('order_index')
    .order('title');
};

/**
 * Get featured/highlighted resources
 */
export const fetchFeaturedResources = async (limit = 10) => {
  return await supabase
    .from('resource')
    .select(`
      *,
      company:company_id(id, title),
      project:project_id(id, title),
      thumbnail:thumbnail_id(id, title, file_path)
    `)
    .eq('status', 'published')
    .eq('is_deleted', false)
    .not('thumbnail_id', 'is', null) // Has thumbnail
    .order('updated_at', { ascending: false })
    .limit(limit);
};

/**
 * Get recent resources
 */
export const fetchRecentResources = async (limit = 10) => {
  return await supabase
    .from('resource')
    .select(`
      *,
      company:company_id(id, title),
      project:project_id(id, title),
      author:author_id(id, title)
    `)
    .eq('status', 'published')
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(limit);
};

/**
 * Get resource tree structure for navigation
 */
export const fetchResourceTree = async (parentId = null) => {
  const { data: resources, error } = await supabase
    .from('resource')
    .select('id, title, parent_id, type, status')
    .eq('parent_id', parentId)
    .eq('is_deleted', false)
    .order('order_index')
    .order('title');

  if (error) return { data: null, error };

  // Recursively get children for each resource
  const resourcesWithChildren = await Promise.all(
    resources.map(async (resource) => {
      const { data: children } = await fetchResourceTree(resource.id);
      return {
        ...resource,
        children: children || []
      };
    })
  );

  return { data: resourcesWithChildren, error: null };
};

/**
 * Get resources for Kanban view grouped by status
 */
export const fetchResourcesForKanban = async (filters = {}) => {
  let query = supabase
    .from('resource')
    .select(`
      *,
      company:company_id(id, title),
      project:project_id(id, title),
      author:author_id(id, title)
    `)
    .eq('is_deleted', false);

  // Apply filters
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '' && value !== null) {
      if (Array.isArray(value)) {
        query = query.in(key, value);
      } else {
        query = query.eq(key, value);
      }
    }
  });

  query = query.order('order_index').order('title');

  const { data: resources, error } = await query;
  
  if (error) return { data: null, error };

  // Group by status
  const grouped = {
    draft: [],
    published: [],
    private: [],
    archived: []
  };

  resources.forEach(resource => {
    const status = resource.status || 'draft';
    if (grouped[status]) {
      grouped[status].push(resource);
    }
  });

  return { data: grouped, error: null };
};