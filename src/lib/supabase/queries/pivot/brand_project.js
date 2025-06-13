// lib/supabase/queries/pivot/brand_project.js

import { createClient } from '@/lib/supabase/browser';
const supabase = createClient();

/**
 * Get all projects for a brand (via pivot)
 */
export const fetchProjectsForBrand = async (brandId) => {
  const { data, error } = await supabase
    .from('brand_project')
    .select(`
      project_id,
      project:project_id(
        id,
        title,
        status,
        company_id,
        url,
        slug
      )
    `)
    .eq('brand_id', brandId);

  if (error) return { data: [], error };

  // Extract just the project data
  const projects = (data || [])
    .map(row => row.project)
    .filter(Boolean);

  return { data: projects, error: null };
};

/**
 * Get all brands for a project (via pivot)
 */
export const fetchBrandsForProject = async (projectId) => {
  const { data, error } = await supabase
    .from('brand_project')
    .select(`
      brand_id,
      brand:brand_id(
        id,
        title,
        primary_color,
        secondary_color,
        company_id
      )
    `)
    .eq('project_id', projectId);

  if (error) return { data: [], error };

  // Extract just the brand data
  const brands = (data || [])
    .map(row => row.brand)
    .filter(Boolean);

  return { data: brands, error: null };
};

/**
 * Link a project to a brand
 */
export const linkProjectToBrand = async (projectId, brandId, authorId = null) => {
  // First check if relationship already exists
  const { data: existing } = await supabase
    .from('brand_project')
    .select('id')
    .eq('brand_id', brandId)
    .eq('project_id', projectId)
    .single();

  if (existing) {
    return { data: existing, error: null };
  }

  return await supabase
    .from('brand_project')
    .insert({
      brand_id: brandId,
      project_id: projectId,
      author_id: authorId
    })
    .select()
    .single();
};

/**
 * Unlink a project from a brand
 */
export const unlinkProjectFromBrand = async (projectId, brandId) => {
  return await supabase
    .from('brand_project')
    .delete()
    .eq('brand_id', brandId)
    .eq('project_id', projectId);
};

/**
 * Update brand projects (replace all relationships for a brand)
 */
export const updateBrandProjects = async (brandId, projectIds, authorId = null) => {
  // First delete all existing relationships for this brand
  const { error: deleteError } = await supabase
    .from('brand_project')
    .delete()
    .eq('brand_id', brandId);

  if (deleteError) return { data: null, error: deleteError };

  // If no project IDs provided, we're done
  if (!projectIds || projectIds.length === 0) {
    return { data: [], error: null };
  }

  // Insert new relationships
  const relationships = projectIds.map(projectId => ({
    brand_id: brandId,
    project_id: projectId,
    author_id: authorId
  }));

  return await supabase
    .from('brand_project')
    .insert(relationships)
    .select();
};

/**
 * Update project brands (replace all relationships for a project)
 */
export const updateProjectBrands = async (projectId, brandIds, authorId = null) => {
  // First delete all existing relationships for this project
  const { error: deleteError } = await supabase
    .from('brand_project')
    .delete()
    .eq('project_id', projectId);

  if (deleteError) return { data: null, error: deleteError };

  // If no brand IDs provided, we're done
  if (!brandIds || brandIds.length === 0) {
    return { data: [], error: null };
  }

  // Insert new relationships
  const relationships = brandIds.map(brandId => ({
    brand_id: brandId,
    project_id: projectId,
    author_id: authorId
  }));

  return await supabase
    .from('brand_project')
    .insert(relationships)
    .select();
};

/**
 * Get all brand-project relationships
 */
export const fetchAllBrandProjects = async () => {
  return await supabase
    .from('brand_project')
    .select(`
      *,
      brand:brand_id(id, title),
      project:project_id(id, title)
    `)
    .order('brand_id', { ascending: true });
};

/**
 * Check if brand-project relationship exists
 */
export const checkBrandProjectExists = async (brandId, projectId) => {
  const { data, error } = await supabase
    .from('brand_project')
    .select('id')
    .eq('brand_id', brandId)
    .eq('project_id', projectId)
    .single();

  return { exists: !!data, error };
};

/**
 * Get brand-project relationship by ID
 */
export const fetchBrandProjectById = async (id) => {
  return await supabase
    .from('brand_project')
    .select(`
      *,
      brand:brand_id(id, title),
      project:project_id(id, title)
    `)
    .eq('id', id)
    .single();
};

/**
 * Bulk link projects to brand
 */
export const bulkLinkProjectsToBrand = async (brandId, projectIds, authorId = null) => {
  const relationships = projectIds.map(projectId => ({
    brand_id: brandId,
    project_id: projectId,
    author_id: authorId
  }));

  return await supabase
    .from('brand_project')
    .upsert(relationships, { 
      onConflict: 'brand_id,project_id',
      ignoreDuplicates: true 
    })
    .select();
};

/**
 * Get projects not linked to a specific brand
 */
export const fetchUnlinkedProjects = async (brandId) => {
  // Get all linked project IDs for this brand
  const { data: linkedProjects } = await supabase
    .from('brand_project')
    .select('project_id')
    .eq('brand_id', brandId);

  const linkedProjectIds = (linkedProjects || []).map(lp => lp.project_id);

  // Get all projects not in the linked list
  let query = supabase
    .from('project')
    .select('id, title')
    .eq('is_deleted', false);

  if (linkedProjectIds.length > 0) {
    query = query.not('id', 'in', `(${linkedProjectIds.join(',')})`);
  }

  return await query.order('title', { ascending: true });
};