// lib/supabase/queries/table/company.js

import { createClient } from '@/lib/supabase/browser';

const supabase = createClient();

/**
 * Get a single company by ID
 */
export const fetchCompanyById = async (id) => {
  return await supabase
    .from('company')
    .select('*')
    .eq('id', id)
    .single();
};

/**
 * Get all companies
 */
export const fetchAllCompanies = async () => {
  return await supabase
    .from('company')
    .select('*')
    .order('title');
};

/**
 * Get companies that have projects (for kanban view)
 * Fixed version - filter on client side instead of using aggregate in WHERE
 */
export const fetchCompaniesWithProjects = async () => {
  try {
    // Get all companies with their project count
    const { data, error } = await supabase
      .from('company')
      .select(`
        id,
        title,
        status,
        project:project(count)
      `)
      .order('title');

    if (error) {
      throw error;
    }

    // Filter companies that have at least one project on the client side
    const companiesWithProjects = (data || []).filter(company => {
      return company.project && company.project.length > 0 && company.project[0].count > 0;
    });

    return { data: companiesWithProjects, error: null };
  } catch (error) {
    console.error('Error fetching companies with projects:', error);
    return { data: [], error };
  }
};

/**
 * Alternative approach using EXISTS pattern (more efficient for large datasets)
 */
export const fetchCompaniesWithProjectsAlternative = async () => {
  try {
    // Get companies that have at least one project using a different approach
    const { data, error } = await supabase
      .from('company')
      .select(`
        id,
        title,
        status
      `)
      .in('id', 
        // Subquery to get company IDs that have projects
        supabase
          .from('project')
          .select('company_id')
          .not('company_id', 'is', null)
      )
      .order('title');

    if (error) {
      throw error;
    }

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching companies with projects (alternative):', error);
    return { data: [], error };
  }
};

/**
 * Simple approach - get companies and check for projects separately
 */
export const fetchCompaniesWithProjectsSimple = async () => {
  try {
    // First get all companies
    const { data: companies, error: companiesError } = await supabase
      .from('company')
      .select('id, title, status')
      .order('title');

    if (companiesError) {
      throw companiesError;
    }

    if (!companies || companies.length === 0) {
      return { data: [], error: null };
    }

    // Get company IDs that have projects
    const { data: projectCompanies, error: projectsError } = await supabase
      .from('project')
      .select('company_id')
      .in('company_id', companies.map(c => c.id))
      .not('company_id', 'is', null);

    if (projectsError) {
      throw projectsError;
    }

    // Get unique company IDs that have projects
    const companyIdsWithProjects = [...new Set(
      (projectCompanies || []).map(p => p.company_id)
    )];

    // Filter companies that have projects
    const companiesWithProjects = companies.filter(company => 
      companyIdsWithProjects.includes(company.id)
    );

    return { data: companiesWithProjects, error: null };
  } catch (error) {
    console.error('Error fetching companies with projects (simple):', error);
    return { data: [], error };
  }
};

/**
 * Get current user's contact info with company details
 */
export const fetchCurrentUserContact = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { data: null, error: { message: 'No authenticated user' } };
  }

  return await supabase
    .from('contact')
    .select(`
      id,
      title,
      email,
      supabase_user_id,
      company:company_contact(
        company:company_id(
          id,
          title,
          status
        )
      )
    `)
    .eq('supabase_user_id', user.id)
    .single();
};

/**
 * Insert a new company
 */
export const insertCompany = async (companyData) => {
  return await supabase
    .from('company')
    .insert(companyData)
    .select()
    .single();
};

/**
 * Update company by ID
 */
export const updateCompanyById = async (id, updates) => {
  return await supabase
    .from('company')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
};

/**
 * Delete company by ID (soft delete)
 */
export const deleteCompanyById = async (id) => {
  return await supabase
    .from('company')
    .update({ 
      is_deleted: true, 
      deleted_at: new Date().toISOString() 
    })
    .eq('id', id);
};