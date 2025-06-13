// lib/supabase/queries/table/login.js

/*
REQUIRED SQL MIGRATIONS:

-- Add missing columns referenced in config
ALTER TABLE login ADD COLUMN IF NOT EXISTS order_index integer DEFAULT 0;
ALTER TABLE login ADD COLUMN IF NOT EXISTS project_id integer;
ALTER TABLE login ADD COLUMN IF NOT EXISTS thumbnail_id integer;

-- Update existing records to have proper order_index values (fixed SQL)
WITH ranked_logins AS (
  SELECT id, 
    ROW_NUMBER() OVER (
      PARTITION BY COALESCE(parent_id, company_id, 0) 
      ORDER BY COALESCE(created_at, NOW()), id
    ) - 1 as new_order_index
  FROM login 
  WHERE order_index = 0 OR order_index IS NULL
)
UPDATE login 
SET order_index = ranked_logins.new_order_index
FROM ranked_logins 
WHERE login.id = ranked_logins.id;
*/

import { createClient } from '@/lib/supabase/browser';
const supabase = createClient();

/**
 * Get a single login by ID with all related data
 */
export const fetchLoginById = async (id) => {
  const { data, error } = await supabase
    .from('login')
    .select(`
      *,
      company:company_id(id, title),
      project:project_id(id, title, status),
      author:author_id(id, title, email),
      parent:parent_id(id, title),
      resource:resource_id(id, title, description),
      link:link_id(id, title, url),
      thumbnail:thumbnail_id(id, url, alt_text),
      tags:category_login(
        category:category_id(id, title)
      ),
      child_logins:login!parent_id(id, title, status, order_index)
    `)
    .eq('id', id)
    .single();

  // Transform tags data
  if (data && data.tags) {
    data.tags = data.tags.map(t => t.category);
  }

  return { data, error };
};

/**
 * Get all logins with optional filters
 */
export const fetchAllLogins = async (filters = {}) => {
  let query = supabase
    .from('login')
    .select(`
      id,
      title,
      status,
      type,
      login_username,
      2fa,
      custom_link,
      order_index,
      created_at,
      updated_at,
      company:company_id(id, title),
      project:project_id(id, title, status),
      author:author_id(id, title),
      parent:parent_id(id, title),
      resource:resource_id(id, title),
      thumbnail:thumbnail_id(id, url, alt_text),
      child_count:login!parent_id(count)
    `)
    .eq('is_deleted', false);

  // Apply filters
  if (filters.search) {
    query = query.or(`title.ilike.%${filters.search}%,login_username.ilike.%${filters.search}%,content.ilike.%${filters.search}%`);
  }

  if (filters.status && filters.status.length > 0) {
    query = query.in('status', filters.status);
  }
  
  if (filters.type) {
    query = query.eq('type', filters.type);
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

  if (filters['2fa'] !== undefined) {
    query = query.eq('2fa', filters['2fa']);
  }

  // Apply sorting
  if (filters.sort) {
    const [field, direction] = filters.sort.split(':');
    query = query.order(field, { ascending: direction === 'asc' });
  } else {
    // Default sorting: by order_index, then by title
    query = query.order('order_index', { ascending: true, nullsFirst: false });
    query = query.order('title', { ascending: true });
  }

  const { data, error } = await query;
  return { data, error };
};

/**
 * Create a new login
 */
export const createLogin = async (loginData) => {
  // Get current max order_index for the parent/company combination
  let orderQuery = supabase
    .from('login')
    .select('order_index');

  if (loginData.parent_id) {
    orderQuery = orderQuery.eq('parent_id', loginData.parent_id);
  } else if (loginData.company_id) {
    orderQuery = orderQuery.eq('company_id', loginData.company_id);
  }

  const { data: existingLogins } = await orderQuery
    .order('order_index', { ascending: false })
    .limit(1);
    
  const nextOrderIndex = (existingLogins?.[0]?.order_index || -1) + 1;

  const { data, error } = await supabase
    .from('login')
    .insert([{
      ...loginData,
      status: loginData.status || 'todo',
      order_index: loginData.order_index ?? nextOrderIndex,
      '2fa': loginData['2fa'] ?? false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }])
    .select(`
      *,
      company:company_id(id, title),
      project:project_id(id, title),
      author:author_id(id, title),
      parent:parent_id(id, title),
      resource:resource_id(id, title)
    `)
    .single();

  return { data, error };
};

/**
 * Update login
 */
export const updateLogin = async (id, updates) => {
  const { data, error } = await supabase
    .from('login')
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
      parent:parent_id(id, title),
      resource:resource_id(id, title)
    `)
    .single();

  return { data, error };
};

/**
 * Delete login (soft delete)
 */
export const deleteLogin = async (id, softDelete = true) => {
  if (softDelete) {
    const { error } = await supabase
      .from('login')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
    return { success: !error, error };
  } else {
    const { error } = await supabase
      .from('login')
      .delete()
      .eq('id', id);
    return { success: !error, error };
  }
};

// ========== COMPANY/PROJECT RELATIONS ==========

/**
 * Get logins by company
 */
export const fetchLoginsByCompany = async (companyId) => {
  const { data, error } = await supabase
    .from('login')
    .select(`
      id,
      title,
      status,
      type,
      login_username,
      2fa,
      order_index,
      created_at,
      project:project_id(id, title),
      resource:resource_id(id, title)
    `)
    .eq('company_id', companyId)
    .eq('is_deleted', false)
    .order('order_index', { ascending: true, nullsFirst: false })
    .order('title', { ascending: true });

  return { data, error };
};

/**
 * Get logins by project
 */
export const fetchLoginsByProject = async (projectId) => {
  const { data, error } = await supabase
    .from('login')
    .select(`
      id,
      title,
      status,
      type,
      login_username,
      2fa,
      order_index,
      created_at,
      updated_at,
      company:company_id(id, title),
      resource:resource_id(id, title),
      child_count:login!parent_id(count)
    `)
    .eq('project_id', projectId)
    .eq('is_deleted', false)
    .order('order_index', { ascending: true, nullsFirst: false })
    .order('title', { ascending: true });

  return { data, error };
};

// ========== HIERARCHICAL MANAGEMENT ==========

/**
 * Get logins by parent (hierarchical)
 */
export const fetchLoginsByParent = async (parentId) => {
  const condition = parentId ? { parent_id: parentId } : { parent_id: null };

  const { data, error } = await supabase
    .from('login')
    .select(`
      id,
      title,
      status,
      type,
      login_username,
      2fa,
      order_index,
      created_at,
      updated_at,
      company:company_id(id, title),
      project:project_id(id, title),
      child_count:login!parent_id(count)
    `)
    .match(condition)
    .eq('is_deleted', false)
    .order('order_index', { ascending: true, nullsFirst: false })
    .order('title', { ascending: true });

  return { data, error };
};

/**
 * Get root-level logins (no parent)
 */
export const fetchRootLogins = async (companyId = null, projectId = null) => {
  let query = supabase
    .from('login')
    .select(`
      id,
      title,
      status,
      type,
      login_username,
      2fa,
      order_index,
      created_at,
      company:company_id(id, title),
      project:project_id(id, title),
      child_count:login!parent_id(count)
    `)
    .is('parent_id', null)
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
 * Get child logins
 */
export const fetchChildLogins = async (parentId) => {
  return await fetchLoginsByParent(parentId);
};

// ========== STATUS MANAGEMENT ==========

/**
 * Update login status
 */
export const updateLoginStatus = async (id, newStatus) => {
  const { data, error } = await supabase
    .from('login')
    .update({
      status: newStatus,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select('id, status')
    .single();

  return { data, error };
};

/**
 * Get logins by status
 */
export const fetchLoginsByStatus = async (status, companyId = null) => {
  let query = supabase
    .from('login')
    .select(`
      id,
      title,
      type,
      login_username,
      2fa,
      order_index,
      created_at,
      company:company_id(id, title),
      project:project_id(id, title)
    `)
    .eq('status', status)
    .eq('is_deleted', false);

  if (companyId) {
    query = query.eq('company_id', companyId);
  }

  query = query.order('order_index', { ascending: true, nullsFirst: false })
    .order('title', { ascending: true });

  const { data, error } = await query;
  return { data, error };
};

// ========== TYPE MANAGEMENT ==========

/**
 * Get logins by type
 */
export const fetchLoginsByType = async (type, companyId = null) => {
  let query = supabase
    .from('login')
    .select(`
      id,
      title,
      status,
      login_username,
      2fa,
      order_index,
      created_at,
      company:company_id(id, title),
      project:project_id(id, title)
    `)
    .eq('type', type)
    .eq('is_deleted', false);

  if (companyId) {
    query = query.eq('company_id', companyId);
  }

  query = query.order('order_index', { ascending: true, nullsFirst: false })
    .order('title', { ascending: true });

  const { data, error } = await query;
  return { data, error };
};

// ========== SECURITY FEATURES ==========

/**
 * Get logins with 2FA enabled
 */
export const fetchLoginsWithTwoFA = async (companyId = null) => {
  let query = supabase
    .from('login')
    .select(`
      id,
      title,
      status,
      type,
      login_username,
      order_index,
      created_at,
      company:company_id(id, title),
      project:project_id(id, title)
    `)
    .eq('2fa', true)
    .eq('is_deleted', false);

  if (companyId) {
    query = query.eq('company_id', companyId);
  }

  query = query.order('title');

  const { data, error } = await query;
  return { data, error };
};

/**
 * Toggle 2FA status for login
 */
export const toggleLogin2FA = async (id) => {
  // First get current 2FA status
  const { data: current } = await supabase
    .from('login')
    .select('2fa')
    .eq('id', id)
    .single();

  if (!current) {
    return { data: null, error: 'Login not found' };
  }

  const { data, error } = await supabase
    .from('login')
    .update({
      '2fa': !current['2fa'],
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select('id, 2fa')
    .single();

  return { data, error };
};

// ========== TAG MANAGEMENT ==========

/**
 * Link tags to login
 */
export const linkTagsToLogin = async (loginId, categoryIds) => {
  if (!Array.isArray(categoryIds)) {
    categoryIds = [categoryIds];
  }

  // Remove existing links first
  await supabase
    .from('category_login')
    .delete()
    .eq('login_id', loginId);

  // Add new links
  const insertData = categoryIds.map(categoryId => ({
    login_id: loginId,
    category_id: categoryId,
    created_at: new Date().toISOString()
  }));

  const { data, error } = await supabase
    .from('category_login')
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
 * Get login tags
 */
export const fetchLoginTags = async (loginId) => {
  const { data, error } = await supabase
    .from('category_login')
    .select(`
      category:category_id(id, title)
    `)
    .eq('login_id', loginId);

  return { 
    data: data?.map(item => item.category) || [], 
    error 
  };
};

// ========== REORDERING ==========

/**
 * Reorder logins within same container
 */
export const reorderLogins = async (containerId, loginOrders, containerType = 'parent') => {
  const containerField = containerType === 'parent' ? 'parent_id' : 
                        containerType === 'company' ? 'company_id' : 'project_id';
  
  const updates = loginOrders.map(({ id, order_index }) => 
    supabase
      .from('login')
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

/**
 * Move login to different parent/company/project
 */
export const moveLogin = async (loginId, newParentId = null, newCompanyId = null, newProjectId = null, newOrderIndex = null) => {
  // Get next order_index if not provided
  if (newOrderIndex === null) {
    let orderQuery = supabase
      .from('login')
      .select('order_index');

    if (newParentId) {
      orderQuery = orderQuery.eq('parent_id', newParentId);
    } else if (newCompanyId) {
      orderQuery = orderQuery.eq('company_id', newCompanyId);
    } else if (newProjectId) {
      orderQuery = orderQuery.eq('project_id', newProjectId);
    }

    const { data: existingLogins } = await orderQuery
      .order('order_index', { ascending: false })
      .limit(1);
      
    newOrderIndex = (existingLogins?.[0]?.order_index || -1) + 1;
  }

  const updateData = {
    order_index: newOrderIndex,
    updated_at: new Date().toISOString()
  };

  if (newParentId !== undefined) {
    updateData.parent_id = newParentId;
  }

  if (newCompanyId !== undefined) {
    updateData.company_id = newCompanyId;
  }

  if (newProjectId !== undefined) {
    updateData.project_id = newProjectId;
  }

  const { data, error } = await supabase
    .from('login')
    .update(updateData)
    .eq('id', loginId)
    .select('*')
    .single();

  return { data, error };
};

// ========== SEARCH ==========

/**
 * Search logins by title, username, or content
 */
export const searchLogins = async (searchTerm, filters = {}) => {
  let query = supabase
    .from('login')
    .select(`
      id,
      title,
      status,
      type,
      login_username,
      2fa,
      content,
      company:company_id(id, title),
      project:project_id(id, title)
    `)
    .eq('is_deleted', false);

  // Apply search
  if (searchTerm) {
    query = query.or(`title.ilike.%${searchTerm}%,login_username.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`);
  }

  // Apply additional filters
  if (filters.company_id) {
    query = query.eq('company_id', filters.company_id);
  }
  
  if (filters.project_id) {
    query = query.eq('project_id', filters.project_id);
  }
  
  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  
  if (filters.type) {
    query = query.eq('type', filters.type);
  }

  query = query.order('title');

  const { data, error } = await query;
  return { data, error };
};

// ========== UTILITY FUNCTIONS ==========

/**
 * Duplicate a login
 */
export const duplicateLogin = async (loginId, options = {}) => {
  const { newTitle, targetParentId, targetCompanyId, targetProjectId, includeTags = true } = options;

  // Get the original login
  const { data: originalLogin, error: fetchError } = await fetchLoginById(loginId);
  
  if (fetchError) {
    return { data: null, error: fetchError };
  }

  // Prepare new login data
  const { id, created_at, updated_at, tags, child_logins, ...loginData } = originalLogin;
  
  const newLoginData = {
    ...loginData,
    title: newTitle || `${originalLogin.title} (Copy)`,
    status: 'todo', // Reset status for copy
    parent_id: targetParentId !== undefined ? targetParentId : originalLogin.parent_id,
    company_id: targetCompanyId !== undefined ? targetCompanyId : originalLogin.company_id,
    project_id: targetProjectId !== undefined ? targetProjectId : originalLogin.project_id
  };

  // Create new login
  const { data: newLogin, error: createError } = await createLogin(newLoginData);
  
  if (createError) {
    return { data: null, error: createError };
  }

  // Copy tags if requested
  if (includeTags && tags && tags.length > 0) {
    await linkTagsToLogin(newLogin.id, tags.map(t => t.id));
  }

  return { data: newLogin, error: null };
};

/**
 * Get login statistics
 */
export const getLoginStats = async (companyId = null, projectId = null) => {
  let query = supabase
    .from('login')
    .select('id, status, type, 2fa')
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
    with2FA: data.filter(l => l['2fa']).length,
    without2FA: data.filter(l => !l['2fa']).length,
    byStatus: {}
  };

  // Get unique statuses and count them
  const statuses = [...new Set(data.map(l => l.status))];
  statuses.forEach(status => {
    stats.byStatus[status] = data.filter(l => l.status === status).length;
  });

  // Get unique types and count them
  const types = [...new Set(data.map(l => l.type).filter(Boolean))];
  stats.byType = {};
  types.forEach(type => {
    stats.byType[type] = data.filter(l => l.type === type).length;
  });

  stats.securityScore = stats.total > 0 ? 
    Math.round((stats.with2FA / stats.total) * 100) : 0;

  return { data: stats, error: null };
};