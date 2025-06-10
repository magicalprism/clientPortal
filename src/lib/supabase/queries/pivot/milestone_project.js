// lib/supabase/queries/pivot/milestone_project.js

import { createClient } from '@/lib/supabase/browser';

/**
 * Get all milestones for a project (via pivot)
 */
export const fetchMilestonesForProject = async (projectId) => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('milestone_project')
    .select(`
      milestone_id,
      order_index,
      milestone:milestone_id(
        id,
        title,
        description,
        status,
        created_at
      )
    `)
    .eq('project_id', projectId)
    .order('order_index', { ascending: true });

  if (error) return { data: [], error };

  // Transform the data to include order_index on the milestone object
  const milestones = (data || []).map(row => ({
    ...row.milestone,
    order_index: row.order_index || 0
  }));

  return { data: milestones, error: null };
};

/**
 * Get all projects for a milestone (via pivot)
 */
export const fetchProjectsForMilestone = async (milestoneId) => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('milestone_project')
    .select(`
      project_id,
      order_index,
      project:project_id(
        id,
        title,
        status,
        created_at
      )
    `)
    .eq('milestone_id', milestoneId);

  if (error) return { data: [], error };

  const projects = (data || []).map(row => row.project);
  return { data: projects, error: null };
};

/**
 * Link a milestone to a project
 */
export const linkMilestoneToProject = async (milestoneId, projectId, orderIndex = 0) => {
  const supabase = createClient();
  
  // Check if relationship already exists
  const { data: existing } = await supabase
    .from('milestone_project')
    .select('*')
    .eq('milestone_id', milestoneId)
    .eq('project_id', projectId)
    .single();

  if (existing) {
    return { data: existing, error: null };
  }

  return await supabase
    .from('milestone_project')
    .insert({
      milestone_id: milestoneId,
      project_id: projectId,
      order_index: orderIndex
    })
    .select()
    .single();
};

/**
 * Unlink a milestone from a project
 */
export const unlinkMilestoneFromProject = async (milestoneId, projectId) => {
  const supabase = createClient();
  return await supabase
    .from('milestone_project')
    .delete()
    .eq('milestone_id', milestoneId)
    .eq('project_id', projectId);
};

/**
 * Update milestone order within a project
 */
export const updateMilestoneOrder = async (milestoneId, projectId, newOrder) => {
  const supabase = createClient();
  return await supabase
    .from('milestone_project')
    .update({ order_index: newOrder })
    .eq('milestone_id', milestoneId)
    .eq('project_id', projectId);
};

/**
 * Update all milestone orders for a project
 */
export const updateMilestoneOrders = async (projectId, milestoneOrders) => {
  const supabase = createClient();
  
  const updates = milestoneOrders.map(({ milestoneId, order }) => 
    supabase
      .from('milestone_project')
      .update({ order_index: order })
      .eq('milestone_id', milestoneId)
      .eq('project_id', projectId)
  );

  return await Promise.all(updates);
};