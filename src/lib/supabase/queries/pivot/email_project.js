// src/lib/supabase/queries/pivot/email_project.js
import { createClient } from '@/lib/supabase/browser';

const supabase = createClient();

/**
 * Get all projects for an email
 */
export const fetchProjectsForEmail = async (emailId) => {
  const { data, error } = await supabase
    .from('email_project')
    .select(`
      project:project_id(id, title, status, company_id, company:company_id(id, title))
    `)
    .eq('email_id', emailId);

  if (error) {
    console.error('Error fetching projects for email:', error);
    return [];
  }

  return data?.map(row => row.project) || [];
};

/**
 * Get all emails for a project
 */
export const fetchEmailsForProject = async (projectId) => {
  const { data, error } = await supabase
    .from('email_project')
    .select(`
      email:email_id(id, title, summary, status, created_at, author:author_id(id, title))
    `)
    .eq('project_id', projectId);

  if (error) {
    console.error('Error fetching emails for project:', error);
    return [];
  }

  return data?.map(row => row.email) || [];
};

/**
 * Link an email to a project
 */
export const linkEmailToProject = async (emailId, projectId) => {
  // Check if the relationship already exists
  const { data: existing } = await supabase
    .from('email_project')
    .select('*')
    .eq('email_id', emailId)
    .eq('project_id', projectId)
    .maybeSingle();

  if (existing) {
    // Relationship already exists, no need to create it again
    return { data: existing, error: null };
  }

  // Create the relationship
  return await supabase
    .from('email_project')
    .insert({
      email_id: emailId,
      project_id: projectId,
      created_at: new Date().toISOString()
    });
};

/**
 * Unlink an email from a project
 */
export const unlinkEmailFromProject = async (emailId, projectId) => {
  return await supabase
    .from('email_project')
    .delete()
    .eq('email_id', emailId)
    .eq('project_id', projectId);
};

/**
 * Link an email to multiple projects
 */
export const linkEmailToProjects = async (emailId, projectIds) => {
  if (!projectIds || projectIds.length === 0) {
    return { data: null, error: null };
  }

  // Get existing relationships
  const { data: existing } = await supabase
    .from('email_project')
    .select('project_id')
    .eq('email_id', emailId);

  const existingProjectIds = existing?.map(row => row.project_id) || [];
  
  // Filter out projects that are already linked
  const newProjectIds = projectIds.filter(id => !existingProjectIds.includes(id));

  if (newProjectIds.length === 0) {
    return { data: null, error: null };
  }

  // Create new relationships
  const relationships = newProjectIds.map(projectId => ({
    email_id: emailId,
    project_id: projectId,
    created_at: new Date().toISOString()
  }));

  return await supabase
    .from('email_project')
    .insert(relationships);
};

/**
 * Update email-project relationships (replace all)
 */
export const updateEmailProjects = async (emailId, projectIds) => {
  // Delete all existing relationships
  await supabase
    .from('email_project')
    .delete()
    .eq('email_id', emailId);

  if (!projectIds || projectIds.length === 0) {
    return { data: null, error: null };
  }

  // Create new relationships
  const relationships = projectIds.map(projectId => ({
    email_id: emailId,
    project_id: projectId,
    created_at: new Date().toISOString()
  }));

  return await supabase
    .from('email_project')
    .insert(relationships);
};