// lib/supabase/queries/table/company.js

import { createClient } from '@/lib/supabase/browser';
const supabase = createClient();

/**
 * Get a single company by ID with all related data
 */
export const fetchCompanyById = async (id) => {
  const { data, error } = await supabase
    .from('company')
    .select(`
      *,
      brand:brand_id(id, title, status, primary_color, secondary_color),
      author:author_id(id, title, email),
      parent_company:parent_id(id, title, status),
      thumbnail:thumbnail_id(id, url, alt_text),
      child_companies:company!parent_id(id, title, status),
      projects:project(id, title, status, created_at),
      contacts:company_contact(
        contact:contact_id(id, title, email, role)
      ),
      brands:brand(id, title, status, primary_color),
      tags:category_company(
        category:category_id(id, title)
      )
    `)
    .eq('id', id)
    .single();

  // Transform data for easier use
  if (data) {
    data.contacts = data.contacts?.map(c => c.contact) || [];
    data.tags = data.tags?.map(t => t.category) || [];
    
    // Sort projects by creation date
    if (data.projects) {
      data.projects.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
  }

  return { data, error };
};

/**
 * Get all companies with optional filters
 */
export const fetchAllCompanies = async (filters = {}) => {
  let query = supabase
    .from('company')
    .select(`
      id,
      title,
      status,
      is_client,
      chip_color,
      created_at,
      updated_at,
      brand:brand_id(id, title, primary_color),
      author:author_id(id, title),
      parent_company:parent_id(id, title),
      thumbnail:thumbnail_id(url, alt_text),
      project_count:project(count),
      contact_count:company_contact(count)
    `);

  // Apply filters
  if (filters.status && filters.status.length > 0) {
    query = query.in('status', filters.status);
  }
  
  if (filters.is_client !== undefined) {
    query = query.eq('is_client', filters.is_client);
  }
  
  if (filters.parent_id !== undefined) {
    if (filters.parent_id === null) {
      query = query.is('parent_id', null); // Top-level companies only
    } else {
      query = query.eq('parent_id', filters.parent_id);
    }
  }
  
  if (filters.brand_id) {
    query = query.eq('brand_id', filters.brand_id);
  }

  // Apply sorting
  if (filters.sort) {
    const [field, direction] = filters.sort.split(':');
    query = query.order(field, { ascending: direction === 'asc' });
  } else {
    query = query.order('title', { ascending: true });
  }

  const { data, error } = await query;
  return { data, error };
};

/**
 * Create a new company
 */
export const createCompany = async (companyData) => {
  const { data, error } = await supabase
    .from('company')
    .insert([{
      ...companyData,
      status: companyData.status || 'in_progress',
      is_client: companyData.is_client !== undefined ? companyData.is_client : true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }])
    .select(`
      *,
      brand:brand_id(id, title),
      author:author_id(id, title),
      parent_company:parent_id(id, title),
      thumbnail:thumbnail_id(url, alt_text)
    `)
    .single();

  return { data, error };
};

/**
 * Update a company
 */
export const updateCompany = async (id, updates) => {
  const { data, error } = await supabase
    .from('company')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select(`
      *,
      brand:brand_id(id, title),
      author:author_id(id, title),
      parent_company:parent_id(id, title),
      thumbnail:thumbnail_id(url, alt_text)
    `)
    .single();

  return { data, error };
};

/**
 * Delete a company (soft delete)
 */
export const deleteCompany = async (id, softDelete = true) => {
  if (softDelete) {
    const { error } = await supabase
      .from('company')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
    return { success: !error, error };
  } else {
    const { error } = await supabase
      .from('company')
      .delete()
      .eq('id', id);
    return { success: !error, error };
  }
};

/**
 * Get companies that have projects (for dashboards/kanban views)
 */
export const fetchCompaniesWithProjects = async () => {
  try {
    // Get companies with their project count
    const { data, error } = await supabase
      .from('company')
      .select(`
        id,
        title,
        status,
        is_client,
        chip_color,
        brand:brand_id(id, title, primary_color),
        thumbnail:thumbnail_id(url, alt_text),
        project_count:project(count)
      `)
      .eq('is_deleted', false)
      .order('title');

    if (error) {
      throw error;
    }

    // Filter companies that have at least one project
    const companiesWithProjects = (data || []).filter(company => {
      return company.project_count && company.project_count.length > 0 && company.project_count[0].count > 0;
    });

    return { data: companiesWithProjects, error: null };
  } catch (error) {
    console.error('Error fetching companies with projects:', error);
    return { data: [], error };
  }
};

/**
 * Get client companies only
 */
export const fetchClientCompanies = async () => {
  const { data, error } = await supabase
    .from('company')
    .select(`
      id,
      title,
      status,
      chip_color,
      brand:brand_id(id, title, primary_color),
      thumbnail:thumbnail_id(url, alt_text),
      project_count:project(count)
    `)
    .eq('is_client', true)
    .eq('is_deleted', false)
    .order('title');

  return { data, error };
};

/**
 * Get company hierarchy (parent-child relationships)
 */
export const fetchCompanyHierarchy = async (rootCompanyId = null) => {
  const buildHierarchy = async (parentId, level = 0) => {
    const { data: children, error } = await supabase
      .from('company')
      .select(`
        id,
        title,
        status,
        is_client,
        brand:brand_id(id, title),
        project_count:project(count)
      `)
      .eq('parent_id', parentId)
      .eq('is_deleted', false)
      .order('title');

    if (error || !children) return [];

    const hierarchy = [];
    for (const child of children) {
      const subChildren = await buildHierarchy(child.id, level + 1);
      hierarchy.push({
        ...child,
        level,
        children: subChildren
      });
    }

    return hierarchy;
  };

  const hierarchy = await buildHierarchy(rootCompanyId);
  return { data: hierarchy, error: null };
};

/**
 * Get child companies
 */
export const fetchChildCompanies = async (parentId) => {
  const { data, error } = await supabase
    .from('company')
    .select(`
      id,
      title,
      status,
      is_client,
      created_at,
      brand:brand_id(id, title),
      project_count:project(count)
    `)
    .eq('parent_id', parentId)
    .eq('is_deleted', false)
    .order('title');

  return { data, error };
};

/**
 * Link tags to company
 */
export const linkTagsToCompany = async (companyId, categoryIds) => {
  if (!Array.isArray(categoryIds)) {
    categoryIds = [categoryIds];
  }

  // Remove existing links first
  await supabase
    .from('category_company')
    .delete()
    .eq('company_id', companyId);

  // Add new links
  const insertData = categoryIds.map(categoryId => ({
    company_id: companyId,
    category_id: categoryId,
    created_at: new Date().toISOString()
  }));

  const { data, error } = await supabase
    .from('category_company')
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
 * Get company tags
 */
export const fetchCompanyTags = async (companyId) => {
  const { data, error } = await supabase
    .from('category_company')
    .select(`
      category:category_id(id, title)
    `)
    .eq('company_id', companyId);

  return { 
    data: data?.map(item => item.category) || [], 
    error 
  };
};

/**
 * Get company contacts
 */
export const fetchCompanyContacts = async (companyId) => {
  const { data, error } = await supabase
    .from('company_contact')
    .select(`
      contact:contact_id(
        id,
        title,
        email,
        phone,
        role,
        status
      )
    `)
    .eq('company_id', companyId);

  return { 
    data: data?.map(item => item.contact) || [], 
    error 
  };
};

/**
 * Link contacts to company
 */
export const linkContactsToCompany = async (companyId, contactIds) => {
  if (!Array.isArray(contactIds)) {
    contactIds = [contactIds];
  }

  // Remove existing links first
  await supabase
    .from('company_contact')
    .delete()
    .eq('company_id', companyId);

  // Add new links
  const insertData = contactIds.map(contactId => ({
    company_id: companyId,
    contact_id: contactId,
    created_at: new Date().toISOString()
  }));

  const { data, error } = await supabase
    .from('company_contact')
    .insert(insertData)
    .select(`
      contact:contact_id(id, title, email)
    `);

  return { 
    data: data?.map(item => item.contact) || [], 
    error 
  };
};

/**
 * Get company projects
 */
export const fetchCompanyProjects = async (companyId, includeArchived = false) => {
  let query = supabase
    .from('project')
    .select(`
      id,
      title,
      status,
      created_at,
      updated_at,
      progress,
      brand:brand_id(id, title)
    `)
    .eq('company_id', companyId)
    .eq('is_deleted', false);

  if (!includeArchived) {
    query = query.neq('status', 'archived');
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  return { data, error };
};

/**
 * Get company brands
 */
export const fetchCompanyBrands = async (companyId) => {
  const { data, error } = await supabase
    .from('brand')
    .select(`
      id,
      title,
      status,
      primary_color,
      secondary_color,
      primary_square_logo_media:media!primary_square_logo(url, alt_text)
    `)
    .eq('company_id', companyId)
    .eq('is_deleted', false)
    .order('status') // Primary brands first
    .order('created_at', { ascending: false });

  return { data, error };
};

/**
 * Get company's primary brand
 */
export const fetchCompanyPrimaryBrand = async (companyId) => {
  const { data, error } = await supabase
    .from('brand')
    .select('*')
    .eq('company_id', companyId)
    .eq('status', 'primary')
    .eq('is_deleted', false)
    .single();

  return { data, error };
};

/**
 * Update Google Drive integration for company
 */
export const updateCompanyDriveInfo = async (companyId, driveData) => {
  const { data, error } = await supabase
    .from('company')
    .update({
      drive_folder_id: driveData.folder_id,
      drive_original_name: driveData.original_name,
      updated_at: new Date().toISOString()
    })
    .eq('id', companyId)
    .select()
    .single();

  return { data, error };
};

/**
 * Search companies
 */
export const searchCompanies = async (searchTerm, filters = {}) => {
  let query = supabase
    .from('company')
    .select(`
      id,
      title,
      status,
      is_client,
      brand:brand_id(id, title),
      thumbnail:thumbnail_id(url, alt_text)
    `)
    .ilike('title', `%${searchTerm}%`)
    .eq('is_deleted', false);

  if (filters.is_client !== undefined) {
    query = query.eq('is_client', filters.is_client);
  }
  
  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query
    .order('title')
    .limit(20);

  return { data, error };
};

/**
 * Get company statistics
 */
export const getCompanyStats = async (companyId) => {
  // Get projects count by status
  const { data: projects, error: projectsError } = await supabase
    .from('project')
    .select('id, status')
    .eq('company_id', companyId)
    .eq('is_deleted', false);

  // Get contacts count
  const { data: contacts, error: contactsError } = await supabase
    .from('company_contact')
    .select('contact_id')
    .eq('company_id', companyId);

  // Get brands count
  const { data: brands, error: brandsError } = await supabase
    .from('brand')
    .select('id, status')
    .eq('company_id', companyId)
    .eq('is_deleted', false);

  if (projectsError || contactsError || brandsError) {
    return { 
      data: null, 
      error: projectsError || contactsError || brandsError 
    };
  }

  const stats = {
    totalProjects: projects?.length || 0,
    activeProjects: projects?.filter(p => p.status === 'active').length || 0,
    inProgressProjects: projects?.filter(p => p.status === 'in_progress').length || 0,
    archivedProjects: projects?.filter(p => p.status === 'archived').length || 0,
    totalContacts: contacts?.length || 0,
    totalBrands: brands?.length || 0,
    primaryBrands: brands?.filter(b => b.status === 'primary').length || 0
  };

  return { data: stats, error: null };
};

/**
 * Legacy function aliases for backward compatibility
 */
export const insertCompany = createCompany;
export const updateCompanyById = updateCompany;
export const deleteCompanyById = deleteCompany;

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
      companies:company_contact(
        company:company_id(
          id,
          title,
          status,
          brand:brand_id(id, title)
        )
      )
    `)
    .eq('supabase_user_id', user.id)
    .single();
};

/**
 * Get company basic info (for dropdowns) - lightweight version
 */
export const fetchCompanyBasicInfo = async (id) => {
  const { data, error } = await supabase
    .from('company')
    .select('id, title')
    .eq('id', id)
    .eq('is_deleted', false)
    .single();

  return { data, error };
};