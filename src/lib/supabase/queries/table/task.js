import { createClient } from '@/lib/supabase/browser';

const supabase = createClient();

// ===============================
// CORE CRUD OPERATIONS
// ===============================

/**
 * Get a single task by ID
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
      checklist:checklist_id(
        id,
        title
      ),
      milestone:milestone_id(
        id,
        title
      ),
      parent:parent_id(
        id,
        title
      ),
      author:author_id(
        id,
        title
      )
    `)
    .eq('id', id)
    .eq('is_deleted', false)
    .single();
};

/**
 * Get all tasks
 */
export const fetchAllTasks = async () => {
  return await supabase
    .from('task')
    .select('*')
    .eq('is_deleted', false)
    .order('order_index')
    .order('due_date', { ascending: true, nullsFirst: false })
    .order('created_at');
};

/**
 * Insert a new task
 */
export const createTask = async (taskData) => {
  const { order_index, ...otherData } = taskData;
  
  // Get next order_index if not provided
  let finalOrderIndex = order_index;
  if (finalOrderIndex === undefined) {
    const { data: maxOrder } = await supabase
      .from('task')
      .select('order_index')
      .eq('parent_id', taskData.parent_id || null)
      .order('order_index', { ascending: false })
      .limit(1)
      .single();
    
    finalOrderIndex = (maxOrder?.order_index || 0) + 1;
  }

  return await supabase
    .from('task')
    .insert({
      ...otherData,
      order_index: finalOrderIndex,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
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
      company:company_id(id, title),
      project:project_id(id, title)
    `)
    .single();
};

/**
 * Update task by ID
 */
export const updateTask = async (id, updates) => {
  // Handle status change timestamps
  const updateData = {
    ...updates,
    updated_at: new Date().toISOString()
  };

  // Set completion timestamps based on status
  if (updates.status === 'complete') {
    updateData.completed_at = new Date().toISOString();
  }

  return await supabase
    .from('task')
    .update(updateData)
    .eq('id', id)
    .select(`
      *,
      assigned_contact:assigned_id(
        id,
        title,
        first_name,
        last_name
      ),
      company:company_id(id, title),
      project:project_id(id, title)
    `)
    .single();
};

/**
 * Delete task by ID (soft delete)
 */
export const deleteTask = async (id) => {
  return await supabase
    .from('task')
    .update({ 
      is_deleted: true, 
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', id);
};

// ===============================
// RELATIONSHIP QUERIES
// ===============================

/**
 * Get tasks by project ID
 */
export const fetchTasksByProjectId = async (projectId) => {
  return await supabase
    .from('task')
    .select(`
      *,
      assigned_contact:assigned_id(id, title, first_name, last_name),
      company:company_id(id, title),
      project:project_id(id, title)
    `)
    .eq('project_id', projectId)
    .eq('is_deleted', false)
    .order('order_index')
    .order('due_date', { ascending: true, nullsFirst: false });
};

/**
 * Get tasks by company ID
 */
export const fetchTasksByCompanyId = async (companyId) => {
  return await supabase
    .from('task')
    .select(`
      *,
      assigned_contact:assigned_id(id, title),
      company:company_id(id, title),
      project:project_id(id, title)
    `)
    .eq('company_id', companyId)
    .eq('is_deleted', false)
    .order('order_index')
    .order('due_date', { ascending: true, nullsFirst: false });
};

/**
 * Get tasks by status
 */
export const fetchTasksByStatus = async (status) => {
  return await supabase
    .from('task')
    .select('*')
    .eq('status', status)
    .eq('is_deleted', false)
    .order('order_index')
    .order('due_date', { ascending: true, nullsFirst: false });
};

/**
 * Get tasks by assigned contact
 */
export const fetchTasksByAssignedId = async (assignedId) => {
  return await supabase
    .from('task')
    .select(`
      *,
      assigned_contact:assigned_id(id, title),
      company:company_id(id, title),
      project:project_id(id, title)
    `)
    .eq('assigned_id', assignedId)
    .eq('is_deleted', false)
    .order('order_index')
    .order('due_date', { ascending: true, nullsFirst: false });
};

/**
 * Get tasks by task type
 */
export const fetchTasksByType = async (taskType) => {
  return await supabase
    .from('task')
    .select('*')
    .eq('type', taskType)
    .eq('is_deleted', false)
    .order('order_index')
    .order('due_date', { ascending: true, nullsFirst: false });
};

/**
 * Get task templates
 */
export const fetchTaskTemplates = async (projectId = null) => {
  let query = supabase
    .from('task')
    .select(`
      *,
      milestone:milestone_id(id, title),
      assignee:assigned_id(id, title, first_name, last_name)
    `)
    .eq('is_template', true)
    .eq('is_deleted', false)
    .order('milestone_id', { ascending: true, nullsFirst: false })
    .order('order_index')
    .order('created_at');
    
  if (projectId) {
    query = query.eq('project_id', projectId);
  }
  
  return await query;
};

/**
 * Get tasks for milestone
 */
export const fetchTasksForMilestone = async (milestoneId, showCompleted = false) => {
  let query = supabase
    .from('task')
    .select(`
      *,
      assigned_contact:assigned_id(id, title, first_name, last_name)
    `)
    .eq('milestone_id', milestoneId)
    .eq('is_deleted', false);

  if (!showCompleted) {
    query = query.neq('status', 'complete');
  }

  return await query
    .order('order_index')
    .order('created_at');
};

// ===============================
// HIERARCHICAL FUNCTIONS
// ===============================

/**
 * Get child tasks
 */
export const fetchChildTasks = async (parentId) => {
  return await supabase
    .from('task')
    .select('*')
    .eq('parent_id', parentId)
    .eq('is_deleted', false)
    .order('order_index')
    .order('created_at');
};

/**
 * Get task hierarchy (parent and children)
 */
export const fetchTaskHierarchy = async (taskId) => {
  const { data: task, error: taskError } = await fetchTaskById(taskId);
  if (taskError) return { data: null, error: taskError };

  const { data: children, error: childrenError } = await fetchChildTasks(taskId);
  if (childrenError) return { data: null, error: childrenError };

  let parent = null;
  if (task.parent_id) {
    const { data: parentData, error: parentError } = await fetchTaskById(task.parent_id);
    if (!parentError) parent = parentData;
  }

  return {
    data: {
      task,
      parent,
      children: children || []
    },
    error: null
  };
};

/**
 * Reorder tasks within the same parent/container
 */
export const reorderTasks = async (taskIds, parentId = null) => {
  const updates = taskIds.map((id, index) => ({
    id,
    order_index: index,
    updated_at: new Date().toISOString()
  }));

  const promises = updates.map(update => 
    supabase
      .from('task')
      .update({ order_index: update.order_index, updated_at: update.updated_at })
      .eq('id', update.id)
  );

  const results = await Promise.all(promises);
  return { data: results, error: null };
};

// ===============================
// TAG RELATIONSHIP FUNCTIONS
// ===============================

/**
 * Link a tag (category) to a task
 */
export const linkTagToTask = async (categoryId, taskId) => {
  return await supabase
    .from('category_task')
    .insert({ category_id: categoryId, task_id: taskId })
    .select();
};

/**
 * Unlink a tag from a task
 */
export const unlinkTagFromTask = async (categoryId, taskId) => {
  return await supabase
    .from('category_task')
    .delete()
    .eq('category_id', categoryId)
    .eq('task_id', taskId);
};

/**
 * Get tags for a task
 */
export const fetchTagsForTask = async (taskId) => {
  return await supabase
    .from('category_task')
    .select(`
      category_id,
      category:category_id(*)
    `)
    .eq('task_id', taskId);
};

/**
 * Get tasks for a tag
 */
export const fetchTasksForTag = async (categoryId) => {
  return await supabase
    .from('category_task')
    .select(`
      task_id,
      task:task_id(*)
    `)
    .eq('category_id', categoryId);
};

// ===============================
// ELEMENT RELATIONSHIP FUNCTIONS
// ===============================

/**
 * Link an element to a task
 */
export const linkElementToTask = async (elementId, taskId) => {
  return await supabase
    .from('element_task')
    .insert({ element_id: elementId, task_id: taskId })
    .select();
};

/**
 * Unlink an element from a task
 */
export const unlinkElementFromTask = async (elementId, taskId) => {
  return await supabase
    .from('element_task')
    .delete()
    .eq('element_id', elementId)
    .eq('task_id', taskId);
};

/**
 * Get elements for a task
 */
export const fetchElementsForTask = async (taskId) => {
  return await supabase
    .from('element_task')
    .select(`
      element_id,
      element:element_id(*)
    `)
    .eq('task_id', taskId);
};

/**
 * Get tasks for an element
 */
export const fetchTasksForElement = async (elementId) => {
  return await supabase
    .from('element_task')
    .select(`
      task_id,
      task:task_id(*)
    `)
    .eq('element_id', elementId);
};

// ===============================
// CONTACT RELATIONSHIP FUNCTIONS
// ===============================

/**
 * Link a contact to a task
 */
export const linkContactToTask = async (contactId, taskId) => {
  return await supabase
    .from('contact_task')
    .insert({ contact_id: contactId, task_id: taskId })
    .select();
};

/**
 * Unlink a contact from a task
 */
export const unlinkContactFromTask = async (contactId, taskId) => {
  return await supabase
    .from('contact_task')
    .delete()
    .eq('contact_id', contactId)
    .eq('task_id', taskId);
};

/**
 * Get contacts for a task
 */
export const fetchContactsForTask = async (taskId) => {
  return await supabase
    .from('contact_task')
    .select(`
      contact_id,
      contact:contact_id(*)
    `)
    .eq('task_id', taskId);
};

/**
 * Get tasks for a contact
 */
export const fetchTasksForContact = async (contactId) => {
  return await supabase
    .from('contact_task')
    .select(`
      task_id,
      task:task_id(*)
    `)
    .eq('contact_id', contactId);
};

// ===============================
// TASK STATUS & WORKFLOW FUNCTIONS
// ===============================

/**
 * Toggle task completion status
 */
export const toggleTaskComplete = async (taskId, currentStatus) => {
  const newStatus = currentStatus === 'complete' ? 'todo' : 'complete';
  
  // Update the main task
  const { data, error } = await updateTask(taskId, { status: newStatus });
  if (error) return { data: null, error };

  // If marking as complete, also complete subtasks
  if (newStatus === 'complete') {
    await supabase
      .from('task')
      .update({ 
        status: 'complete',
        updated_at: new Date().toISOString()
      })
      .eq('parent_id', taskId)
      .neq('status', 'complete');
  }

  // If marking as incomplete and has parent, mark parent as in_progress
  if (newStatus !== 'complete' && data.parent_id) {
    await supabase
      .from('task')
      .update({ 
        status: 'in_progress',
        updated_at: new Date().toISOString()
      })
      .eq('id', data.parent_id)
      .eq('status', 'complete');
  }

  return { data, error: null };
};

/**
 * Move task to different milestone
 */
export const moveTaskToMilestone = async (taskId, milestoneId, newIndex = 0) => {
  return await supabase
    .from('task')
    .update({
      milestone_id: milestoneId,
      order_index: newIndex,
      updated_at: new Date().toISOString()
    })
    .eq('id', taskId);
};

/**
 * Update task status
 */
export const updateTaskStatus = async (taskId, newStatus, newIndex = null) => {
  const updateData = {
    status: newStatus,
    updated_at: new Date().toISOString()
  };

  if (newIndex !== null) {
    updateData.order_index = newIndex;
  }

  if (newStatus === 'complete') {
    updateData.completed_at = new Date().toISOString();
  }

  return await supabase
    .from('task')
    .update(updateData)
    .eq('id', taskId);
};

// ===============================
// UTILITY FUNCTIONS
// ===============================

/**
 * Duplicate a task
 */
export const duplicateTask = async (taskId, newTitle = null, includeChildren = true) => {
  const { data: originalTask, error: fetchError } = await fetchTaskById(taskId);
  if (fetchError) return { data: null, error: fetchError };

  const { id, created_at, updated_at, slug, ...taskData } = originalTask;
  
  const duplicatedData = {
    ...taskData,
    title: newTitle || `${originalTask.title} (Copy)`,
    slug: null, // Will be auto-generated
    status: 'todo' // Reset status for duplicate
  };

  const { data: newTask, error: createError } = await createTask(duplicatedData);
  if (createError) return { data: null, error: createError };

  // Duplicate children if requested
  if (includeChildren) {
    const { data: children } = await fetchChildTasks(taskId);
    if (children && children.length > 0) {
      for (const child of children) {
        const { id: childId, created_at: childCreated, updated_at: childUpdated, parent_id, ...childData } = child;
        await createTask({
          ...childData,
          title: `${child.title} (Copy)`,
          parent_id: newTask.id,
          status: 'todo'
        });
      }
    }
  }

  return { data: newTask, error: null };
};

/**
 * Get task statistics
 */
export const getTaskStats = async (taskId) => {
  // Get basic task info
  const { data: task, error: taskError } = await fetchTaskById(taskId);
  if (taskError) return { data: null, error: taskError };

  // Get related counts
  const { count: childrenCount } = await supabase
    .from('task')
    .select('*', { count: 'exact', head: true })
    .eq('parent_id', taskId)
    .eq('is_deleted', false);

  const { count: tagCount } = await supabase
    .from('category_task')
    .select('*', { count: 'exact', head: true })
    .eq('task_id', taskId);

  const { count: elementCount } = await supabase
    .from('element_task')
    .select('*', { count: 'exact', head: true })
    .eq('task_id', taskId);

  const { count: contactCount } = await supabase
    .from('contact_task')
    .select('*', { count: 'exact', head: true })
    .eq('task_id', taskId);

  return {
    data: {
      task,
      childrenCount: childrenCount || 0,
      tagCount: tagCount || 0,
      elementCount: elementCount || 0,
      contactCount: contactCount || 0
    },
    error: null
  };
};

/**
 * Search tasks with advanced filtering
 */
export const searchTasks = async (searchTerm = '', filters = {}) => {
  let query = supabase
    .from('task')
    .select(`
      *,
      assigned_contact:assigned_id(id, title),
      company:company_id(id, title),
      project:project_id(id, title)
    `)
    .eq('is_deleted', false);

  // Apply search term
  if (searchTerm) {
    query = query.or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
  }

  // Apply filters
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '' && value !== null) {
      if (Array.isArray(value)) {
        query = query.in(key, value);
      } else {
        query = query.eq(key, value);
      }
    }
  });

  // Default ordering
  query = query.order('order_index').order('due_date', { ascending: true, nullsFirst: false });

  return await query;
};

/**
 * Get tasks with advanced filtering and pagination
 */
export const fetchTasksWithFilters = async (filters = {}, searchQuery = '', page = 1, limit = 50) => {
  const offset = (page - 1) * limit;

  let query = supabase
    .from('task')
    .select(`
      *,
      assigned_contact:assigned_id(id, title, first_name, last_name),
      company:company_id(id, title),
      project:project_id(id, title)
    `, { count: 'exact' })
    .eq('is_deleted', false);

  // Apply search
  if (searchQuery) {
    query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
  }

  // Apply filters
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '' && value !== null) {
      if (Array.isArray(value)) {
        query = query.in(key, value);
      } else {
        query = query.eq(key, value);
      }
    }
  });

  // Apply sorting
  if (filters.sort) {
    const [field, direction] = filters.sort.split(':');
    query = query.order(field, { ascending: direction === 'asc' });
  } else {
    query = query.order('order_index').order('due_date', { ascending: true, nullsFirst: false });
  }

  // Apply pagination
  query = query.range(offset, offset + limit - 1);

  return await query;
};

/**
 * Get tasks for Kanban view grouped by status
 */
export const fetchTasksForKanban = async (filters = {}) => {
  const { data: tasks, error } = await searchTasks('', filters);
  
  if (error) return { data: null, error };

  // Group by status
  const grouped = {
    not_started: [],
    todo: [],
    in_progress: [],
    complete: [],
    archived: []
  };

  tasks.forEach(task => {
    const status = task.status || 'todo';
    if (grouped[status]) {
      grouped[status].push(task);
    }
  });

  return { data: grouped, error: null };
};

/**
 * Create task template
 */
export const createTaskTemplate = async (templateData) => {
  return await createTask({
    ...templateData,
    is_template: true,
    status: 'todo'
  });
};

/**
 * Bulk update multiple tasks
 */
export const bulkUpdateTasks = async (taskUpdates) => {
  try {
    const updates = await Promise.all(
      taskUpdates.map(async ({ id, ...updateData }) => {
        const { data } = await updateTask(id, updateData);
        return data;
      })
    );

    return { data: updates.filter(Boolean), error: null };
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Get overdue tasks
 */
export const fetchOverdueTasks = async (assignedId = null) => {
  let query = supabase
    .from('task')
    .select(`
      *,
      assigned_contact:assigned_id(id, title),
      company:company_id(id, title),
      project:project_id(id, title)
    `)
    .eq('is_deleted', false)
    .neq('status', 'complete')
    .neq('status', 'archived')
    .lt('due_date', new Date().toISOString());

  if (assignedId) {
    query = query.eq('assigned_id', assignedId);
  }

  return await query.order('due_date');
};

/**
 * Get upcoming tasks (due in next 7 days)
 */
export const fetchUpcomingTasks = async (assignedId = null, days = 7) => {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);

  let query = supabase
    .from('task')
    .select(`
      *,
      assigned_contact:assigned_id(id, title),
      company:company_id(id, title),
      project:project_id(id, title)
    `)
    .eq('is_deleted', false)
    .neq('status', 'complete')
    .neq('status', 'archived')
    .gte('due_date', new Date().toISOString())
    .lte('due_date', futureDate.toISOString());

  if (assignedId) {
    query = query.eq('assigned_id', assignedId);
  }

  return await query.order('due_date');
};



// Additional functions to add to lib/supabase/queries/table/task.js
// These support the ChecklistWidget requirements with proper SOP compliance

/**
 * Get tasks for widget display with entity relationship filtering
 */
export const fetchTasksForWidget = async (filters = {}, maxItems = 8) => {
  const {
    assigned_to,
    status,
    due_date,
    entityTypes = []
  } = filters;

  let query = supabase
    .from('task')
    .select(`
      id,
      title,
      status,
      due_date,
      created_at,
      assigned_id,
      checklist:checklist_id(
        id,
        title,
        type,
        event:event_id(
          id,
          title,
          start_time
        ),
        project:project_id(
          id,
          title
        )
      ),
      assigned_contact:assigned_id(
        id,
        title,
        email
      )
    `)
    .eq('is_deleted', false);

  // Apply user filter
  if (assigned_to) {
    query = query.eq('assigned_id', assigned_to);
  }

  // Apply status filter
  if (status) {
    if (Array.isArray(status)) {
      query = query.in('status', status);
    } else {
      query = query.eq('status', status);
    }
  }

  // Apply due date filters
  if (due_date) {
    const today = new Date().toISOString().split('T')[0];
    
    switch (due_date) {
      case 'overdue':
        query = query.lt('due_date', today);
        break;
      case 'today':
        query = query.eq('due_date', today);
        break;
      case 'this_week':
        const weekEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        query = query.gte('due_date', today).lte('due_date', weekEnd);
        break;
      case 'upcoming':
        query = query.gte('due_date', today);
        break;
    }
  }

  const { data, error } = await query
    .order('due_date', { ascending: true, nullsLast: true })
    .order('created_at', { ascending: false })
    .limit(maxItems * 2); // Get more to account for entity filtering

  if (error) {
    return { data: null, error };
  }

  // Filter by entity types if specified (client-side filtering)
  let filteredData = data || [];
  if (entityTypes.length > 0) {
    filteredData = data.filter(task => {
      const checklist = task.checklist;
      if (!checklist) return false;
      
      return entityTypes.some(entityType => {
        switch (entityType) {
          case 'event':
            return checklist.event !== null;
          case 'project':
            return checklist.project !== null;
          case 'contract':
            // Note: Contract support via junction table would need additional query
            return false; // TODO: Implement contract checklist relationship
          default:
            return false;
        }
      });
    });
  }

  // Limit to requested max items after filtering
  const finalData = filteredData.slice(0, maxItems);

  return { data: finalData, error: null };
};

/**
 * Get tasks by due date with entity filtering
 */
export const fetchTasksByDueDateAndEntity = async (dueDateType, entityTypes = [], assignedId = null) => {
  const today = new Date().toISOString().split('T')[0];
  
  let query = supabase
    .from('task')
    .select(`
      id,
      title,
      status,
      due_date,
      created_at,
      checklist:checklist_id(
        id,
        title,
        event:event_id(id, title, start_time),
        project:project_id(id, title)
      ),
      assigned_contact:assigned_id(id, title, email)
    `)
    .eq('is_deleted', false);

  if (assignedId) {
    query = query.eq('assigned_id', assignedId);
  }

  // Apply due date filter
  switch (dueDateType) {
    case 'overdue':
      query = query.lt('due_date', today).neq('status', 'complete');
      break;
    case 'today':
      query = query.eq('due_date', today).neq('status', 'complete');
      break;
    case 'this_week':
      const weekEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      query = query.gte('due_date', today).lte('due_date', weekEnd).neq('status', 'complete');
      break;
    case 'upcoming':
      query = query.gte('due_date', today).neq('status', 'complete');
      break;
  }

  const { data, error } = await query.order('due_date', { ascending: true });

  if (error) {
    return { data: null, error };
  }

  // Filter by entity types if specified
  let filteredData = data || [];
  if (entityTypes.length > 0) {
    filteredData = data.filter(task => {
      const checklist = task.checklist;
      if (!checklist) return false;
      
      return entityTypes.some(entityType => {
        switch (entityType) {
          case 'event':
            return checklist.event !== null;
          case 'project':
            return checklist.project !== null;
          default:
            return false;
        }
      });
    });
  }

  return { data: filteredData, error: null };
};

/**
 * Get task counts by status for assigned user
 */
export const getTaskCountsByStatus = async (assignedId) => {
  const { data, error } = await supabase
    .from('task')
    .select('id, status, due_date')
    .eq('assigned_id', assignedId)
    .eq('is_deleted', false);

  if (error) {
    return { data: null, error };
  }

  const today = new Date().toISOString().split('T')[0];
  
  const counts = {
    total: data.length,
    complete: 0,
    todo: 0,
    in_progress: 0,
    overdue: 0,
    due_today: 0
  };

  data.forEach(task => {
    // Count by status
    switch (task.status) {
      case 'complete':
        counts.complete++;
        break;
      case 'todo':
        counts.todo++;
        break;
      case 'in_progress':
        counts.in_progress++;
        break;
    }

    // Count overdue and due today (exclude completed)
    if (task.status !== 'complete') {
      if (task.due_date) {
        if (task.due_date < today) {
          counts.overdue++;
        } else if (task.due_date === today) {
          counts.due_today++;
        }
      }
    }
  });

  return { data: counts, error: null };
};

/**
 * Update task status (simplified for widget use)
 */
export const updateTaskStatusSimple = async (taskId, newStatus) => {
  const updateData = {
    status: newStatus,
    updated_at: new Date().toISOString()
  };

  if (newStatus === 'complete') {
    updateData.completed_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('task')
    .update(updateData)
    .eq('id', taskId)
    .select('id, status, updated_at')
    .single();

  return { data, error };
};