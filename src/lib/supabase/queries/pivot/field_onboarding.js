import { createClient } from '@/lib/supabase/browser';

const supabase = createClient();

/**
 * Get fields for an onboarding
 */
export const fetchFieldsForOnboarding = async (onboardingId) => {
  const { data, error } = await supabase
    .from('field_onboarding')
    .select('field_id')
    .eq('onboarding_id', onboardingId);
  
  return { data, error };
};

/**
 * Get onboardings for a field
 */
export const fetchOnboardingsForField = async (fieldId) => {
  const { data, error } = await supabase
    .from('field_onboarding')
    .select('onboarding_id, onboarding:onboarding_id(*)')
    .eq('field_id', fieldId);
  
  return { 
    data: data?.map(item => item.onboarding) || [], 
    error 
  };
};

/**
 * Link a field to an onboarding
 */
export const linkFieldToOnboarding = async (fieldId, onboardingId, metadata = {}) => {
  const { data, error } = await supabase
    .from('field_onboarding')
    .insert({
      field_id: fieldId,
      onboarding_id: onboardingId,
      visible: metadata.visible ?? true
    });
  
  return { data, error };
};

/**
 * Unlink a field from an onboarding
 */
export const unlinkFieldFromOnboarding = async (fieldId, onboardingId) => {
  const { data, error } = await supabase
    .from('field_onboarding')
    .delete()
    .eq('field_id', fieldId)
    .eq('onboarding_id', onboardingId);
  
  return { data, error };
};

/**
 * Update field_onboarding relationship metadata
 */
export const updateFieldOnboarding = async (fieldId, onboardingId, updates) => {
  const { data, error } = await supabase
    .from('field_onboarding')
    .update(updates)
    .eq('field_id', fieldId)
    .eq('onboarding_id', onboardingId);
  
  return { data, error };
};

/**
 * Link multiple fields to an onboarding
 */
export const linkFieldsToOnboarding = async (fieldIds, onboardingId, metadata = {}) => {
  const inserts = fieldIds.map(fieldId => ({
    field_id: fieldId,
    onboarding_id: onboardingId,
    visible: metadata.visible ?? true
  }));

  const { data, error } = await supabase
    .from('field_onboarding')
    .insert(inserts);
  
  return { data, error };
};

/**
 * Link an onboarding to multiple fields
 */
export const linkOnboardingToFields = async (onboardingId, fieldIds, metadata = {}) => {
  return linkFieldsToOnboarding(fieldIds, onboardingId, metadata);
};

/**
 * Replace all field relationships for an onboarding
 */
export const replaceFieldsForOnboarding = async (fieldIds, onboardingId, metadata = {}) => {
  // First delete all existing relationships
  const { error: deleteError } = await supabase
    .from('field_onboarding')
    .delete()
    .eq('onboarding_id', onboardingId);
  
  if (deleteError) {
    return { data: null, error: deleteError };
  }
  
  // Then create new relationships
  if (fieldIds.length === 0) {
    return { data: [], error: null };
  }
  
  return linkFieldsToOnboarding(fieldIds, onboardingId, metadata);
};

/**
 * Replace all onboarding relationships for a field
 */
export const replaceOnboardingsForField = async (onboardingIds, fieldId, metadata = {}) => {
  // First delete all existing relationships
  const { error: deleteError } = await supabase
    .from('field_onboarding')
    .delete()
    .eq('field_id', fieldId);
  
  if (deleteError) {
    return { data: null, error: deleteError };
  }
  
  // Then create new relationships
  if (onboardingIds.length === 0) {
    return { data: [], error: null };
  }
  
  const inserts = onboardingIds.map(onboardingId => ({
    field_id: fieldId,
    onboarding_id: onboardingId,
    visible: metadata.visible ?? true
  }));

  const { data, error } = await supabase
    .from('field_onboarding')
    .insert(inserts);
  
  return { data, error };
};