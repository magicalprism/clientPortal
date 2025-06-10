// lib/supabase/queries/table/task.js

import { createClient } from '@/lib/supabase/browser';

/**
 * Get a single task by ID
 */

export const fetchTaskById = async (id) => {
  const supabase = createClient();
  return await supabase
    .from('task')
    .select('*')
    .eq('id', id)
    .single();
};

export const fetchTasks = async ({
  projectId,
  milestoneId,
  taskType,
  showCompleted = true,
  groupByStatus = false,
  orderBy = 'order_index',
  orderAsc = true,
  ids = null // Optional array of task IDs
} = {}) => {
  const supabase = createClient();
  let query = supabase.from('task').select('*');

  if (projectId) query = query.eq('project_id', projectId);
  if (milestoneId) query = query.eq('milestone_id', milestoneId);
  if (taskType) query = query.eq('task_type', taskType);
  if (!showCompleted) query = query.neq('status', 'complete');
  if (ids?.length) query = query.in('id', ids);

  const { data, error } = await query.order(orderBy, { ascending: orderAsc });

  if (error) return { data: groupByStatus ? {} : [], error };

  if (groupByStatus) {
    const grouped = {};
    for (const task of data) {
      const status = task.status || 'todo';
      const key = `status-${status}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(task);
    }
    return { data: grouped, error: null };
  }

  return { data, error };
};


export const insertTask = async (taskData) => {
  const supabase = createClient();
  return await supabase.from('task').insert(taskData).select().single();
};

export const updateTaskById = async (id, updates) => {
  const supabase = createClient();
  return await supabase.from('task').update(updates).eq('id', id).select().single();
};

export const updateTaskStatus = async (taskId, newStatus, newOrder = null) => {
  const updates = { status: newStatus };
  if (newOrder !== null) updates.order_index = newOrder;
  return updateTaskById(taskId, updates);
};

export const updateTaskOrder = async (taskId, newOrder) => {
  return updateTaskById(taskId, { order_index: newOrder });
};

export const moveTaskToMilestone = async (taskId, toMilestoneId, newOrder = 0) => {
  return updateTaskById(taskId, {
    milestone_id: toMilestoneId,
    order_index: newOrder
  });
};

export const updateTaskOrdersInMilestone = async (milestoneId, taskOrders) => {
  const supabase = createClient();
  const updates = taskOrders.map(({ taskId, order }) =>
    supabase.from('task').update({ order_index: order }).eq('id', taskId).eq('milestone_id', milestoneId)
  );
  return await Promise.all(updates);
};


