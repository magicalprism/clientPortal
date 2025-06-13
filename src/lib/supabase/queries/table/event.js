// lib/supabase/queries/table/event.js

/*
REQUIRED SQL MIGRATION for order_index standardization:

-- Add order_index column to event table
ALTER TABLE event ADD COLUMN IF NOT EXISTS order_index integer DEFAULT 0;

-- Update existing records to have proper order_index values (optional)
UPDATE event 
SET order_index = ROW_NUMBER() OVER (
  PARTITION BY COALESCE(parent_id, 0) 
  ORDER BY start_time, created_at
) - 1
WHERE order_index = 0 OR order_index IS NULL;
*/

import { createClient } from '@/lib/supabase/browser';
const supabase = createClient();

/**
 * Get a single event by ID with all related data
 */
export const fetchEventById = async (id) => {
  const { data, error } = await supabase
    .from('event')
    .select(`
      *,
      author:author_id(id, title, email),
      parent:parent_id(id, title),
      contacts:contact_event(
        contact:contact_id(id, title, email)
      ),
      companies:company_event(
        company:company_id(id, title)
      ),
      projects:event_project(
        project:project_id(id, title, status)
      ),
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
      ),
      child_events:event!parent_id(id, title, start_time, end_time, status)
    `)
    .eq('id', id)
    .single();

  // Transform nested data and sort by order_index
  if (data) {
    data.contacts = data.contacts?.map(c => c.contact) || [];
    data.companies = data.companies?.map(c => c.company) || [];
    data.projects = data.projects?.map(p => p.project) || [];
    
    // Sort checklists and tasks by order_index
    if (data.event_checklists) {
      data.event_checklists.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
      data.event_checklists.forEach(checklist => {
        if (checklist.tasks) {
          checklist.tasks.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
        }
      });
    }
  }

  return { data, error };
};

/**
 * Get all events with optional filters
 */
export const fetchAllEvents = async (filters = {}) => {
  let query = supabase
    .from('event')
    .select(`
      id,
      title,
      type,
      status,
      start_time,
      end_time,
      location,
      all_day,
      description,
      zoom_join_url,
      order_index,
      created_at,
      updated_at,
      author:author_id(id, title),
      parent:parent_id(id, title),
      contact_count:contact_event(count),
      company_count:company_event(count),
      project_count:event_project(count),
      checklist_count:checklist!event_id(count)
    `)
    .eq('is_deleted', false);

  // Apply filters
  if (filters.search) {
    query = query.ilike('title', `%${filters.search}%`);
  }

  if (filters.type) {
    query = query.eq('type', filters.type);
  }
  
  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  
  if (filters.author_id) {
    query = query.eq('author_id', filters.author_id);
  }

  if (filters.parent_id !== undefined) {
    if (filters.parent_id === null || filters.parent_id === 'null') {
      query = query.is('parent_id', null);
    } else {
      query = query.eq('parent_id', filters.parent_id);
    }
  }

  // Date range filtering
  if (filters.start_date) {
    query = query.gte('start_time', filters.start_date);
  }
  if (filters.end_date) {
    query = query.lte('end_time', filters.end_date);
  }

  // Apply sorting
  if (filters.sort) {
    const [field, direction] = filters.sort.split(':');
    query = query.order(field, { ascending: direction === 'asc' });
  } else {
    // Default sorting: by start_time
    query = query.order('start_time', { ascending: true });
  }

  const { data, error } = await query;
  return { data, error };
};

// ✅ SOP COMPLIANT: insertEvent (was createEvent)
/**
 * Create a new event
 */
export const insertEvent = async (eventData) => {
  // Get current max order_index for the parent
  const parentCondition = eventData.parent_id 
    ? { parent_id: eventData.parent_id }
    : { parent_id: null };

  const { data: existingEvents } = await supabase
    .from('event')
    .select('order_index')
    .match(parentCondition)
    .order('order_index', { ascending: false })
    .limit(1);
    
  const nextOrderIndex = (existingEvents?.[0]?.order_index || -1) + 1;

  const { data, error } = await supabase
    .from('event')
    .insert([{
      ...eventData,
      status: eventData.status || 'scheduled',
      order_index: eventData.order_index ?? nextOrderIndex,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }])
    .select(`
      *,
      author:author_id(id, title),
      parent:parent_id(id, title)
    `)
    .single();

  return { data, error };
};

// ✅ BACKWARD COMPATIBILITY: Keep old function name as alias
export const createEvent = insertEvent;

/**
 * Update event
 */
export const updateEvent = async (id, updates) => {
  const { data, error } = await supabase
    .from('event')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select(`
      *,
      author:author_id(id, title),
      parent:parent_id(id, title)
    `)
    .single();

  return { data, error };
};

/**
 * Delete event (soft delete)
 */
export const deleteEvent = async (id, softDelete = true) => {
  if (softDelete) {
    const { error } = await supabase
      .from('event')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
    return { success: !error, error };
  } else {
    const { error } = await supabase
      .from('event')
      .delete()
      .eq('id', id);
    return { success: !error, error };
  }
};

// ========== CALENDAR VIEW FUNCTIONS ==========

/**
 * Get events for calendar view within date range
 */
export const fetchEventsForCalendar = async (startDate, endDate, filters = {}) => {
  let query = supabase
    .from('event')
    .select(`
      id,
      title,
      type,
      status,
      start_time,
      end_time,
      all_day,
      location,
      description,
      author:author_id(id, title)
    `)
    .eq('is_deleted', false)
    .gte('start_time', startDate)
    .lte('start_time', endDate);

  // Apply additional filters
  if (filters.type) {
    query = query.eq('type', filters.type);
  }
  
  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  query = query.order('start_time');

  const { data, error } = await query;
  return { data, error };
};

/**
 * Get today's events
 */
export const fetchTodaysEvents = async () => {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

  const { data, error } = await supabase
    .from('event')
    .select(`
      id,
      title,
      type,
      status,
      start_time,
      end_time,
      all_day,
      location,
      zoom_join_url
    `)
    .eq('is_deleted', false)
    .gte('start_time', startOfDay)
    .lt('start_time', endOfDay)
    .order('start_time');

  return { data, error };
};

/**
 * Get upcoming events
 */
export const fetchUpcomingEvents = async (limit = 10) => {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('event')
    .select(`
      id,
      title,
      type,
      status,
      start_time,
      end_time,
      location,
      zoom_join_url
    `)
    .eq('is_deleted', false)
    .gte('start_time', now)
    .in('status', ['scheduled', 'in_progress'])
    .order('start_time')
    .limit(limit);

  return { data, error };
};

// ========== HIERARCHICAL MANAGEMENT ==========

/**
 * Get events by parent
 */
export const fetchEventsByParent = async (parentId) => {
  const condition = parentId ? { parent_id: parentId } : { parent_id: null };

  const { data, error } = await supabase
    .from('event')
    .select(`
      id,
      title,
      type,
      status,
      start_time,
      end_time,
      order_index,
      created_at,
      child_count:event!parent_id(count)
    `)
    .match(condition)
    .eq('is_deleted', false)
    .order('order_index', { ascending: true, nullsFirst: false })
    .order('start_time', { ascending: true });

  return { data, error };
};

/**
 * Get child events
 */
export const fetchChildEvents = async (parentId) => {
  return await fetchEventsByParent(parentId);
};

// ========== RELATIONSHIP MANAGEMENT ==========

/**
 * Link contacts to event
 */
export const linkContactsToEvent = async (eventId, contactIds) => {
  if (!Array.isArray(contactIds)) {
    contactIds = [contactIds];
  }

  // Remove existing links first
  await supabase
    .from('contact_event')
    .delete()
    .eq('event_id', eventId);

  // Add new links
  const insertData = contactIds.map(contactId => ({
    event_id: eventId,
    contact_id: contactId,
    created_at: new Date().toISOString()
  }));

  const { data, error } = await supabase
    .from('contact_event')
    .insert(insertData)
    .select(`
      contact:contact_id(id, title, email)
    `);

  return { 
    data: data?.map(item => item.contact) || [], 
    error 
  };
};

/**
 * Link companies to event
 */
export const linkCompaniesToEvent = async (eventId, companyIds) => {
  if (!Array.isArray(companyIds)) {
    companyIds = [companyIds];
  }

  // Remove existing links first
  await supabase
    .from('company_event')
    .delete()
    .eq('event_id', eventId);

  // Add new links
  const insertData = companyIds.map(companyId => ({
    event_id: eventId,
    company_id: companyId,
    created_at: new Date().toISOString()
  }));

  const { data, error } = await supabase
    .from('company_event')
    .insert(insertData)
    .select(`
      company:company_id(id, title)
    `);

  return { 
    data: data?.map(item => item.company) || [], 
    error 
  };
};

/**
 * Link projects to event
 */
export const linkProjectsToEvent = async (eventId, projectIds) => {
  if (!Array.isArray(projectIds)) {
    projectIds = [projectIds];
  }

  // Remove existing links first
  await supabase
    .from('event_project')
    .delete()
    .eq('event_id', eventId);

  // Add new links
  const insertData = projectIds.map(projectId => ({
    event_id: eventId,
    project_id: projectId,
    created_at: new Date().toISOString()
  }));

  const { data, error } = await supabase
    .from('event_project')
    .insert(insertData)
    .select(`
      project:project_id(id, title, status)
    `);

  return { 
    data: data?.map(item => item.project) || [], 
    error 
  };
};

// ========== STATUS MANAGEMENT ==========

/**
 * Update event status
 */
export const updateEventStatus = async (id, newStatus) => {
  const { data, error } = await supabase
    .from('event')
    .update({
      status: newStatus,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select('id, status')
    .single();

  return { data, error };
};

/**
 * Mark event as completed
 */
export const markEventCompleted = async (id) => {
  return await updateEventStatus(id, 'completed');
};

/**
 * Mark event as cancelled
 */
export const markEventCancelled = async (id) => {
  return await updateEventStatus(id, 'cancelled');
};

// ========== INTEGRATION FUNCTIONS ==========

/**
 * Update Google Calendar integration
 */
export const updateEventGoogleIntegration = async (id, googleEventId) => {
  const { data, error } = await supabase
    .from('event')
    .update({
      google_event_id: googleEventId,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select('id, google_event_id')
    .single();

  return { data, error };
};

/**
 * Update Zoom integration
 */
export const updateEventZoomIntegration = async (id, zoomData) => {
  const { data, error } = await supabase
    .from('event')
    .update({
      zoom_meeting_id: zoomData.meeting_id,
      zoom_join_url: zoomData.join_url,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select('id, zoom_meeting_id, zoom_join_url')
    .single();

  return { data, error };
};

// ========== CHECKLIST FUNCTIONS (PRESERVED FROM EXISTING FILE) ==========

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
    
  // Sort tasks by order_index
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
    
  const nextOrderIndex = (existingChecklists?.[0]?.order_index || -1) + 1;

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
    
  const nextOrderIndex = (existingTasks?.[0]?.order_index || -1) + 1;

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
      checklist_count:checklist!event_id(count),
      task_count:checklist!event_id(tasks(count))
    `)
    .eq('is_deleted', false);
    
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

// ========== UTILITY FUNCTIONS ==========

/**
 * Duplicate an event
 */
export const duplicateEvent = async (eventId, options = {}) => {
  const { 
    newTitle, 
    newStartTime, 
    newEndTime,
    includeContacts = true, 
    includeCompanies = true, 
    includeProjects = true,
    includeChecklists = false
  } = options;

  // Get the original event
  const { data: originalEvent, error: fetchError } = await fetchEventById(eventId);
  
  if (fetchError) {
    return { data: null, error: fetchError };
  }

  // Prepare new event data
  const { 
    id, 
    created_at, 
    updated_at, 
    google_event_id,
    zoom_meeting_id,
    zoom_join_url,
    contacts,
    companies, 
    projects,
    event_checklists,
    child_events,
    ...eventData 
  } = originalEvent;
  
  const newEventData = {
    ...eventData,
    title: newTitle || `${originalEvent.title} (Copy)`,
    start_time: newStartTime || originalEvent.start_time,
    end_time: newEndTime || originalEvent.end_time,
    status: 'scheduled',
    // Reset integration fields
    google_event_id: null,
    zoom_meeting_id: null,
    zoom_join_url: null
  };

  // Create new event
  const { data: newEvent, error: createError } = await insertEvent(newEventData);
  
  if (createError) {
    return { data: null, error: createError };
  }

  // Copy relationships
  if (includeContacts && contacts && contacts.length > 0) {
    await linkContactsToEvent(newEvent.id, contacts.map(c => c.id));
  }

  if (includeCompanies && companies && companies.length > 0) {
    await linkCompaniesToEvent(newEvent.id, companies.map(c => c.id));
  }

  if (includeProjects && projects && projects.length > 0) {
    await linkProjectsToEvent(newEvent.id, projects.map(p => p.id));
  }

  if (includeChecklists && event_checklists && event_checklists.length > 0) {
    const checklistCreationPromises = event_checklists.map(checklist => 
      createEventChecklist(newEvent.id, checklist.title, originalEvent.author_id, checklist.type)
    );

    await Promise.all(checklistCreationPromises);
  }

  return { data: newEvent, error: null };
};

/**
 * Get event statistics
 */
export const getEventStats = async (dateRange = null) => {
  let query = supabase
    .from('event')
    .select('id, type, status, start_time, all_day')
    .eq('is_deleted', false);

  if (dateRange) {
    query = query.gte('start_time', dateRange.start)
                  .lte('start_time', dateRange.end);
  }

  const { data, error } = await query;

  if (error) {
    return { data: null, error };
  }

  const stats = {
    total: data.length,
    byType: {
      meeting: data.filter(e => e.type === 'meeting').length,
      vacation: data.filter(e => e.type === 'vacation').length,
      appointment: data.filter(e => e.type === 'appointment').length,
      other: data.filter(e => e.type === 'other').length
    },
    byStatus: {
      scheduled: data.filter(e => e.status === 'scheduled').length,
      in_progress: data.filter(e => e.status === 'in_progress').length,
      completed: data.filter(e => e.status === 'completed').length,
      cancelled: data.filter(e => e.status === 'cancelled').length
    },
    allDay: data.filter(e => e.all_day).length
  };

  return { data: stats, error: null };
};