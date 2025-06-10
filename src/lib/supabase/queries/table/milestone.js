// lib/supabase/queries/table/milestone.js
import { createClient } from '@/lib/supabase/browser';

/**
 * Update milestone order index for drag-and-drop reordering
 * 
 * Used by:
 * - ProjectKanbanBoard (milestone mode drag operations)
 * - Any milestone reordering interface
 * 
 * @param {number} milestoneId - The milestone ID to update
 * @param {number} newOrderIndex - New position in the order
 * @returns {Promise<{data, error}>} - Updated milestone data or error
 */
export const updateMilestoneOrder = async (milestoneId, newOrderIndex) => {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('milestone')
    .update({ 
      order_index: newOrderIndex,
      updated_at: new Date().toISOString()
    })
    .eq('id', milestoneId)
    .select();

  if (error) {
    console.error('Error updating milestone order:', error);
  }

  return { data, error };
};

/**
 * Fetch milestone by ID with full details
 * 
 * Used by:
 * - Milestone detail pages
 * - Milestone edit modals
 * 
 * @param {number} milestoneId - The milestone ID
 * @returns {Promise<{data, error}>} - Milestone data or error
 */
export const fetchMilestoneById = async (milestoneId) => {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('milestone')
    .select('*')
    .eq('id', milestoneId)
    .single();

  if (error) {
    console.error('Error fetching milestone by ID:', error);
  }

  return { data, error };
};

/**
 * Update milestone details
 * 
 * Used by:
 * - Milestone edit forms
 * - CollectionModal for milestone updates
 * 
 * @param {number} milestoneId - The milestone ID
 * @param {Object} updateData - Fields to update
 * @returns {Promise<{data, error}>} - Updated milestone data or error
 */
export const updateMilestoneById = async (milestoneId, updateData) => {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('milestone')
    .update({
      ...updateData,
      updated_at: new Date().toISOString()
    })
    .eq('id', milestoneId)
    .select();

  if (error) {
    console.error('Error updating milestone:', error);
  }

  return { data, error };
};

/**
 * Create a new milestone
 * 
 * Used by:
 * - Milestone creation forms
 * - Project setup wizards
 * 
 * @param {Object} milestoneData - Milestone data to insert
 * @returns {Promise<{data, error}>} - Created milestone data or error
 */
export const insertMilestone = async (milestoneData) => {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('milestone')
    .insert({
      ...milestoneData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating milestone:', error);
  }

  return { data, error };
};

/**
 * Delete milestone by ID
 * 
 * Used by:
 * - Milestone management interfaces
 * - Project cleanup operations
 * 
 * @param {number} milestoneId - The milestone ID to delete
 * @returns {Promise<{data, error}>} - Deletion result or error
 */
export const deleteMilestoneById = async (milestoneId) => {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('milestone')
    .delete()
    .eq('id', milestoneId)
    .select();

  if (error) {
    console.error('Error deleting milestone:', error);
  }

  return { data, error };
};