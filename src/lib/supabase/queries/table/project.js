// lib/supabase/queries/table/project.js - ENHANCED VERSION

import { createClient } from '@/lib/supabase/browser';

const supabase = createClient();

/**
 * Get a single project by ID
 */
export const fetchProjectById = async (id) => {
  return await supabase
    .from('project')
    .select('*')
    .eq('id', id)
    .single();
};

/**
 * Get all projects with basic info
 */
export const fetchAllProjects = async () => {
  return await supabase
    .from('project')
    .select('*')
    .order('title');
};

/**
 * Get projects with company information
 */
export const fetchProjectsWithCompany = async (filters = {}, searchQuery = '') => {
  let query = supabase
    .from('project')
    .select(`
      id, 
      title, 
      status, 
      company_id,
      created_at,
      updated_at,
      company:company_id(
        id,
        title
      )
    `);

  // Apply filters
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      if (Array.isArray(value)) {
        query = query.in(key, value);
      } else {
        query = query.eq(key, value);
      }
    }
  });

  // Apply search if provided
  if (searchQuery) {
    query = query.or(`title.ilike.%${searchQuery}%,company.title.ilike.%${searchQuery}%`);
  }

  // Order by title
  query = query.order('title');

  return await query;
};

/**
 * Get projects by company ID with enhanced selection info
 */
export const fetchProjectsByCompanyId = async (companyId) => {
  return await supabase
    .from('project')
    .select(`
      id,
      title,
      status,
      company_id,
      created_at,
      updated_at,
      company:company_id(
        id,
        title
      )
    `)
    .eq('company_id', companyId)
    .order('updated_at', { ascending: false }); // Most recently updated first
};

/**
 * Get projects by status
 */
export const fetchProjectsByStatus = async (status) => {
  return await supabase
    .from('project')
    .select('*')
    .eq('status', status)
    .order('title');
};

/**
 * Get most recently updated project for a specific company
 */
export const fetchMostRecentProjectByCompany = async (companyId) => {
  return await supabase
    .from('project')
    .select(`
      id,
      title,
      status,
      company_id,
      created_at,
      updated_at,
      company:company_id(
        id,
        title
      )
    `)
    .eq('company_id', companyId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();
};

/**
 * Get projects for company that the current user is associated with
 */
export const fetchProjectsForUserCompanies = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { data: [], error: { message: 'No authenticated user' } };
  }

  // First get user's company
  const { data: userContact, error: contactError } = await supabase
    .from('contact')
    .select(`
      id,
      company:company_contact(
        company_id
      )
    `)
    .eq('supabase_user_id', user.id)
    .single();

  if (contactError || !userContact?.company?.length) {
    return { data: [], error: contactError || { message: 'User has no associated company' } };
  }

  const companyIds = userContact.company.map(c => c.company_id);

  // Then get projects for those company
  return await supabase
    .from('project')
    .select(`
      id,
      title,
      status,
      company_id,
      created_at,
      updated_at,
      company:company_id(
        id,
        title
      )
    `)
    .in('company_id', companyIds)
    .order('updated_at', { ascending: false });
};

/**
 * Get default project for current user (most recent from user's primary company)
 */
export const fetchDefaultProjectForUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { data: null, error: { message: 'No authenticated user' } };
  }

  // Get user's company (first one will be primary)
  const { data: userContact, error: contactError } = await supabase
    .from('contact')
    .select(`
      id,
      supabase_user_id,
      company:company_contact(
        company_id,
        company:company_id(
          id,
          title
        )
      )
    `)
    .eq('supabase_user_id', user.id)
    .single();

  if (contactError || !userContact?.company?.length) {
    // Fallback to any recent project
    return await supabase
      .from('project')
      .select(`
        id,
        title,
        status,
        company_id,
        updated_at,
        company:company_id(
          id,
          title
        )
      `)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();
  }

  // Get most recent project from user's primary company
  const primaryCompanyId = userContact.company[0].company_id;
  
  return await fetchMostRecentProjectByCompany(primaryCompanyId);
};

/**
 * Insert a new project
 */
export const insertProject = async (projectData) => {
  return await supabase
    .from('project')
    .insert(projectData)
    .select()
    .single();
};

/**
 * Update project by ID
 */
export const updateProjectById = async (id, updates) => {
  return await supabase
    .from('project')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
};

/**
 * Delete project by ID (soft delete)
 */
export const deleteProjectById = async (id) => {
  return await supabase
    .from('project')
    .update({ 
      is_deleted: true, 
      deleted_at: new Date().toISOString() 
    })
    .eq('id', id);
};

/**
 * Get project with full details including tasks and milestones
 */
export const fetchProjectWithDetails = async (id) => {
  return await supabase
    .from('project')
    .select(`
      *,
      company:company_id(
        id,
        title
      ),
      tasks:task(
        id,
        title,
        status,
        assigned_id,
        due_date
      )
    `)
    .eq('id', id)
    .single();
};