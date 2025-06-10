// lib/supabase/queries/pivot/milestone_project.js
import { createClient } from '@/lib/supabase/browser';

/**
 * Fetch milestones for a specific project via milestone_project pivot
 * Returns milestones ordered by their order_index
 * 
 * Used by:
 * - ProjectKanbanBoard (milestone mode columns)
 * - Project milestone timeline views
 * - Project overview pages
 * - Milestone management interfaces
 * 
 * @param {number} projectId - The project ID to fetch milestones for
 * @returns {Promise<{data, error}>} - Array of milestone objects or error
 */
export const fetchMilestonesForProject = async (projectId) => {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('milestone_project')
    .select(`
      milestone:milestone_id(
        id, 
        title, 
        order_index,
        description,
        status,
        created_at,
        updated_at,
        due_date,
        start_date
      )
    `)
    .eq('project_id', projectId)
    .order('milestone.order_index', { ascending: true });

  if (error) {
    console.error('Error fetching milestones for project:', error);
    return { data: [], error };
  }

  return { 
    data: data?.map(item => item.milestone).filter(Boolean) || [], 
    error: null 
  };
};

/**
 * Link milestone to project
 * 
 * Used by:
 * - Project milestone assignment
 * - Milestone creation wizards
 * - Project template applications
 * 
 * @param {number} milestoneId - The milestone ID
 * @param {number} projectId - The project ID  
 * @returns {Promise<{data, error}>} - Created relationship or error
 */
export const linkMilestoneToProject = async (milestoneId, projectId) => {
  const supabase = createClient();
  
  // Check if relationship already exists
  const { data: existing } = await supabase
    .from('milestone_project')
    .select('id')
    .eq('milestone_id', milestoneId)
    .eq('project_id', projectId)
    .single();
    
  if (existing) {
    return { data: existing, error: null };
  }
  
  const { data, error } = await supabase
    .from('milestone_project')
    .insert({
      milestone_id: milestoneId,
      project_id: projectId
    })
    .select()
    .single();

  if (error) {
    console.error('Error linking milestone to project:', error);
  }

  return { data, error };
};

/**
 * Unlink milestone from project
 * 
 * Used by:
 * - Milestone removal from projects
 * - Project milestone management
 * - Milestone reassignment
 * 
 * @param {number} milestoneId - The milestone ID
 * @param {number} projectId - The project ID
 * @returns {Promise<{data, error}>} - Deletion result or error
 */
export const unlinkMilestoneFromProject = async (milestoneId, projectId) => {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('milestone_project')
    .delete()
    .eq('milestone_id', milestoneId)
    .eq('project_id', projectId)
    .select();

  if (error) {
    console.error('Error unlinking milestone from project:', error);
  }

  return { data, error };
};

/**
 * Fetch projects for a specific milestone
 * 
 * Used by:
 * - Milestone detail pages showing associated projects
 * - Cross-project milestone reporting
 * - Milestone usage analytics
 * 
 * @param {number} milestoneId - The milestone ID
 * @returns {Promise<{data, error}>} - Array of project objects or error
 */
export const fetchProjectsForMilestone = async (milestoneId) => {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('milestone_project')
    .select(`
      project:project_id(
        id,
        title,
        status,
        start_date,
        launch_date,
        company_id
      )
    `)
    .eq('milestone_id', milestoneId);

  if (error) {
    console.error('Error fetching projects for milestone:', error);
    return { data: [], error };
  }

  return { 
    data: data?.map(item => item.project).filter(Boolean) || [], 
    error: null 
  };
};

/**
 * Bulk link multiple milestones to a project
 * 
 * Used by:
 * - Project setup wizards
 * - Template applications
 * - Bulk milestone assignment
 * 
 * @param {number[]} milestoneIds - Array of milestone IDs
 * @param {number} projectId - The project ID
 * @returns {Promise<{data, error}>} - Created relationships or error
 */
export const bulkLinkMilestonesToProject = async (milestoneIds, projectId) => {
  const supabase = createClient();
  
  if (!milestoneIds || milestoneIds.length === 0) {
    return { data: [], error: null };
  }
  
  // Check for existing relationships
  const { data: existing } = await supabase
    .from('milestone_project')
    .select('milestone_id')
    .eq('project_id', projectId)
    .in('milestone_id', milestoneIds);
    
  const existingIds = existing?.map(item => item.milestone_id) || [];
  const newMilestoneIds = milestoneIds.filter(id => !existingIds.includes(id));
  
  if (newMilestoneIds.length === 0) {
    return { data: [], error: null };
  }
  
  const insertData = newMilestoneIds.map(milestoneId => ({
    milestone_id: milestoneId,
    project_id: projectId
  }));
  
  const { data, error } = await supabase
    .from('milestone_project')
    .insert(insertData)
    .select();

  if (error) {
    console.error('Error bulk linking milestones to project:', error);
  }

  return { data: data || [], error };
};

/**
 * Bulk unlink multiple milestones from a project
 * 
 * Used by:
 * - Project milestone cleanup
 * - Milestone reassignment
 * - Project template modifications
 * 
 * @param {number[]} milestoneIds - Array of milestone IDs
 * @param {number} projectId - The project ID
 * @returns {Promise<{data, error}>} - Deletion result or error
 */
export const bulkUnlinkMilestonesFromProject = async (milestoneIds, projectId) => {
  const supabase = createClient();
  
  if (!milestoneIds || milestoneIds.length === 0) {
    return { data: [], error: null };
  }
  
  const { data, error } = await supabase
    .from('milestone_project')
    .delete()
    .eq('project_id', projectId)
    .in('milestone_id', milestoneIds)
    .select();

  if (error) {
    console.error('Error bulk unlinking milestones from project:', error);
  }

  return { data: data || [], error };
};