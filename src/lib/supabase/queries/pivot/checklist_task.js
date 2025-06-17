import { createClient } from '@/lib/supabase/browser';

const supabase = createClient();

/**
 * Get tasks for a checklist
 */
export const fetchTasksForChecklist = async (checklistId) => {
  return await supabase
    .from('checklist_task')
    .select(`
      task_id,
      task:task_id(*),
      order_index
    `)
    .eq('checklist_id', checklistId)
    .order('order_index');
};

/**
 * Get checklists for a task
 */
export const fetchChecklistsForTask = async (taskId) => {
  return await supabase
    .from('checklist_task')
    .select(`
      checklist_id,
      checklist:checklist_id(*),
      order_index
    `)
    .eq('task_id', taskId)
    .order('order_index');
};

/**
 * Link a task to a checklist
 */
export const linkTaskToChecklist = async (taskId, checklistId, orderIndex = null) => {
  // Check if the relationship already exists
  const { data: existing } = await supabase
    .from('checklist_task')
    .select('*')
    .eq('task_id', taskId)
    .eq('checklist_id', checklistId)
    .maybeSingle();

  if (existing) {
    return { data: existing, error: null };
  }

  // If order_index is not provided, get the next available index
  let finalOrderIndex = orderIndex;
  if (finalOrderIndex === null) {
    const { data: maxOrder } = await supabase
      .from('checklist_task')
      .select('order_index')
      .eq('checklist_id', checklistId)
      .order('order_index', { ascending: false })
      .limit(1)
      .single();
    
    finalOrderIndex = (maxOrder?.order_index || -1) + 1;
  }

  return await supabase
    .from('checklist_task')
    .insert({ 
      task_id: taskId, 
      checklist_id: checklistId,
      order_index: finalOrderIndex
    })
    .select();
};

/**
 * Unlink a task from a checklist
 */
export const unlinkTaskFromChecklist = async (taskId, checklistId) => {
  return await supabase
    .from('checklist_task')
    .delete()
    .eq('task_id', taskId)
    .eq('checklist_id', checklistId);
};

/**
 * Update checklist_task relationship metadata
 */
export const updateChecklistTask = async (taskId, checklistId, metadata) => {
  return await supabase
    .from('checklist_task')
    .update(metadata)
    .eq('task_id', taskId)
    .eq('checklist_id', checklistId);
};

/**
 * Batch link tasks to a checklist
 */
export const linkTasksToChecklist = async (taskIds, checklistId) => {
  if (!taskIds || !taskIds.length) {
    return { data: [], error: null };
  }

  // Get the highest current order_index
  const { data: maxOrder } = await supabase
    .from('checklist_task')
    .select('order_index')
    .eq('checklist_id', checklistId)
    .order('order_index', { ascending: false })
    .limit(1)
    .single();
  
  let startOrderIndex = (maxOrder?.order_index || -1) + 1;

  const insertData = taskIds.map((taskId, index) => ({
    task_id: taskId,
    checklist_id: checklistId,
    order_index: startOrderIndex + index
  }));

  return await supabase
    .from('checklist_task')
    .upsert(insertData, { onConflict: ['task_id', 'checklist_id'] })
    .select();
};

/**
 * Batch link checklists to a task
 */
export const linkChecklistsToTask = async (checklistIds, taskId) => {
  if (!checklistIds || !checklistIds.length) {
    return { data: [], error: null };
  }

  const insertData = checklistIds.map((checklistId, index) => ({
    task_id: taskId,
    checklist_id: checklistId,
    order_index: index
  }));

  return await supabase
    .from('checklist_task')
    .upsert(insertData, { onConflict: ['task_id', 'checklist_id'] })
    .select();
};

/**
 * Replace all task relationships for a checklist
 */
export const replaceTasksForChecklist = async (taskIds, checklistId) => {
  // First delete all existing relationships
  const { error: deleteError } = await supabase
    .from('checklist_task')
    .delete()
    .eq('checklist_id', checklistId);

  if (deleteError) {
    return { data: null, error: deleteError };
  }

  // If no tasks to add, we're done
  if (!taskIds || !taskIds.length) {
    return { data: [], error: null };
  }

  // Add new relationships
  return await linkTasksToChecklist(taskIds, checklistId);
};

/**
 * Replace all checklist relationships for a task
 */
export const replaceChecklistsForTask = async (checklistIds, taskId) => {
  // First delete all existing relationships
  const { error: deleteError } = await supabase
    .from('checklist_task')
    .delete()
    .eq('task_id', taskId);

  if (deleteError) {
    return { data: null, error: deleteError };
  }

  // If no checklists to add, we're done
  if (!checklistIds || !checklistIds.length) {
    return { data: [], error: null };
  }

  // Add new relationships
  return await linkChecklistsToTask(checklistIds, taskId);
};

/**
 * Reorder tasks within a checklist
 */
export const reorderTasksInChecklist = async (checklistId, taskIds) => {
  const updates = taskIds.map((taskId, index) => ({
    task_id: taskId,
    checklist_id: checklistId,
    order_index: index
  }));

  return await supabase
    .from('checklist_task')
    .upsert(updates, { onConflict: ['task_id', 'checklist_id'] })
    .select();
};