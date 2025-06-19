// src/lib/supabase/queries/table/email.js
import { createClient } from '@/lib/supabase/browser';

const supabase = createClient();

/**
 * Get a single email by ID
 */
export const fetchEmailById = async (id) => {
  return await supabase
    .from('email')
    .select(`
      *,
      author:author_id(id, title, email),
      company:company_id(id, title),
      parent:parent_id(id, title)
    `)
    .eq('id', id)
    .single();
};

/**
 * Get all emails with optional filters
 */
export const fetchAllEmails = async (filters = {}) => {
  let query = supabase
    .from('email')
    .select(`
      *,
      author:author_id(id, title, email),
      company:company_id(id, title)
    `);

  // Apply filters
  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  if (filters.company_id) {
    query = query.eq('company_id', filters.company_id);
  }

  if (filters.search) {
    query = query.or(`title.ilike.%${filters.search}%,summary.ilike.%${filters.search}%`);
  }

  // Handle deleted items
  if (filters.is_deleted === true) {
    query = query.eq('is_deleted', true);
  } else {
    query = query.eq('is_deleted', false);
  }

  // Apply sorting
  const sortField = filters.sort?.split(':')[0] || 'created_at';
  const sortOrder = filters.sort?.split(':')[1] || 'desc';
  query = query.order(sortField, { ascending: sortOrder === 'asc' });

  return await query;
};

/**
 * Get unsorted emails (for organize-email page)
 */
export const fetchUnsortedEmails = async () => {
  return await supabase
    .from('email')
    .select(`
      *,
      author:author_id(id, title, email),
      company:company_id(id, title)
    `)
    .in('status', ['unsorted', 'pending'])
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });
};

/**
 * Insert a new email
 */
export const insertEmail = async (data) => {
  return await supabase
    .from('email')
    .insert({
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_deleted: false
    });
};

/**
 * Update an email by ID
 */
export const updateEmailById = async (id, data) => {
  return await supabase
    .from('email')
    .update({
      ...data,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);
};

/**
 * Soft delete an email by ID
 */
export const deleteEmailById = async (id) => {
  return await supabase
    .from('email')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', id);
};

/**
 * Hard delete an email by ID (use with caution)
 */
export const hardDeleteEmailById = async (id) => {
  return await supabase
    .from('email')
    .delete()
    .eq('id', id);
};

/**
 * Get emails by company ID
 */
export const fetchEmailsByCompanyId = async (companyId) => {
  return await supabase
    .from('email')
    .select(`
      *,
      author:author_id(id, title, email)
    `)
    .eq('company_id', companyId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });
};

/**
 * Get emails by author ID
 */
export const fetchEmailsByAuthorId = async (authorId) => {
  return await supabase
    .from('email')
    .select(`
      *,
      company:company_id(id, title)
    `)
    .eq('author_id', authorId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });
};

/**
 * Get emails by project ID (via junction table)
 */
export const fetchEmailsByProjectId = async (projectId) => {
  const { data: emailIds } = await supabase
    .from('email_project')
    .select('email_id')
    .eq('project_id', projectId);
  
  if (!emailIds || emailIds.length === 0) {
    return { data: [] };
  }
  
  return await supabase
    .from('email')
    .select(`
      *,
      author:author_id(id, title, email),
      company:company_id(id, title)
    `)
    .in('id', emailIds.map(item => item.email_id))
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });
};

/**
 * Get emails by contact ID (via junction table)
 */
export const fetchEmailsByContactId = async (contactId) => {
  const { data: emailIds } = await supabase
    .from('contact_email')
    .select('email_id')
    .eq('contact_id', contactId);
  
  if (!emailIds || emailIds.length === 0) {
    return { data: [] };
  }
  
  return await supabase
    .from('email')
    .select(`
      *,
      author:author_id(id, title, email),
      company:company_id(id, title)
    `)
    .in('id', emailIds.map(item => item.email_id))
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });
};