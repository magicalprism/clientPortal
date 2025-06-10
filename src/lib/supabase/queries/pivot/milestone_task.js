// lib/supabase/queries/pivot/milestone_task.js
import { createClient } from '@/lib/supabase/browser';

/**
 * Fetch tasks assigned to specific milestones via milestone_task pivot
 * Groups results by milestone_id for kanban display
 * 
 * Used by:
 * - ProjectKanbanBoard (milestone mode task loading)
 * - Milestone detail pages
 * - Project timeline views
 * - Task distribution analytics
 * 
 * @param {number[]} milestoneIds - Array of milestone IDs to fetch tasks for
 * @param {number} projectId - Project ID to ensure tasks belong to correct project
 * @param {boolean} showCompleted - Whether to include completed tasks
 * @returns {Promise<{data, error}>} - Tasks grouped by milestone_id or error
 */
export const fetchTasksForMilestones = async (milestoneIds, projectId, showCompleted = false) => {
  if (!milestoneIds || milestoneIds.length === 0) {
    return { data: {}, error: null };
  }

  const supabase = createClient();
  
  let query = supabase
    .from('milestone_task')
    .select(`
      milestone_id,
      task:task_id(
        id,
        title,
        status,
        is_complete,
        order_index,
        assigned_id,
        due_date,
        start_date,
        task_type,
        content,
        project_id,
        company_id,
        urgency,
        ref_link
      )
    `)
    .in('milestone_id', milestoneIds);

  // Filter by project to ensure we only get tasks from this project
  if (projectId) {
    query = query.eq('task.project_id', projectId);
  }

  // Filter by completion status
  if (!showCompleted) {
    query = query.eq('task.is_complete', false);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching tasks for milestones:', error);
    return { data: {}, error };
  }

  // Group tasks by milestone_id
  const tasksByMilestone = {};
  data?.forEach(item => {
    if (item.task) {
      const milestoneId = item.milestone_id;
      if (!tasksByMilestone[milestoneId]) {
        tasksByMilestone[milestoneId] = [];
      }
      tasksByMilestone[milestoneId].push({
        ...item.task,
        milestone_id: milestoneId
      });
    }
  });

  // Sort tasks within each milestone by order_index
  Object.keys(tasksByMilestone).forEach(milestoneId => {
    tasksByMilestone[milestoneId].sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
  });

  return { data: tasksByMilestone, error: null };
};

/**
 * Move task between milestones (handles kanban drag-and-drop)
 * Removes from old milestone and adds to new milestone
 * 
 * Used by:
 * - ProjectKanbanBoard (milestone mode drag operations)
 * - Task reassignment interfaces
 * - Workflow management systems
 * 
 * @param {number} taskId - The task ID to move
 * @param {number|null} oldMilestoneId - Current milestone ID (null if not assigned)
 * @param {number|null} newMilestoneId - Target milestone ID (null to unassign)
 * @param {number} newOrderIndex - New position in the target milestone
 * @returns {Promise<{data, error}>} - Updated task data or error
 */
export const moveTaskToMilestone = async (taskId, oldMilestoneId, newMilestoneId, newOrderIndex) => {
  const supabase = createClient();
  
  try {
    // Start a transaction-like operation
    
    // 1. Remove task from old milestone (if exists)
    if (oldMilestoneId) {
      const { error: unlinkError } = await supabase
        .from('milestone_task')
        .delete()
        .eq('task_id', taskId)
        .eq('milestone_id', oldMilestoneId);
      
      if (unlinkError) throw unlinkError;
    }
    
    // 2. Add task to new milestone (if specified)
    if (newMilestoneId) {
      const { error: linkError } = await supabase
        .from('milestone_task')
        .insert({
          task_id: taskId,
          milestone_id: newMilestoneId
        });
      
      if (linkError) throw linkError;
    }
    
    // 3. Update task order
    const { data, error: updateError } = await supabase
      .from('task')
      .update({ 
        order_index: newOrderIndex,
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId)
      .select();
    
    if (updateError) throw updateError;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error moving task to milestone:', error);
    return { data: null, error };
  }
};

/**
 * Link task to milestone
 * 
 * Used by:
 * - Task creation with milestone assignment
 * - Task milestone assignment interfaces
 * - Bulk task operations
 * 
 * @param {number} taskId - The task ID
 * @param {number} milestoneId - The milestone ID
 * @returns {Promise<{data, error}>} - Created relationship or error
 */
export const linkTaskToMilestone = async (taskId, milestoneId) => {
  const supabase = createClient();
  
  // Check if relationship already exists
  const { data: existing } = await supabase
    .from('milestone_task')
    .select('id')
    .eq('task_id', taskId)
    .eq('milestone_id', milestoneId)
    .single();
    
  if (existing) {
    return { data: existing, error: null };
  }
  
  const { data, error } = await supabase
    .from('milestone_task')
    .insert({
      task_id: taskId,
      milestone_id: milestoneId
    })
    .select()
    .single();

  if (error) {
    console.error('Error linking task to milestone:', error);
  }

  return { data, error };
};

/**
 * Unlink task from milestone
 * 
 * Used by:
 * - Task milestone removal
 * - Task reassignment
 * - Milestone cleanup operations
 * 
 * @param {number} taskId - The task ID
 * @param {number} milestoneId - The milestone ID
 * @returns {Promise<{data, error}>} - Deletion result or error
 */
export const unlinkTaskFromMilestone = async (taskId, milestoneId) => {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('milestone_task')
    .delete()
    .eq('task_id', taskId)
    .eq('milestone_id', milestoneId)
    .select();

  if (error) {
    console.error('Error unlinking task from milestone:', error);
  }

  return { data, error };
};

/**
 * Fetch milestones for a specific task
 * 
 * Used by:
 * - Task detail pages showing milestone assignments
 * - Task milestone management interfaces
 * - Cross-milestone task reporting
 * 
 * @param {number} taskId - The task ID
 * @returns {Promise<{data, error}>} - Array of milestone objects or error
 */
export const fetchMilestonesForTask = async (taskId) => {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('milestone_task')
    .select(`
      milestone:milestone_id(
        id,
        title,
        description,
        status,
        order_index,
        due_date,
        start_date
      )
    `)
    .eq('task_id', taskId);

  if (error) {
    console.error('Error fetching milestones for task:', error);
    return { data: [], error };
  }

  return { 
    data: data?.map(item => item.milestone).filter(Boolean) || [], 
    error: null 
  };
};

/**
 * Bulk link multiple tasks to a milestone
 * 
 * Used by:
 * - Milestone task assignment
 * - Bulk task operations
 * - Project template applications
 * 
 * @param {number[]} taskIds - Array of task IDs
 * @param {number} milestoneId - The milestone ID
 * @returns {Promise<{data, error}>} - Created relationships or error
 */
export const bulkLinkTasksToMilestone = async (taskIds, milestoneId) => {
  const supabase = createClient();
  
  if (!taskIds || taskIds.length === 0) {
    return { data: [], error: null };
  }
  
  // Check for existing relationships
  const { data: existing } = await supabase
    .from('milestone_task')
    .select('task_id')
    .eq('milestone_id', milestoneId)
    .in('task_id', taskIds);
    
  const existingIds = existing?.map(item => item.task_id) || [];
  const newTaskIds = taskIds.filter(id => !existingIds.includes(id));
  
  if (newTaskIds.length === 0) {
    return { data: [], error: null };
  }
  
  const insertData = newTaskIds.map(taskId => ({
    task_id: taskId,
    milestone_id: milestoneId
  }));
  
  const { data, error } = await supabase
    .from('milestone_task')
    .insert(insertData)
    .select();

  if (error) {
    console.error('Error bulk linking tasks to milestone:', error);
  }

  return { data: data || [], error };
};

/**
 * Bulk unlink multiple tasks from a milestone
 * 
 * Used by:
 * - Milestone cleanup operations
 * - Task reassignment
 * - Milestone task management
 * 
 * @param {number[]} taskIds - Array of task IDs
 * @param {number} milestoneId - The milestone ID
 * @returns {Promise<{data, error}>} - Deletion result or error
 */
export const bulkUnlinkTasksFromMilestone = async (taskIds, milestoneId) => {
  const supabase = createClient();
  
  if (!taskIds || taskIds.length === 0) {
    return { data: [], error: null };
  }
  
  const { data, error } = await supabase
    .from('milestone_task')
    .delete()
    .eq('milestone_id', milestoneId)
    .in('task_id', taskIds)
    .select();

  if (error) {
    console.error('Error bulk unlinking tasks from milestone:', error);
  }

  return { data: data || [], error };
};