// lib/supabase/queries/table/task.js
import { createClient } from '@/lib/supabase/browser';

/**
 * Update task order index for drag-and-drop reordering within containers
 * 
 * Used by:
 * - ProjectKanbanBoard (both milestone and support modes)
 * - ChecklistView task reordering
 * - Any task list with sortable functionality
 * 
 * @param {number} taskId - The task ID to update
 * @param {number} newOrderIndex - New position in the order
 * @returns {Promise<{data, error}>} - Updated task data or error
 */
export const updateTaskOrder = async (taskId, newOrderIndex) => {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('task')
    .update({ 
      order_index: newOrderIndex,
      updated_at: new Date().toISOString()
    })
    .eq('id', taskId)
    .select();

  if (error) {
    console.error('Error updating task order:', error);
  }

  return { data, error };
};

/**
 * Update task status and optionally reorder (for support mode kanban)
 * 
 * Used by:
 * - ProjectKanbanBoard (support mode drag between status columns)
 * - Task status update forms
 * - Workflow automation
 * 
 * @param {number} taskId - The task ID to update
 * @param {string} newStatus - New status value
 * @param {number} newOrderIndex - Optional new position in the order
 * @returns {Promise<{data, error}>} - Updated task data or error
 */
export const updateTaskStatus = async (taskId, newStatus, newOrderIndex = null) => {
  const supabase = createClient();
  
  const updateData = { 
    status: newStatus,
    updated_at: new Date().toISOString()
  };
  
  if (newOrderIndex !== null) {
    updateData.order_index = newOrderIndex;
  }
  
  const { data, error } = await supabase
    .from('task')
    .update(updateData)
    .eq('id', taskId)
    .select();

  if (error) {
    console.error('Error updating task status:', error);
  }

  return { data, error };
};

/**
 * Fetch support tasks for a project (tasks with task_type='support')
 * Groups results by status for kanban display
 * 
 * Used by:
 * - ProjectKanbanBoard (support mode)
 * - Support ticket dashboards
 * - Help desk interfaces
 * 
 * @param {number} projectId - The project ID to filter by
 * @param {boolean} showCompleted - Whether to include completed tasks
 * @returns {Promise<{data, error}>} - Tasks grouped by status or error
 */
export const fetchSupportTasks = async (projectId, showCompleted = false) => {
  const supabase = createClient();
  
  let query = supabase
    .from('task')
    .select(`
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
    `)
    .eq('project_id', projectId)
    .eq('task_type', 'support');

  if (!showCompleted) {
    query = query.eq('is_complete', false);
  }

  const { data, error } = await query.order('order_index', { ascending: true });

  if (error) {
    console.error('Error fetching support tasks:', error);
    return { data: [], error };
  }

  // Group tasks by status for kanban display
  const tasksByStatus = {};
  data?.forEach(task => {
    const status = task.status || 'todo';
    if (!tasksByStatus[status]) {
      tasksByStatus[status] = [];
    }
    tasksByStatus[status].push(task);
  });

  return { data: tasksByStatus, error: null };
};

/**
 * Create a new task with optional milestone linking
 * 
 * Used by:
 * - ProjectKanbanBoard (task creation in both modes)
 * - CollectionModal for task creation
 * - Quick task creation forms
 * 
 * @param {Object} taskData - Task data to insert
 * @param {number|null} milestoneId - Optional milestone ID to link to
 * @returns {Promise<{data, error}>} - Created task data or error
 */
export const createTask = async (taskData, milestoneId = null) => {
  const supabase = createClient();
  
  try {
    // 1. Create the task
    const { data: task, error: taskError } = await supabase
      .from('task')
      .insert({
        ...taskData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (taskError) throw taskError;
    
    // 2. Link to milestone if provided (this will be handled by milestone_task pivot queries)
    if (milestoneId && task.id) {
      const { error: linkError } = await supabase
        .from('milestone_task')
        .insert({
          task_id: task.id,
          milestone_id: milestoneId
        });
      
      if (linkError) {
        console.error('Error linking task to milestone:', linkError);
        // Task created successfully but linking failed
        // Could implement rollback here if needed
      }
    }
    
    return { data: task, error: null };
  } catch (error) {
    console.error('Error creating task:', error);
    return { data: null, error };
  }
};

/**
 * Fetch task by ID with full details
 * 
 * Used by:
 * - Task detail pages
 * - Task edit modals
 * - Task quick views
 * 
 * @param {number} taskId - The task ID
 * @returns {Promise<{data, error}>} - Task data or error
 */
export const fetchTaskById = async (taskId) => {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('task')
    .select('*')
    .eq('id', taskId)
    .single();

  if (error) {
    console.error('Error fetching task by ID:', error);
  }

  return { data, error };
};

/**
 * Update task by ID
 * 
 * Used by:
 * - Task edit forms
 * - CollectionModal for task updates
 * - Quick task property updates
 * 
 * @param {number} taskId - The task ID
 * @param {Object} updateData - Fields to update
 * @returns {Promise<{data, error}>} - Updated task data or error
 */
export const updateTaskById = async (taskId, updateData) => {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('task')
    .update({
      ...updateData,
      updated_at: new Date().toISOString()
    })
    .eq('id', taskId)
    .select();

  if (error) {
    console.error('Error updating task:', error);
  }

  return { data, error };
};

/**
 * Fetch tasks for a specific project
 * 
 * Used by:
 * - Project overview pages
 * - Project task lists
 * - Task reporting and analytics
 * 
 * @param {number} projectId - The project ID
 * @param {Object} filters - Optional filters (status, task_type, assigned_id, etc.)
 * @returns {Promise<{data, error}>} - Array of tasks or error
 */
export const fetchTasksForProject = async (projectId, filters = {}) => {
  const supabase = createClient();
  
  let query = supabase
    .from('task')
    .select('*')
    .eq('project_id', projectId);

  // Apply filters dynamically
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        query = query.in(key, value);
      } else {
        query = query.eq(key, value);
      }
    }
  });

  const { data, error } = await query.order('order_index', { ascending: true });

  if (error) {
    console.error('Error fetching tasks for project:', error);
  }

  return { data: data || [], error };
};

/**
 * Delete task by ID
 * 
 * Used by:
 * - Task management interfaces
 * - Project cleanup operations
 * 
 * @param {number} taskId - The task ID to delete
 * @returns {Promise<{data, error}>} - Deletion result or error
 */
export const deleteTaskById = async (taskId) => {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('task')
    .delete()
    .eq('id', taskId)
    .select();

  if (error) {
    console.error('Error deleting task:', error);
  }

  return { data, error };
};

/**
 * Toggle task completion status
 * 
 * Used by:
 * - Task checkboxes
 * - Quick completion actions
 * - Bulk task operations
 * 
 * @param {number} taskId - The task ID
 * @param {boolean} isComplete - New completion status
 * @returns {Promise<{data, error}>} - Updated task data or error
 */
export const toggleTaskCompletion = async (taskId, isComplete) => {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('task')
    .update({ 
      is_complete: isComplete,
      updated_at: new Date().toISOString()
    })
    .eq('id', taskId)
    .select();

  if (error) {
    console.error('Error toggling task completion:', error);
  }

  return { data, error };
};