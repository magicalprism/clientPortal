// lib/supabase/queries/table/event.js

import { createClient } from '@/lib/supabase/browser';
const supabase = createClient();

/**
 * Get a single event by ID with all related checklists
 */
export const fetchEventById = async (id) => {
  const { data, error } = await supabase
    .from('event')
    .select(`
      *,
      event_checklists:checklist!event_id(
        id,
        title,
        type,
        order_index,
        created_at,
        updated_at,
        tasks:task(
          id,
          title,
          status,
          due_date,
          assigned_id,
          order_index,
          created_at,
          assigned_contact:contact!assigned_id(id, title, email)
        )
      )
    `)
    .eq('id', id)
    .single();

  // Sort checklists and tasks by order_index in JavaScript
  if (data && data.event_checklists) {
    data.event_checklists.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
    data.event_checklists.forEach(checklist => {
      if (checklist.tasks) {
        checklist.tasks.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
      }
    });
  }

  return { data, error };
};

/**
 * Get all checklists for an event
 */
export const fetchEventChecklists = async (eventId) => {
  const { data, error } = await supabase
    .from('checklist')
    .select(`
      id,
      title,
      type,
      order_index,
      created_at,
      updated_at,
      tasks:task(
        id,
        title,
        status,
        due_date,
        assigned_id,
        order_index,
        created_at,
        assigned_contact:contact!assigned_id(id, title, email)
      )
    `)
    .eq('event_id', eventId)
    .order('order_index');
    
  // Sort tasks by order_index in JavaScript since Supabase doesn't support nested ordering
  if (data) {
    data.forEach(checklist => {
      if (checklist.tasks) {
        checklist.tasks.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
      }
    });
  }
    
  return { data, error };
};

/**
 * Create a new checklist for an event
 */
export const createEventChecklist = async (eventId, title, authorId, type = 'event') => {
  // Get current max order_index for this event
  const { data: existingChecklists } = await supabase
    .from('checklist')
    .select('order_index')
    .eq('event_id', eventId)
    .order('order_index', { ascending: false })
    .limit(1);
    
  const nextOrderIndex = existingChecklists?.[0]?.order_index + 1 || 0;

  const { data, error } = await supabase
    .from('checklist')
    .insert([{
      title,
      type,
      event_id: eventId,
      author_id: authorId,
      order_index: nextOrderIndex,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }])
    .select(`
      id,
      title,
      type,
      order_index,
      created_at,
      updated_at,
      tasks:task(
        id,
        title,
        status,
        due_date,
        assigned_id,
        order_index,
        assigned_contact:contact!assigned_id(id, title, email)
      )
    `)
    .single();
    
  return { data, error };
};

/**
 * Create default "Action Items" checklist for an event
 */
export const createDefaultEventChecklist = async (eventId, authorId) => {
  return await createEventChecklist(eventId, 'Action Items', authorId, 'event');
};

/**
 * Delete an event checklist (and all its tasks via CASCADE)
 */
export const deleteEventChecklist = async (checklistId) => {
  const { error } = await supabase
    .from('checklist')
    .delete()
    .eq('id', checklistId);
    
  return { error };
};

/**
 * Update event checklist title
 */
export const updateEventChecklistTitle = async (checklistId, title) => {
  const { data, error } = await supabase
    .from('checklist')
    .update({ 
      title,
      updated_at: new Date().toISOString()
    })
    .eq('id', checklistId)
    .select()
    .single();
    
  return { data, error };
};

/**
 * Reorder event checklists
 */
export const reorderEventChecklists = async (eventId, checklistOrders) => {
  const updates = checklistOrders.map(({ id, order_index }) => 
    supabase
      .from('checklist')
      .update({ 
        order_index,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('event_id', eventId)
  );
  
  const results = await Promise.all(updates);
  const errors = results.filter(result => result.error);
  
  return { 
    success: errors.length === 0,
    errors: errors.map(result => result.error)
  };
};

/**
 * Get event participants (contacts) for task assignment
 */
export const fetchEventParticipants = async (eventId) => {
  const { data, error } = await supabase
    .from('contact_event')
    .select(`
      contact:contact_id(
        id,
        title,
        email
      )
    `)
    .eq('event_id', eventId);
    
  return { 
    data: data?.map(item => item.contact) || [], 
    error 
  };
};

/**
 * Create action item task for event participant
 */
export const createEventActionItem = async (checklistId, taskData) => {
  // Get current max order_index for this checklist
  const { data: existingTasks } = await supabase
    .from('task')
    .select('order_index')
    .eq('checklist_id', checklistId)
    .order('order_index', { ascending: false })
    .limit(1);
    
  const nextOrderIndex = existingTasks?.[0]?.order_index + 1 || 0;

  const { data, error } = await supabase
    .from('task')
    .insert([{
      ...taskData,
      checklist_id: checklistId,
      status: taskData.status || 'todo',
      order_index: nextOrderIndex,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }])
    .select(`
      *,
      assigned_contact:contact!assigned_id(id, title, email)
    `)
    .single();
    
  return { data, error };
};

/**
 * Check if event has any checklists
 */
export const hasEventChecklists = async (eventId) => {
  const { count, error } = await supabase
    .from('checklist')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', eventId);
    
  return { hasChecklists: count > 0, error };
};

/**
 * Get all events with their checklist counts (for dashboard/summary views)
 */
export const fetchEventsWithChecklistSummary = async (filters = {}) => {
  let query = supabase
    .from('event')
    .select(`
      id,
      title,
      start_time,
      end_time,
      status,
      checklist_count:checklist(count),
      task_count:checklist(tasks(count))
    `);
    
  // Apply filters
  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  
  if (filters.date_range) {
    query = query.gte('start_time', filters.date_range.start)
                  .lte('start_time', filters.date_range.end);
  }
  
  const { data, error } = await query.order('start_time', { ascending: true });
  
  return { data, error };
};

/**
 * Get user's assigned tasks across all events
 */
export const fetchUserEventTasks = async (userId, filters = {}) => {
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
        event:event_id(
          id,
          title,
          start_time
        )
      )
    `)
    .eq('assigned_id', userId);
    
  // Apply filters
  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  
  if (filters.due_date) {
    const today = new Date().toISOString().split('T')[0];
    switch (filters.due_date) {
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
    }
  }
  
  const { data, error } = await query.order('due_date', { ascending: true });
  
  return { data, error };
};