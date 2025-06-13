/*
REQUIRED SQL MIGRATIONS:

-- Add missing order_index column for standardization
ALTER TABLE project ADD COLUMN IF NOT EXISTS order_index integer DEFAULT 0;

-- Update existing records with order_index based on creation order
WITH ranked_projects AS (
  SELECT id, 
    ROW_NUMBER() OVER (
      PARTITION BY COALESCE(parent_id, 0) 
      ORDER BY COALESCE(created_at, NOW()), id
    ) - 1 as new_order_index
  FROM project 
  WHERE order_index = 0 OR order_index IS NULL
)
UPDATE project 
SET order_index = ranked_projects.new_order_index
FROM ranked_projects 
WHERE project.id = ranked_projects.id;

-- Ensure junction tables exist for relationships
CREATE TABLE IF NOT EXISTS brand_project (
  id SERIAL PRIMARY KEY,
  brand_id INTEGER REFERENCES brand(id) ON DELETE CASCADE,
  project_id INTEGER REFERENCES project(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(brand_id, project_id)
);

CREATE TABLE IF NOT EXISTS login_project (
  id SERIAL PRIMARY KEY,
  login_id INTEGER REFERENCES login(id) ON DELETE CASCADE,
  project_id INTEGER REFERENCES project(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(login_id, project_id)
);

CREATE TABLE IF NOT EXISTS category_project (
  id SERIAL PRIMARY KEY,
  category_id INTEGER REFERENCES category(id) ON DELETE CASCADE,
  project_id INTEGER REFERENCES project(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(category_id, project_id)
);

CREATE TABLE IF NOT EXISTS contact_project (
  id SERIAL PRIMARY KEY,
  contact_id INTEGER REFERENCES contact(id) ON DELETE CASCADE,
  project_id INTEGER REFERENCES project(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(contact_id, project_id)
);

CREATE TABLE IF NOT EXISTS event_project (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES event(id) ON DELETE CASCADE,
  project_id INTEGER REFERENCES project(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, project_id)
);

CREATE TABLE IF NOT EXISTS media_project (
  id SERIAL PRIMARY KEY,
  media_id INTEGER REFERENCES media(id) ON DELETE CASCADE,
  project_id INTEGER REFERENCES project(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(media_id, project_id)
);
*/

import { createClient } from '@/lib/supabase/browser';

const supabase = createClient();

// ===============================
// CORE CRUD OPERATIONS
// ===============================

/**
 * Get a single project by ID
 */
export const fetchProjectById = async (id) => {
  return await supabase
    .from('project')
    .select('*')
    .eq('id', id)
    .eq('is_deleted', false)
    .single();
};

/**
 * Get all projects
 */
export const fetchAllProjects = async () => {
  return await supabase
    .from('project')
    .select('*')
    .eq('is_deleted', false)
    .order('order_index')
    .order('title');
};

/**
 * Insert a new project
 */
export const createProject = async (projectData) => {
  const { order_index, ...otherData } = projectData;
  
  // Get next order_index if not provided
  let finalOrderIndex = order_index;
  if (finalOrderIndex === undefined) {
    const { data: maxOrder } = await supabase
      .from('project')
      .select('order_index')
      .eq('parent_id', projectData.parent_id || null)
      .order('order_index', { ascending: false })
      .limit(1)
      .single();
    
    finalOrderIndex = (maxOrder?.order_index || 0) + 1;
  }

  return await supabase
    .from('project')
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
 * Update project by ID
 */
export const updateProject = async (id, updates) => {
  return await supabase
    .from('project')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();
};

/**
 * Delete project by ID (soft delete)
 */
export const deleteProject = async (id) => {
  return await supabase
    .from('project')
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
 * Get projects by company ID
 */
export const fetchProjectsByCompanyId = async (companyId) => {
  return await supabase
    .from('project')
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
 * Get projects by status
 */
export const fetchProjectsByStatus = async (status) => {
  return await supabase
    .from('project')
    .select('*')
    .eq('status', status)
    .eq('is_deleted', false)
    .order('order_index')
    .order('title');
};

/**
 * Get projects by author
 */
export const fetchProjectsByAuthorId = async (authorId) => {
  return await supabase
    .from('project')
    .select('*')
    .eq('author_id', authorId)
    .eq('is_deleted', false)
    .order('order_index')
    .order('title');
};

/**
 * Get projects with full details including relationships
 */
export const fetchProjectWithDetails = async (id) => {
  return await supabase
    .from('project')
    .select(`
      *,
      company:company_id(id, title),
      author:author_id(id, title),
      server:server_id(id, title),
      care_plan:care_plan_id(id, title),
      parent:parent_id(id, title)
    `)
    .eq('id', id)
    .eq('is_deleted', false)
    .single();
};

// ===============================
// HIERARCHICAL FUNCTIONS
// ===============================

/**
 * Get child projects
 */
export const fetchChildProjects = async (parentId) => {
  return await supabase
    .from('project')
    .select('*')
    .eq('parent_id', parentId)
    .eq('is_deleted', false)
    .order('order_index')
    .order('title');
};

/**
 * Get project hierarchy (parent and children)
 */
export const fetchProjectHierarchy = async (projectId) => {
  const { data: project, error: projectError } = await fetchProjectById(projectId);
  if (projectError) return { data: null, error: projectError };

  const { data: children, error: childrenError } = await fetchChildProjects(projectId);
  if (childrenError) return { data: null, error: childrenError };

  let parent = null;
  if (project.parent_id) {
    const { data: parentData, error: parentError } = await fetchProjectById(project.parent_id);
    if (!parentError) parent = parentData;
  }

  return {
    data: {
      project,
      parent,
      children: children || []
    },
    error: null
  };
};

/**
 * Reorder projects within the same parent
 */
export const reorderProjects = async (projectIds, parentId = null) => {
  const updates = projectIds.map((id, index) => ({
    id,
    order_index: index,
    updated_at: new Date().toISOString()
  }));

  const promises = updates.map(update => 
    supabase
      .from('project')
      .update({ order_index: update.order_index, updated_at: update.updated_at })
      .eq('id', update.id)
  );

  const results = await Promise.all(promises);
  return { data: results, error: null };
};

// ===============================
// BRAND RELATIONSHIP FUNCTIONS
// ===============================

/**
 * Link a brand to a project
 */
export const linkBrandToProject = async (brandId, projectId) => {
  return await supabase
    .from('brand_project')
    .insert({ brand_id: brandId, project_id: projectId })
    .select();
};

/**
 * Unlink a brand from a project
 */
export const unlinkBrandFromProject = async (brandId, projectId) => {
  return await supabase
    .from('brand_project')
    .delete()
    .eq('brand_id', brandId)
    .eq('project_id', projectId);
};

/**
 * Get brands for a project
 */
export const fetchBrandsForProject = async (projectId) => {
  return await supabase
    .from('brand_project')
    .select(`
      brand_id,
      brand:brand_id(*)
    `)
    .eq('project_id', projectId);
};

/**
 * Get projects for a brand
 */
export const fetchProjectsForBrand = async (brandId) => {
  return await supabase
    .from('brand_project')
    .select(`
      project_id,
      project:project_id(*)
    `)
    .eq('brand_id', brandId);
};

// ===============================
// LOGIN RELATIONSHIP FUNCTIONS
// ===============================

/**
 * Link a login to a project
 */
export const linkLoginToProject = async (loginId, projectId) => {
  return await supabase
    .from('login_project')
    .insert({ login_id: loginId, project_id: projectId })
    .select();
};

/**
 * Unlink a login from a project
 */
export const unlinkLoginFromProject = async (loginId, projectId) => {
  return await supabase
    .from('login_project')
    .delete()
    .eq('login_id', loginId)
    .eq('project_id', projectId);
};

/**
 * Get logins for a project
 */
export const fetchLoginsForProject = async (projectId) => {
  return await supabase
    .from('login_project')
    .select(`
      login_id,
      login:login_id(*)
    `)
    .eq('project_id', projectId);
};

/**
 * Get projects for a login
 */
export const fetchProjectsForLogin = async (loginId) => {
  return await supabase
    .from('login_project')
    .select(`
      project_id,
      project:project_id(*)
    `)
    .eq('login_id', loginId);
};

// ===============================
// TAG RELATIONSHIP FUNCTIONS
// ===============================

/**
 * Link a tag (category) to a project
 */
export const linkTagToProject = async (categoryId, projectId) => {
  return await supabase
    .from('category_project')
    .insert({ category_id: categoryId, project_id: projectId })
    .select();
};

/**
 * Unlink a tag from a project
 */
export const unlinkTagFromProject = async (categoryId, projectId) => {
  return await supabase
    .from('category_project')
    .delete()
    .eq('category_id', categoryId)
    .eq('project_id', projectId);
};

/**
 * Get tags for a project
 */
export const fetchTagsForProject = async (projectId) => {
  return await supabase
    .from('category_project')
    .select(`
      category_id,
      category:category_id(*)
    `)
    .eq('project_id', projectId);
};

/**
 * Get projects for a tag
 */
export const fetchProjectsForTag = async (categoryId) => {
  return await supabase
    .from('category_project')
    .select(`
      project_id,
      project:project_id(*)
    `)
    .eq('category_id', categoryId);
};

// ===============================
// CONTACT RELATIONSHIP FUNCTIONS
// ===============================

/**
 * Link a contact to a project
 */
export const linkContactToProject = async (contactId, projectId) => {
  return await supabase
    .from('contact_project')
    .insert({ contact_id: contactId, project_id: projectId })
    .select();
};

/**
 * Unlink a contact from a project
 */
export const unlinkContactFromProject = async (contactId, projectId) => {
  return await supabase
    .from('contact_project')
    .delete()
    .eq('contact_id', contactId)
    .eq('project_id', projectId);
};

/**
 * Get contacts for a project
 */
export const fetchContactsForProject = async (projectId) => {
  return await supabase
    .from('contact_project')
    .select(`
      contact_id,
      contact:contact_id(*)
    `)
    .eq('project_id', projectId);
};

/**
 * Get projects for a contact
 */
export const fetchProjectsForContact = async (contactId) => {
  return await supabase
    .from('contact_project')
    .select(`
      project_id,
      project:project_id(*)
    `)
    .eq('contact_id', contactId);
};

// ===============================
// EVENT RELATIONSHIP FUNCTIONS
// ===============================

/**
 * Link an event to a project
 */
export const linkEventToProject = async (eventId, projectId) => {
  return await supabase
    .from('event_project')
    .insert({ event_id: eventId, project_id: projectId })
    .select();
};

/**
 * Unlink an event from a project
 */
export const unlinkEventFromProject = async (eventId, projectId) => {
  return await supabase
    .from('event_project')
    .delete()
    .eq('event_id', eventId)
    .eq('project_id', projectId);
};

/**
 * Get events for a project
 */
export const fetchEventsForProject = async (projectId) => {
  return await supabase
    .from('event_project')
    .select(`
      event_id,
      event:event_id(*)
    `)
    .eq('project_id', projectId);
};

/**
 * Get projects for an event
 */
export const fetchProjectsForEvent = async (eventId) => {
  return await supabase
    .from('event_project')
    .select(`
      project_id,
      project:project_id(*)
    `)
    .eq('event_id', eventId);
};

// ===============================
// MEDIA RELATIONSHIP FUNCTIONS
// ===============================

/**
 * Link media to a project
 */
export const linkMediaToProject = async (mediaId, projectId) => {
  return await supabase
    .from('media_project')
    .insert({ media_id: mediaId, project_id: projectId })
    .select();
};

/**
 * Unlink media from a project
 */
export const unlinkMediaFromProject = async (mediaId, projectId) => {
  return await supabase
    .from('media_project')
    .delete()
    .eq('media_id', mediaId)
    .eq('project_id', projectId);
};

/**
 * Get media for a project
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
 * Get projects for media
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

// ===============================
// UTILITY FUNCTIONS
// ===============================

/**
 * Duplicate a project
 */
export const duplicateProject = async (projectId, newTitle = null) => {
  const { data: originalProject, error: fetchError } = await fetchProjectById(projectId);
  if (fetchError) return { data: null, error: fetchError };

  const { id, created_at, updated_at, slug, ...projectData } = originalProject;
  
  const duplicatedData = {
    ...projectData,
    title: newTitle || `${originalProject.title} (Copy)`,
    slug: null // Will be auto-generated
  };

  return await createProject(duplicatedData);
};

/**
 * Get project statistics
 */
export const getProjectStats = async (projectId) => {
  // Get basic project info
  const { data: project, error: projectError } = await fetchProjectById(projectId);
  if (projectError) return { data: null, error: projectError };

  // Get task count if task table exists
  const { count: taskCount } = await supabase
    .from('task')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId);

  // Get related counts
  const { count: brandCount } = await supabase
    .from('brand_project')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId);

  const { count: loginCount } = await supabase
    .from('login_project')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId);

  const { count: contactCount } = await supabase
    .from('contact_project')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId);

  const { count: mediaCount } = await supabase
    .from('media_project')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId);

  return {
    data: {
      project,
      taskCount: taskCount || 0,
      brandCount: brandCount || 0,
      loginCount: loginCount || 0,
      contactCount: contactCount || 0,
      mediaCount: mediaCount || 0
    },
    error: null
  };
};

/**
 * Search projects with advanced filtering
 */
export const searchProjects = async (searchTerm = '', filters = {}) => {
  let query = supabase
    .from('project')
    .select(`
      *,
      company:company_id(id, title),
      author:author_id(id, title)
    `)
    .eq('is_deleted', false);

  // Apply search term
  if (searchTerm) {
    query = query.or(`title.ilike.%${searchTerm}%,site_name.ilike.%${searchTerm}%,site_tagline.ilike.%${searchTerm}%`);
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
 * Get projects with advanced filtering and pagination
 */
export const fetchProjectsWithFilters = async (filters = {}, searchQuery = '', page = 1, limit = 50) => {
  const offset = (page - 1) * limit;

  let query = supabase
    .from('project')
    .select(`
      *,
      company:company_id(id, title),
      author:author_id(id, title)
    `, { count: 'exact' })
    .eq('is_deleted', false);

  // Apply search
  if (searchQuery) {
    query = query.or(`title.ilike.%${searchQuery}%,site_name.ilike.%${searchQuery}%,site_tagline.ilike.%${searchQuery}%`);
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
 * Get user's accessible projects (for permission-based filtering)
 */
export const fetchUserProjects = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { data: [], error: { message: 'No authenticated user' } };
  }

  // Get user's contact record
  const { data: userContact, error: contactError } = await supabase
    .from('contact')
    .select(`
      id,
      company_contact!inner(
        company_id,
        company:company_id(id, title)
      )
    `)
    .eq('supabase_user_id', user.id)
    .single();

  if (contactError || !userContact?.company_contact?.length) {
    // If no company association, return all projects (admin access)
    return await fetchAllProjects();
  }

  // Get company IDs user has access to
  const companyIds = userContact.company_contact.map(cc => cc.company_id);

  // Get projects for those companies
  return await supabase
    .from('project')
    .select(`
      *,
      company:company_id(id, title)
    `)
    .in('company_id', companyIds)
    .eq('is_deleted', false)
    .order('order_index')
    .order('title');
};