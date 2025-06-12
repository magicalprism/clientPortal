// lib/supabase/queries/table/task.js

import { createClient } from '@/lib/supabase/browser';

const supabase = createClient();

/**
 * Get a single task by ID with full relations
 */
export const fetchTaskById = async (id) => {
  return await supabase
    .from('task')
    .select(`
      *,
      assigned_contact:assigned_id(
        id,
        title,
        first_name,
        last_name,
        thumbnail_media:thumbnail_id(
          id,
          url,
          alt_text
        )
      ),
      company:company_id(
        id,
        title
      ),
      project:project_id(
        id,
        title
      ),
      milestone:milestone_id(
        id,
        title
      )
    `)
    .eq('id', id)
    .single();
};

/**
 * Fetch tasks with enhanced filtering and relations
 */
export const fetchTasks = async ({
  projectId = null,
  ids = null,
  showCompleted = false,
  milestoneId = null,
  taskType = null,
  groupByStatus = false,
  status = null,
  parentId = null,
  isTemplate = null // ✅ Added template filtering
}) => {
  let query = supabase
    .from('task')
    .select(`
      id,
      title,
      status,
      task_type,
      priority,
      due_date,
      start_date,
      parent_id,
      milestone_id,
      project_id,
      company_id,
      assigned_id,
      order_index,
      created_at,
      updated_at,
      content,
      is_launch,
      all_day,
      is_template,
      estimated_duration,
      description,
      assigned_contact:assigned_id(
        id,
        title,
        first_name,
        last_name,
        email,
        thumbnail_media:thumbnail_id(
          id,
          url,
          alt_text
        )
      ),
      company:company_id(
        id,
        title
      ),
      project:project_id(
        id,
        title
      ),
      milestone:milestone_id(
        id,
        title
      )
    `)
    .eq('is_deleted', false);

  // Apply filters
  if (projectId) {
    query = query.eq('project_id', projectId);
  }
  
  if (ids && Array.isArray(ids)) {
    query = query.in('id', ids);
  }
  
  if (!showCompleted) {
    query = query.neq('status', 'complete');
  }
  
  if (milestoneId) {
    query = query.eq('milestone_id', milestoneId);
  }
  
  if (taskType) {
    query = query.eq('task_type', taskType);
  }
  
  if (status) {
    query = query.eq('status', status);
  }
  
  if (parentId !== null) {
    if (parentId === 'null' || parentId === 0) {
      query = query.is('parent_id', null);
    } else {
      query = query.eq('parent_id', parentId);
    }
  }

  // ✅ Added template filtering
  if (isTemplate !== null) {
    query = query.eq('is_template', isTemplate);
  }

  // Default ordering
  query = query.order('order_index', { ascending: true });
  query = query.order('due_date', { ascending: true, nullsFirst: false });
  query = query.order('created_at', { ascending: true });

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching tasks:', error);
    return { data: null, error };
  }

  // Group by status if requested (for support mode)
  if (groupByStatus) {
    const grouped = {};
    (data || []).forEach(task => {
      const statusKey = `status-${task.status}`;
      if (!grouped[statusKey]) {
        grouped[statusKey] = [];
      }
      grouped[statusKey].push(task);
    });
    return { data: grouped, error: null };
  }

  return { data: data || [], error: null };
};

/**
 * Move a task to a different milestone
 */
export const moveTaskToMilestone = async (taskId, milestoneId, newIndex = 0) => {
  const { error } = await supabase
    .from('task')
    .update({
      milestone_id: milestoneId,
      order_index: newIndex,
      updated_at: new Date().toISOString()
    })
    .eq('id', taskId);

  if (error) {
    console.error('Error moving task to milestone:', error);
    return { error };
  }

  return { error: null };
};

/**
 * Update task status and optionally reorder
 */
export const updateTaskStatus = async (taskId, newStatus, newIndex = null) => {
  const updateData = {
    status: newStatus,
    updated_at: new Date().toISOString()
  };

  if (newIndex !== null) {
    updateData.order_index = newIndex;
  }

  // Set completion timestamp if marking as complete
  if (newStatus === 'complete') {
    updateData.completed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('task')
    .update(updateData)
    .eq('id', taskId);

  if (error) {
    console.error('Error updating task status:', error);
    return { error };
  }

  return { error: null };
};

/**
 * Update task order within the same container
 */
export const updateTaskOrder = async (taskId, newIndex) => {
  const { error } = await supabase
    .from('task')
    .update({
      order_index: newIndex,
      updated_at: new Date().toISOString()
    })
    .eq('id', taskId);

  if (error) {
    console.error('Error updating task order:', error);
    return { error };
  }

  return { error: null };
};

/**
 * Quick complete/uncomplete a task
 */
export const toggleTaskComplete = async (taskId, currentStatus) => {
  const supabase = createClient();
  
  try {
    console.log('[toggleTaskComplete] Starting toggle for task:', taskId, 'current status:', currentStatus);
    
    // Determine new status
    const isCurrentlyComplete = currentStatus === 'complete';
    const newStatus = isCurrentlyComplete ? 'todo' : 'complete';
    
    console.log('[toggleTaskComplete] Setting new status to:', newStatus);
    
    // Update the task
    const { data, error } = await supabase
      .from('task')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId)
      .select('*')
      .single();
    
    if (error) {
      console.error('[toggleTaskComplete] Database error:', error);
      return { data: null, error };
    }
    
    console.log('[toggleTaskComplete] Task updated successfully:', data);
    
    // If marking as complete, also mark any subtasks as complete
    if (newStatus === 'complete') {
      const { error: subtaskError } = await supabase
        .from('task')
        .update({ 
          status: 'complete',
          updated_at: new Date().toISOString()
        })
        .eq('parent_id', taskId)
        .neq('status', 'complete'); // Only update non-complete subtasks
      
      if (subtaskError) {
        console.error('[toggleTaskComplete] Error updating subtasks:', subtaskError);
        // Don't fail the main operation, just log the error
      } else {
        console.log('[toggleTaskComplete] Subtasks marked as complete');
      }
    }
    
    // If marking as incomplete, also mark parent as incomplete if it was complete
    if (newStatus !== 'complete') {
      // Check if this task has a parent
      if (data.parent_id) {
        const { error: parentError } = await supabase
          .from('task')
          .update({ 
            status: 'in_progress', // Set parent to in_progress when child is incomplete
            updated_at: new Date().toISOString()
          })
          .eq('id', data.parent_id)
          .eq('status', 'complete'); // Only update if parent was complete
        
        if (parentError) {
          console.error('[toggleTaskComplete] Error updating parent task:', parentError);
          // Don't fail the main operation
        } else {
          console.log('[toggleTaskComplete] Parent task marked as in_progress');
        }
      }
    }
    
    return { data, error: null };
    
  } catch (err) {
    console.error('[toggleTaskComplete] Unexpected error:', err);
    return { data: null, error: err };
  }
};

/**
 * Create a new task
 */
export const createTask = async (taskData) => {
  const { data, error } = await supabase
    .from('task')
    .insert({
      ...taskData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select(`
      id,
      title,
      status,
      task_type,
      priority,
      due_date,
      parent_id,
      milestone_id,
      project_id,
      company_id,
      assigned_id,
      order_index,
      created_at,
      updated_at,
      is_template,
      estimated_duration,
      description,
      assigned_contact:assigned_id(
        id,
        title,
        first_name,
        last_name,
        thumbnail_media:thumbnail_id(
          id,
          url,
          alt_text
        )
      )
    `)
    .single();

  if (error) {
    console.error('Error creating task:', error);
    return { data: null, error };
  }

  return { data, error: null };
};

/**
 * Update a task
 */
export const updateTask = async (taskId, updateData) => {
  const { data, error } = await supabase
    .from('task')
    .update({
      ...updateData,
      updated_at: new Date().toISOString()
    })
    .eq('id', taskId)
    .select(`
      id,
      title,
      status,
      task_type,
      priority,
      due_date,
      parent_id,
      milestone_id,
      project_id,
      company_id,
      assigned_id,
      order_index,
      created_at,
      updated_at,
      is_template,
      estimated_duration,
      description,
      assigned_contact:assigned_id(
        id,
        title,
        first_name,
        last_name,
        thumbnail_media:thumbnail_id(
          id,
          url,
          alt_text
        )
      )
    `)
    .single();

  if (error) {
    console.error('Error updating task:', error);
    return { data: null, error };
  }

  return { data, error: null };
};

/**
 * Delete a task (soft delete)
 */
export const deleteTask = async (taskId) => {
  const { error } = await supabase
    .from('task')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', taskId);

  if (error) {
    console.error('Error deleting task:', error);
    return { error };
  }

  return { error: null };
};

/**
 * Fetch tasks for a specific milestone with hierarchy
 */
export const fetchTasksForMilestone = async (milestoneId, showCompleted = false) => {
  let query = supabase
    .from('task')
    .select(`
      id,
      title,
      status,
      task_type,
      priority,
      due_date,
      parent_id,
      milestone_id,
      order_index,
      is_template,
      estimated_duration,
      description,
      assigned_contact:assigned_id(
        id,
        title,
        first_name,
        last_name,
        thumbnail_media:thumbnail_id(
          id,
          url,
          alt_text
        )
      )
    `)
    .eq('milestone_id', milestoneId)
    .eq('is_deleted', false);

  if (!showCompleted) {
    query = query.neq('status', 'complete');
  }

  query = query.order('order_index', { ascending: true });
  query = query.order('created_at', { ascending: true });

  return await query;
};

/**
 * ✅ Enhanced: Fetch task templates with full hierarchy support
 */
export const fetchTaskTemplates = async (projectId = null, milestoneId = null) => {
  let query = supabase
    .from('task')
    .select(`
      id,
      title,
      status,
      task_type,
      priority,
      due_date,
      parent_id,
      milestone_id,
      project_id,
      company_id,
      assigned_id,
      order_index,
      is_template,
      estimated_duration,
      description,
      content,
      created_at,
      updated_at,
      milestone:milestone_id(
        id, 
        title,
        description,
        sort_order
      ),
      assignee:assigned_id(
        id, 
        title,
        first_name,
        last_name,
        thumbnail_media:thumbnail_id(
          id,
          url,
          alt_text
        )
      )
    `)
    .eq('is_template', true)
    .eq('is_deleted', false)
    .order('milestone_id', { ascending: true, nullsFirst: false })
    .order('order_index', { ascending: true })
    .order('created_at', { ascending: true });
    
  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  if (milestoneId) {
    query = query.eq('milestone_id', milestoneId);
  }
  
  return query;
};

/**
 * ✅ NEW: Create a task template with proper defaults
 */
export const createTaskTemplate = async (templateData) => {
  const defaultTemplateData = {
    is_template: true,
    status: 'todo',
    task_type: 'task',
    priority: 'medium',
    order_index: 0,
    ...templateData
  };

  return await createTask(defaultTemplateData);
};

/**
 * ✅ NEW: Toggle task completion and handle children automatically
 */
export const toggleTaskCompleteWithChildren = async (taskId, currentStatus) => {
  const newStatus = currentStatus === 'complete' ? 'todo' : 'complete';
  
  try {
    // Start a transaction-like operation
    const updates = [];

    // Update the main task
    const mainTaskUpdate = await toggleTaskComplete(taskId, currentStatus);
    if (mainTaskUpdate.error) {
      throw mainTaskUpdate.error;
    }
    updates.push(mainTaskUpdate.data);

    // If marking as complete, also complete all children
    if (newStatus === 'complete') {
      const { data: childTasks } = await supabase
        .from('task')
        .select('id, status')
        .eq('parent_id', taskId)
        .eq('is_deleted', false)
        .neq('status', 'complete');

      for (const child of childTasks || []) {
        const childUpdate = await toggleTaskComplete(child.id, child.status);
        if (childUpdate.data) {
          updates.push(childUpdate.data);
        }
      }
    }

    return { data: updates, error: null };
  } catch (error) {
    console.error('Error toggling task completion with children:', error);
    return { data: null, error };
  }
};

/**
 * ✅ NEW: Bulk update multiple tasks (for drag and drop operations)
 */
export const bulkUpdateTasks = async (taskUpdates) => {
  try {
    const updates = await Promise.all(
      taskUpdates.map(async ({ id, ...updateData }) => {
        const result = await updateTask(id, updateData);
        return result.data;
      })
    );

    return { data: updates.filter(Boolean), error: null };
  } catch (error) {
    console.error('Error in bulk task update:', error);
    return { data: null, error };
  }
};

/**
 * ✅ NEW: Move task and all children to new milestone
 */
export const moveTaskWithChildrenToMilestone = async (taskId, newMilestoneId, newIndex = 0) => {
  try {
    // Move the parent task
    const parentResult = await moveTaskToMilestone(taskId, newMilestoneId, newIndex);
    if (parentResult.error) {
      throw parentResult.error;
    }

    // Get all child tasks
    const { data: childTasks } = await supabase
      .from('task')
      .select('id')
      .eq('parent_id', taskId)
      .eq('is_deleted', false);

    // Move all children to the same milestone
    if (childTasks && childTasks.length > 0) {
      const childUpdates = childTasks.map((child, index) => 
        moveTaskToMilestone(child.id, newMilestoneId, newIndex + index + 1)
      );
      
      await Promise.all(childUpdates);
    }

    return { error: null };
  } catch (error) {
    console.error('Error moving task with children:', error);
    return { error };
  }
};

/**
 * ✅ NEW: Duplicate a task template (with or without children)
 */
export const duplicateTaskTemplate = async (originalTaskId, includeChildren = true, newMilestoneId = null) => {
  try {
    // Get original task
    const { data: originalTask, error: fetchError } = await fetchTaskById(originalTaskId);
    if (fetchError || !originalTask) {
      throw new Error('Could not fetch original task');
    }

    // Prepare new task data
    const {
      id,
      created_at,
      updated_at,
      ...taskData
    } = originalTask;

    const newTaskData = {
      ...taskData,
      title: `${taskData.title} (Copy)`,
      milestone_id: newMilestoneId || taskData.milestone_id,
      parent_id: null, // New copy starts as root level
      is_template: true
    };

    // Create the new task
    const { data: newTask, error: createError } = await createTaskTemplate(newTaskData);
    if (createError || !newTask) {
      throw new Error('Could not create new task');
    }

    // If including children, duplicate them too
    if (includeChildren) {
      const { data: childTasks } = await supabase
        .from('task')
        .select('*')
        .eq('parent_id', originalTaskId)
        .eq('is_deleted', false);

      if (childTasks && childTasks.length > 0) {
        for (const child of childTasks) {
          const {
            id: childId,
            created_at: childCreatedAt,
            updated_at: childUpdatedAt,
            parent_id,
            ...childData
          } = child;

          await createTaskTemplate({
            ...childData,
            title: `${childData.title} (Copy)`,
            parent_id: newTask.id,
            milestone_id: newMilestoneId || childData.milestone_id
          });
        }
      }
    }

    return { data: newTask, error: null };
  } catch (error) {
    console.error('Error duplicating task template:', error);
    return { data: null, error: error.message };
  }
};

/**
 * ✅ NEW: Get task hierarchy (parent and all children)
 */
export const fetchTaskHierarchy = async (taskId) => {
  try {
    // Get the main task
    const { data: mainTask, error: mainError } = await fetchTaskById(taskId);
    if (mainError || !mainTask) {
      throw new Error('Could not fetch main task');
    }

    // Get all descendants recursively
    const getAllDescendants = async (parentId, collected = []) => {
      const { data: children } = await supabase
        .from('task')
        .select(`
          id,
          title,
          status,
          parent_id,
          milestone_id,
          order_index,
          is_template,
          estimated_duration
        `)
        .eq('parent_id', parentId)
        .eq('is_deleted', false)
        .order('order_index', { ascending: true });

      if (children && children.length > 0) {
        collected.push(...children);
        
        // Recursively get children of children
        for (const child of children) {
          await getAllDescendants(child.id, collected);
        }
      }
      
      return collected;
    };

    const descendants = await getAllDescendants(taskId);

    return {
      data: {
        main: mainTask,
        children: descendants
      },
      error: null
    };
  } catch (error) {
    console.error('Error fetching task hierarchy:', error);
    return { data: null, error: error.message };
  }
};