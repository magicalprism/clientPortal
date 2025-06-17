import { createClient } from '@/lib/supabase/browser';

const supabase = createClient();

/**
 * Get categories (tags) for a project
 */
export const fetchCategoriesForProject = async (projectId) => {
  return await supabase
    .from('category_project')
    .select(`
      category_id,
      category:category_id(*)
    `)
    .eq('project_id', projectId);
};

/**
 * Get projects for a category (tag)
 */
export const fetchProjectsForCategory = async (categoryId) => {
  return await supabase
    .from('category_project')
    .select(`
      project_id,
      project:project_id(*)
    `)
    .eq('category_id', categoryId);
};

/**
 * Link a category (tag) to a project
 */
export const linkCategoryToProject = async (categoryId, projectId) => {
  // Check if the relationship already exists
  const { data: existing } = await supabase
    .from('category_project')
    .select('*')
    .eq('category_id', categoryId)
    .eq('project_id', projectId)
    .maybeSingle();

  if (existing) {
    return { data: existing, error: null };
  }

  return await supabase
    .from('category_project')
    .insert({ category_id: categoryId, project_id: projectId })
    .select();
};

/**
 * Unlink a category (tag) from a project
 */
export const unlinkCategoryFromProject = async (categoryId, projectId) => {
  return await supabase
    .from('category_project')
    .delete()
    .eq('category_id', categoryId)
    .eq('project_id', projectId);
};

/**
 * Update category_project relationship metadata
 */
export const updateCategoryProject = async (categoryId, projectId, metadata) => {
  return await supabase
    .from('category_project')
    .update(metadata)
    .eq('category_id', categoryId)
    .eq('project_id', projectId);
};

/**
 * Batch link categories (tags) to a project
 */
export const linkCategoriesToProject = async (categoryIds, projectId) => {
  if (!categoryIds || !categoryIds.length) {
    return { data: [], error: null };
  }

  const insertData = categoryIds.map(categoryId => ({
    category_id: categoryId,
    project_id: projectId
  }));

  return await supabase
    .from('category_project')
    .upsert(insertData, { onConflict: ['category_id', 'project_id'] })
    .select();
};

/**
 * Batch link projects to a category (tag)
 */
export const linkProjectsToCategory = async (projectIds, categoryId) => {
  if (!projectIds || !projectIds.length) {
    return { data: [], error: null };
  }

  const insertData = projectIds.map(projectId => ({
    category_id: categoryId,
    project_id: projectId
  }));

  return await supabase
    .from('category_project')
    .upsert(insertData, { onConflict: ['category_id', 'project_id'] })
    .select();
};

/**
 * Replace all category (tag) relationships for a project
 */
export const replaceCategoriesForProject = async (categoryIds, projectId) => {
  // First delete all existing relationships
  const { error: deleteError } = await supabase
    .from('category_project')
    .delete()
    .eq('project_id', projectId);

  if (deleteError) {
    return { data: null, error: deleteError };
  }

  // If no categories to add, we're done
  if (!categoryIds || !categoryIds.length) {
    return { data: [], error: null };
  }

  // Add new relationships
  return await linkCategoriesToProject(categoryIds, projectId);
};

/**
 * Replace all project relationships for a category (tag)
 */
export const replaceProjectsForCategory = async (projectIds, categoryId) => {
  // First delete all existing relationships
  const { error: deleteError } = await supabase
    .from('category_project')
    .delete()
    .eq('category_id', categoryId);

  if (deleteError) {
    return { data: null, error: deleteError };
  }

  // If no projects to add, we're done
  if (!projectIds || !projectIds.length) {
    return { data: [], error: null };
  }

  // Add new relationships
  return await linkProjectsToCategory(projectIds, categoryId);
};

/**
 * Get categories (tags) for a project by type
 */
export const fetchCategoriesForProjectByType = async (projectId, categoryType) => {
  return await supabase
    .from('category_project')
    .select(`
      category_id,
      category:category_id(*)
    `)
    .eq('project_id', projectId)
    .eq('category.type', categoryType);
};

/**
 * Get projects for a category (tag) with filters
 */
export const fetchProjectsForCategoryWithFilters = async (categoryId, filters = {}) => {
  let query = supabase
    .from('category_project')
    .select(`
      project_id,
      project:project_id(*)
    `)
    .eq('category_id', categoryId);

  // Apply filters to the joined project table
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query = query.eq(`project.${key}`, value);
    }
  });

  return await query;
};