// lib/supabase/queries/table/contact.js

import { createClient } from '@/lib/supabase/browser';
const supabase = createClient();

/**
 * Get a single contact by ID with all related data
 */
export const fetchContactById = async (id) => {
  const { data, error } = await supabase
    .from('contact')
    .select(`
      *,
      thumbnail:thumbnail_id(id, url, alt_text),
      author:author_id(id, title, email),
      parent_contact:parent_id(id, title, email, role),
      child_contacts:contact!parent_id(id, title, email, role, status),
      companies:company_contact(
        company:company_id(id, title, status, is_client)
      ),
      projects:contact_project(
        project:project_id(id, title, status)
      ),
      tags:category_contact(
        category:category_id(id, title)
      ),
      authored_items:contact!author_id(count)
    `)
    .eq('id', id)
    .single();

  // Transform data for easier use
  if (data) {
    data.companies = data.companies?.map(c => c.company) || [];
    data.projects = data.projects?.map(p => p.project) || [];
    data.tags = data.tags?.map(t => t.category) || [];
  }

  return { data, error };
};

/**
 * Get all contacts with optional filters
 */
export const fetchAllContacts = async (filters = {}) => {
  let query = supabase
    .from('contact')
    .select(`
      id,
      title,
      first_name,
      last_name,
      email,
      role,
      status,
      is_assignable,
      created_at,
      updated_at,
      thumbnail:thumbnail_id(url, alt_text),
      author:author_id(id, title),
      parent_contact:parent_id(id, title),
      company_count:company_contact(count),
      project_count:contact_project(count)
    `);

  // Apply filters
  if (filters.search) {
    query = query.or(`title.ilike.%${filters.search}%,first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
  }
  
  if (filters.status && filters.status.length > 0) {
    query = query.in('status', filters.status);
  }
  
  if (filters.role && filters.role.length > 0) {
    query = query.in('role', filters.role);
  }
  
  if (filters.is_assignable !== undefined) {
    query = query.eq('is_assignable', filters.is_assignable);
  }
  
  if (filters.company_id) {
    query = query.in('id', 
      supabase
        .from('company_contact')
        .select('contact_id')
        .eq('company_id', filters.company_id)
    );
  }
  
  if (filters.project_id) {
    query = query.in('id', 
      supabase
        .from('contact_project')
        .select('contact_id')
        .eq('project_id', filters.project_id)
    );
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
 * Create a new contact
 */
export const createContact = async (contactData) => {
  // Generate full name from first/last if not provided
  let fullName = contactData.title;
  if (!fullName && (contactData.first_name || contactData.last_name)) {
    fullName = `${contactData.first_name || ''} ${contactData.last_name || ''}`.trim();
  }

  const { data, error } = await supabase
    .from('contact')
    .insert([{
      ...contactData,
      title: fullName,
      status: contactData.status || 'active',
      role: contactData.role || 'none',
      is_assignable: contactData.is_assignable !== undefined ? contactData.is_assignable : false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }])
    .select(`
      *,
      thumbnail:thumbnail_id(url, alt_text),
      author:author_id(id, title),
      parent_contact:parent_id(id, title)
    `)
    .single();

  return { data, error };
};

/**
 * Update a contact
 */
export const updateContact = async (id, updates) => {
  // Auto-generate title if first_name or last_name changed
  if (updates.first_name !== undefined || updates.last_name !== undefined) {
    const { data: currentContact } = await supabase
      .from('contact')
      .select('first_name, last_name')
      .eq('id', id)
      .single();

    if (currentContact) {
      const firstName = updates.first_name !== undefined ? updates.first_name : currentContact.first_name;
      const lastName = updates.last_name !== undefined ? updates.last_name : currentContact.last_name;
      updates.title = `${firstName || ''} ${lastName || ''}`.trim();
    }
  }

  const { data, error } = await supabase
    .from('contact')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select(`
      *,
      thumbnail:thumbnail_id(url, alt_text),
      author:author_id(id, title),
      parent_contact:parent_id(id, title)
    `)
    .single();

  return { data, error };
};

/**
 * Delete a contact (soft delete)
 */
export const deleteContact = async (id, softDelete = true) => {
  if (softDelete) {
    const { error } = await supabase
      .from('contact')
      .update({
        status: 'archived',
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
    return { success: !error, error };
  } else {
    const { error } = await supabase
      .from('contact')
      .delete()
      .eq('id', id);
    return { success: !error, error };
  }
};

/**
 * Get current contact ID from authenticated user
 */
export const getCurrentContactId = async () => {
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) return null;

  const { data: contact, error: contactError } = await supabase
    .from('contact')
    .select('id')
    .eq('email', user.email)
    .single();

  if (contactError || !contact) return null;

  return contact.id;
};

/**
 * Get current contact with full details
 */
export const getCurrentContact = async () => {
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) return { data: null, error: authError };

  const { data, error } = await supabase
    .from('contact')
    .select(`
      *,
      thumbnail:thumbnail_id(url, alt_text),
      companies:company_contact(
        company:company_id(id, title, status, is_client)
      ),
      projects:contact_project(
        project:project_id(id, title, status)
      )
    `)
    .eq('email', user.email)
    .single();

  // Transform data
  if (data) {
    data.companies = data.companies?.map(c => c.company) || [];
    data.projects = data.projects?.map(p => p.project) || [];
  }

  return { data, error };
};

/**
 * Get assignable contacts (for task assignment)
 */
export const fetchAssignableContacts = async (filters = {}) => {
  let query = supabase
    .from('contact')
    .select(`
      id,
      title,
      first_name,
      last_name,
      email,
      role,
      thumbnail:thumbnail_id(url, alt_text)
    `)
    .eq('is_assignable', true)
    .eq('status', 'active');

  if (filters.company_id) {
    query = query.in('id', 
      supabase
        .from('company_contact')
        .select('contact_id')
        .eq('company_id', filters.company_id)
    );
  }
  
  if (filters.project_id) {
    query = query.in('id', 
      supabase
        .from('contact_project')
        .select('contact_id')
        .eq('project_id', filters.project_id)
    );
  }

  const { data, error } = await query.order('title');
  return { data, error };
};

/**
 * Get contacts by company
 */
export const fetchContactsByCompany = async (companyId) => {
  const { data, error } = await supabase
    .from('company_contact')
    .select(`
      contact:contact_id(
        id,
        title,
        first_name,
        last_name,
        email,
        role,
        status,
        is_assignable,
        thumbnail:thumbnail_id(url, alt_text)
      )
    `)
    .eq('company_id', companyId);

  return { 
    data: data?.map(item => item.contact) || [], 
    error 
  };
};

/**
 * Get contacts by project
 */
export const fetchContactsByProject = async (projectId) => {
  const { data, error } = await supabase
    .from('contact_project')
    .select(`
      contact:contact_id(
        id,
        title,
        first_name,
        last_name,
        email,
        role,
        status,
        is_assignable,
        thumbnail:thumbnail_id(url, alt_text)
      )
    `)
    .eq('project_id', projectId);

  return { 
    data: data?.map(item => item.contact) || [], 
    error 
  };
};

/**
 * Link companies to contact
 */
export const linkCompaniesToContact = async (contactId, companyIds) => {
  if (!Array.isArray(companyIds)) {
    companyIds = [companyIds];
  }

  // Remove existing links first
  await supabase
    .from('company_contact')
    .delete()
    .eq('contact_id', contactId);

  // Add new links
  const insertData = companyIds.map(companyId => ({
    contact_id: contactId,
    company_id: companyId,
    created_at: new Date().toISOString()
  }));

  const { data, error } = await supabase
    .from('company_contact')
    .insert(insertData)
    .select(`
      company:company_id(id, title, status)
    `);

  return { 
    data: data?.map(item => item.company) || [], 
    error 
  };
};

/**
 * Link projects to contact
 */
export const linkProjectsToContact = async (contactId, projectIds) => {
  if (!Array.isArray(projectIds)) {
    projectIds = [projectIds];
  }

  // Remove existing links first
  await supabase
    .from('contact_project')
    .delete()
    .eq('contact_id', contactId);

  // Add new links
  const insertData = projectIds.map(projectId => ({
    contact_id: contactId,
    project_id: projectId,
    created_at: new Date().toISOString()
  }));

  const { data, error } = await supabase
    .from('contact_project')
    .insert(insertData)
    .select(`
      project:project_id(id, title, status)
    `);

  return { 
    data: data?.map(item => item.project) || [], 
    error 
  };
};

/**
 * Link tags to contact
 */
export const linkTagsToContact = async (contactId, categoryIds) => {
  if (!Array.isArray(categoryIds)) {
    categoryIds = [categoryIds];
  }

  // Remove existing links first
  await supabase
    .from('category_contact')
    .delete()
    .eq('contact_id', contactId);

  // Add new links
  const insertData = categoryIds.map(categoryId => ({
    contact_id: contactId,
    category_id: categoryId,
    created_at: new Date().toISOString()
  }));

  const { data, error } = await supabase
    .from('category_contact')
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
 * Get contact hierarchy (parent-child relationships)
 */
export const fetchContactHierarchy = async (rootContactId = null) => {
  const buildHierarchy = async (parentId, level = 0) => {
    const { data: children, error } = await supabase
      .from('contact')
      .select(`
        id,
        title,
        email,
        role,
        status,
        is_assignable
      `)
      .eq('parent_id', parentId)
      .eq('status', 'active')
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

  const hierarchy = await buildHierarchy(rootContactId);
  return { data: hierarchy, error: null };
};

/**
 * Get child contacts
 */
export const fetchChildContacts = async (parentId) => {
  const { data, error } = await supabase
    .from('contact')
    .select(`
      id,
      title,
      email,
      role,
      status,
      is_assignable,
      thumbnail:thumbnail_id(url, alt_text)
    `)
    .eq('parent_id', parentId)
    .eq('status', 'active')
    .order('title');

  return { data, error };
};

/**
 * Get contacts by role
 */
export const fetchContactsByRole = async (role) => {
  const { data, error } = await supabase
    .from('contact')
    .select(`
      id,
      title,
      email,
      role,
      status,
      is_assignable,
      thumbnail:thumbnail_id(url, alt_text),
      company_count:company_contact(count)
    `)
    .eq('role', role)
    .eq('status', 'active')
    .order('title');

  return { data, error };
};

/**
 * Get admin contacts
 */
export const fetchAdminContacts = async () => {
  const { data, error } = await supabase
    .from('contact')
    .select(`
      id,
      title,
      email,
      role,
      thumbnail:thumbnail_id(url, alt_text)
    `)
    .eq('role', 'super-admin')
    .eq('status', 'active')
    .order('title');

  return { data, error };
};

/**
 * Search contacts
 */
export const searchContacts = async (searchTerm, filters = {}) => {
  let query = supabase
    .from('contact')
    .select(`
      id,
      title,
      first_name,
      last_name,
      email,
      role,
      status,
      thumbnail:thumbnail_id(url, alt_text)
    `)
    .or(`title.ilike.%${searchTerm}%,first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
    .eq('status', 'active');

  if (filters.role) {
    query = query.eq('role', filters.role);
  }
  
  if (filters.is_assignable !== undefined) {
    query = query.eq('is_assignable', filters.is_assignable);
  }

  const { data, error } = await query
    .order('title')
    .limit(20);

  return { data, error };
};

/**
 * Check if contact has permission
 */
export const checkContactPermission = async (contactId, permission) => {
  const { data: contact, error } = await supabase
    .from('contact')
    .select('role, status')
    .eq('id', contactId)
    .single();

  if (error || !contact) {
    return { hasPermission: false, error };
  }

  // Define permission hierarchy
  const permissions = {
    'super-admin': ['read', 'write', 'delete', 'admin'],
    'staff': ['read', 'write'],
    'user': ['read'],
    'none': []
  };

  const hasPermission = contact.status === 'active' && 
    permissions[contact.role]?.includes(permission);

  return { hasPermission, error: null };
};

/**
 * Get contact activity/stats
 */
export const getContactStats = async (contactId) => {
  // Get items authored by this contact
  const { data: authoredItems, error: authoredError } = await supabase
    .rpc('get_authored_items_count', { contact_id: contactId });

  // Get tasks assigned to this contact
  const { data: assignedTasks, error: tasksError } = await supabase
    .from('task')
    .select('id, status')
    .eq('assigned_id', contactId);

  if (authoredError || tasksError) {
    return { data: null, error: authoredError || tasksError };
  }

  const stats = {
    authoredItems: authoredItems || 0,
    totalTasks: assignedTasks?.length || 0,
    completedTasks: assignedTasks?.filter(t => t.status === 'complete').length || 0,
    pendingTasks: assignedTasks?.filter(t => t.status === 'todo' || t.status === 'in_progress').length || 0
  };

  return { data: stats, error: null };
};

/**
 * Activate/Deactivate contact
 */
export const toggleContactStatus = async (contactId) => {
  const { data: currentContact, error: fetchError } = await supabase
    .from('contact')
    .select('status')
    .eq('id', contactId)
    .single();

  if (fetchError) {
    return { data: null, error: fetchError };
  }

  const newStatus = currentContact.status === 'active' ? 'archived' : 'active';

  const { data, error } = await updateContact(contactId, { status: newStatus });
  return { data, error };
};