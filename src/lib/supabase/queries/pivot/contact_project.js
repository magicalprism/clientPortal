import { createClient } from '@/lib/supabase/browser';

const supabase = createClient();

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

/**
 * Link a contact to a project
 */
export const linkContactToProject = async (contactId, projectId, metadata = {}) => {
  // Check if the relationship already exists
  const { data: existing } = await supabase
    .from('contact_project')
    .select('*')
    .eq('contact_id', contactId)
    .eq('project_id', projectId)
    .maybeSingle();

  if (existing) {
    // If it exists and we have metadata to update, update it
    if (Object.keys(metadata).length > 0) {
      return await supabase
        .from('contact_project')
        .update(metadata)
        .eq('contact_id', contactId)
        .eq('project_id', projectId)
        .select();
    }
    return { data: existing, error: null };
  }

  // Insert new relationship with optional metadata
  return await supabase
    .from('contact_project')
    .insert({ 
      contact_id: contactId, 
      project_id: projectId,
      ...metadata
    })
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
 * Update contact_project relationship metadata
 */
export const updateContactProject = async (contactId, projectId, metadata) => {
  return await supabase
    .from('contact_project')
    .update(metadata)
    .eq('contact_id', contactId)
    .eq('project_id', projectId);
};

/**
 * Batch link contacts to a project
 */
export const linkContactsToProject = async (contactIds, projectId, metadata = {}) => {
  if (!contactIds || !contactIds.length) {
    return { data: [], error: null };
  }

  const insertData = contactIds.map(contactId => ({
    contact_id: contactId,
    project_id: projectId,
    ...metadata
  }));

  return await supabase
    .from('contact_project')
    .upsert(insertData, { onConflict: ['contact_id', 'project_id'] })
    .select();
};

/**
 * Batch link projects to a contact
 */
export const linkProjectsToContact = async (projectIds, contactId, metadata = {}) => {
  if (!projectIds || !projectIds.length) {
    return { data: [], error: null };
  }

  const insertData = projectIds.map(projectId => ({
    contact_id: contactId,
    project_id: projectId,
    ...metadata
  }));

  return await supabase
    .from('contact_project')
    .upsert(insertData, { onConflict: ['contact_id', 'project_id'] })
    .select();
};

/**
 * Replace all contact relationships for a project
 */
export const replaceContactsForProject = async (contactIds, projectId, metadata = {}) => {
  // First delete all existing relationships
  const { error: deleteError } = await supabase
    .from('contact_project')
    .delete()
    .eq('project_id', projectId);

  if (deleteError) {
    return { data: null, error: deleteError };
  }

  // If no contacts to add, we're done
  if (!contactIds || !contactIds.length) {
    return { data: [], error: null };
  }

  // Add new relationships
  return await linkContactsToProject(contactIds, projectId, metadata);
};

/**
 * Replace all project relationships for a contact
 */
export const replaceProjectsForContact = async (projectIds, contactId, metadata = {}) => {
  // First delete all existing relationships
  const { error: deleteError } = await supabase
    .from('contact_project')
    .delete()
    .eq('contact_id', contactId);

  if (deleteError) {
    return { data: null, error: deleteError };
  }

  // If no projects to add, we're done
  if (!projectIds || !projectIds.length) {
    return { data: [], error: null };
  }

  // Add new relationships
  return await linkProjectsToContact(projectIds, contactId, metadata);
};

/**
 * Get contacts for a project with role filter
 */
export const fetchContactsForProjectByRole = async (projectId, role) => {
  return await supabase
    .from('contact_project')
    .select(`
      contact_id,
      contact:contact_id(*),
      role
    `)
    .eq('project_id', projectId)
    .eq('role', role);
};

/**
 * Get projects for a contact with role filter
 */
export const fetchProjectsForContactByRole = async (contactId, role) => {
  return await supabase
    .from('contact_project')
    .select(`
      project_id,
      project:project_id(*),
      role
    `)
    .eq('contact_id', contactId)
    .eq('role', role);
};