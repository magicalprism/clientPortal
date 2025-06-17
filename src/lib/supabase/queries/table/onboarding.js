import { createClient } from '@/lib/supabase/browser';

const supabase = createClient();

/**
 * Get a single onboarding by ID
 */
export const fetchOnboardingById = async (id) => {
  return await supabase
    .from('onboarding')
    .select('*')
    .eq('id', id)
    .single();
};

/**
 * Get all onboardings
 */
export const fetchAllOnboardings = async () => {
  return await supabase
    .from('onboarding')
    .select('*')
    .order('created', { ascending: false });
};

/**
 * Get onboardings by company ID
 */
export const fetchOnboardingsByCompanyId = async (companyId) => {
  return await supabase
    .from('onboarding')
    .select('*')
    .eq('company_id', companyId)
    .order('created', { ascending: false });
};

/**
 * Get onboardings by project ID
 */
export const fetchOnboardingsByProjectId = async (projectId) => {
  return await supabase
    .from('onboarding')
    .select('*')
    .eq('project_id', projectId)
    .order('created', { ascending: false });
};

/**
 * Get onboardings by company and project IDs
 */
export const fetchOnboardingsByCompanyAndProjectIds = async (companyId, projectId) => {
  return await supabase
    .from('onboarding')
    .select('id')
    .eq('company_id', companyId)
    .eq('project_id', projectId);
};

/**
 * Get onboardings by author ID
 */
export const fetchOnboardingsByAuthorId = async (authorId) => {
  return await supabase
    .from('onboarding')
    .select('*')
    .eq('author_id', authorId)
    .order('created', { ascending: false });
};

/**
 * Get onboardings by status
 */
export const fetchOnboardingsByStatus = async (status) => {
  return await supabase
    .from('onboarding')
    .select('*')
    .eq('status', status)
    .order('created', { ascending: false });
};

/**
 * Create a new onboarding
 */
export const createOnboarding = async (onboardingData) => {
  return await supabase
    .from('onboarding')
    .insert(onboardingData)
    .select()
    .single();
};

/**
 * Update an onboarding by ID
 */
export const updateOnboardingById = async (id, updates) => {
  return await supabase
    .from('onboarding')
    .update(updates)
    .eq('id', id);
};

/**
 * Delete an onboarding by ID
 */
export const deleteOnboardingById = async (id) => {
  return await supabase
    .from('onboarding')
    .delete()
    .eq('id', id);
};

/**
 * Get onboarding with related data
 */
export const fetchOnboardingWithDetails = async (id) => {
  return await supabase
    .from('onboarding')
    .select(`
      *,
      company:company_id(*),
      project:project_id(*),
      author:author_id(*)
    `)
    .eq('id', id)
    .single();
};