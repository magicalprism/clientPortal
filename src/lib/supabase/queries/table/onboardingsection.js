import { createClient } from '@/lib/supabase/browser';

const supabase = createClient();

/**
 * Get a single onboarding section by ID
 */
export const fetchOnboardingSectionById = async (id) => {
  return await supabase
    .from('onboardingsection')
    .select('*')
    .eq('id', id)
    .single();
};

/**
 * Get all onboarding sections
 */
export const fetchAllOnboardingSections = async () => {
  return await supabase
    .from('onboardingsection')
    .select('*')
    .order('title');
};

/**
 * Get onboarding sections with their fields
 */
export const fetchOnboardingSectionsWithFields = async () => {
  return await supabase
    .from('onboardingsection')
    .select(`
      id,
      title,
      field_onboardingsection (
        order,
        field (
          id,
          title
        )
      )
    `);
};

/**
 * Get onboarding sections for a specific onboarding
 */
export const fetchOnboardingSectionsForOnboarding = async (onboardingId) => {
  return await supabase
    .from('onboardingsection')
    .select(`
      id,
      title,
      field_onboardingsection (
        order,
        field (
          id,
          title
        )
      )
    `)
    .eq('onboarding_id', onboardingId);
};

/**
 * Create a new onboarding section
 */
export const createOnboardingSection = async (sectionData) => {
  return await supabase
    .from('onboardingsection')
    .insert(sectionData)
    .select()
    .single();
};

/**
 * Update an onboarding section by ID
 */
export const updateOnboardingSectionById = async (id, updates) => {
  return await supabase
    .from('onboardingsection')
    .update(updates)
    .eq('id', id);
};

/**
 * Delete an onboarding section by ID
 */
export const deleteOnboardingSectionById = async (id) => {
  return await supabase
    .from('onboardingsection')
    .delete()
    .eq('id', id);
};