// lib/supabase/queries/table/milestone.js

import { createClient } from '@/lib/supabase/browser';

/**
 * Get a single milestone by ID
 */
export const fetchMilestoneById = async (id) => {
  const supabase = createClient();
  return await supabase
    .from('milestone')
    .select('id, title, description, status, created_at, updated_at')
    .eq('id', id)
    .single();
};

/**
 * Get all milestones
 */
export const fetchAllMilestones = async () => {
  const supabase = createClient();
  return await supabase
    .from('milestone')
    .select('id, title, description, status, created_at, updated_at')
    .order('title', { ascending: true });
};

/**
 * Insert a new milestone
 */
export const insertMilestone = async (milestoneData) => {
  const supabase = createClient();
  return await supabase
    .from('milestone')
    .insert(milestoneData)
    .select()
    .single();
};

/**
 * Update milestone by ID
 */
export const updateMilestoneById = async (id, updates) => {
  const supabase = createClient();
  return await supabase
    .from('milestone')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
};

/**
 * Update milestone order
 */
export const updateMilestoneOrder = async (id, newOrder) => {
  const supabase = createClient();
  return await supabase
    .from('milestone')
    .update({ order_index: newOrder })
    .eq('id', id);
};

/**
 * Delete milestone by ID
 */
export const deleteMilestoneById = async (id) => {
  const supabase = createClient();
  return await supabase
    .from('milestone')
    .delete()
    .eq('id', id);
};