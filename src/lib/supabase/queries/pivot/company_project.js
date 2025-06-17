import { createClient } from '@/lib/supabase/browser';

const supabase = createClient();

/**
 * Get companies for a project
 */
export const fetchCompaniesForProject = async (projectId) => {
  return await supabase
    .from('company_project')
    .select(`
      company_id,
      company:company_id(*)
    `)
    .eq('project_id', projectId);
};

/**
 * Get projects for a company
 */
export const fetchProjectsForCompany = async (companyId) => {
  return await supabase
    .from('company_project')
    .select(`
      project_id,
      project:project_id(*)
    `)
    .eq('company_id', companyId);
};

/**
 * Link a company to a project
 */
export const linkCompanyToProject = async (companyId, projectId) => {
  // Check if the relationship already exists
  const { data: existing } = await supabase
    .from('company_project')
    .select('*')
    .eq('company_id', companyId)
    .eq('project_id', projectId)
    .maybeSingle();

  if (existing) {
    return { data: existing, error: null };
  }

  return await supabase
    .from('company_project')
    .insert({ company_id: companyId, project_id: projectId })
    .select();
};

/**
 * Unlink a company from a project
 */
export const unlinkCompanyFromProject = async (companyId, projectId) => {
  return await supabase
    .from('company_project')
    .delete()
    .eq('company_id', companyId)
    .eq('project_id', projectId);
};

/**
 * Update company_project relationship metadata
 */
export const updateCompanyProject = async (companyId, projectId, metadata) => {
  return await supabase
    .from('company_project')
    .update(metadata)
    .eq('company_id', companyId)
    .eq('project_id', projectId);
};

/**
 * Batch link companies to a project
 */
export const linkCompaniesToProject = async (companyIds, projectId) => {
  if (!companyIds || !companyIds.length) {
    return { data: [], error: null };
  }

  const insertData = companyIds.map(companyId => ({
    company_id: companyId,
    project_id: projectId
  }));

  return await supabase
    .from('company_project')
    .upsert(insertData, { onConflict: ['company_id', 'project_id'] })
    .select();
};

/**
 * Batch link projects to a company
 */
export const linkProjectsToCompany = async (projectIds, companyId) => {
  if (!projectIds || !projectIds.length) {
    return { data: [], error: null };
  }

  const insertData = projectIds.map(projectId => ({
    company_id: companyId,
    project_id: projectId
  }));

  return await supabase
    .from('company_project')
    .upsert(insertData, { onConflict: ['company_id', 'project_id'] })
    .select();
};

/**
 * Replace all company relationships for a project
 */
export const replaceCompaniesForProject = async (companyIds, projectId) => {
  // First delete all existing relationships
  const { error: deleteError } = await supabase
    .from('company_project')
    .delete()
    .eq('project_id', projectId);

  if (deleteError) {
    return { data: null, error: deleteError };
  }

  // If no companies to add, we're done
  if (!companyIds || !companyIds.length) {
    return { data: [], error: null };
  }

  // Add new relationships
  return await linkCompaniesToProject(companyIds, projectId);
};

/**
 * Replace all project relationships for a company
 */
export const replaceProjectsForCompany = async (projectIds, companyId) => {
  // First delete all existing relationships
  const { error: deleteError } = await supabase
    .from('company_project')
    .delete()
    .eq('company_id', companyId);

  if (deleteError) {
    return { data: null, error: deleteError };
  }

  // If no projects to add, we're done
  if (!projectIds || !projectIds.length) {
    return { data: [], error: null };
  }

  // Add new relationships
  return await linkProjectsToCompany(projectIds, companyId);
};