import { createClient } from '@/lib/supabase/browser';

const supabase = createClient();

/**
 * Get events for a project
 */
export const fetchEventsForProject = async (projectId) => {
  return await supabase
    .from('event_project')
    .select(`
      event_id,
      event:event_id(*)
    `)
    .eq('project_id', projectId);
};

/**
 * Get projects for an event
 */
export const fetchProjectsForEvent = async (eventId) => {
  return await supabase
    .from('event_project')
    .select(`
      project_id,
      project:project_id(*)
    `)
    .eq('event_id', eventId);
};

/**
 * Link an event to a project
 */
export const linkEventToProject = async (eventId, projectId) => {
  // Check if the relationship already exists
  const { data: existing } = await supabase
    .from('event_project')
    .select('*')
    .eq('event_id', eventId)
    .eq('project_id', projectId)
    .maybeSingle();

  if (existing) {
    return { data: existing, error: null };
  }

  return await supabase
    .from('event_project')
    .insert({ event_id: eventId, project_id: projectId })
    .select();
};

/**
 * Unlink an event from a project
 */
export const unlinkEventFromProject = async (eventId, projectId) => {
  return await supabase
    .from('event_project')
    .delete()
    .eq('event_id', eventId)
    .eq('project_id', projectId);
};

/**
 * Update event_project relationship metadata
 */
export const updateEventProject = async (eventId, projectId, metadata) => {
  return await supabase
    .from('event_project')
    .update(metadata)
    .eq('event_id', eventId)
    .eq('project_id', projectId);
};

/**
 * Batch link events to a project
 */
export const linkEventsToProject = async (eventIds, projectId) => {
  if (!eventIds || !eventIds.length) {
    return { data: [], error: null };
  }

  const insertData = eventIds.map(eventId => ({
    event_id: eventId,
    project_id: projectId
  }));

  return await supabase
    .from('event_project')
    .upsert(insertData, { onConflict: ['event_id', 'project_id'] })
    .select();
};

/**
 * Batch link projects to an event
 */
export const linkProjectsToEvent = async (projectIds, eventId) => {
  if (!projectIds || !projectIds.length) {
    return { data: [], error: null };
  }

  const insertData = projectIds.map(projectId => ({
    event_id: eventId,
    project_id: projectId
  }));

  return await supabase
    .from('event_project')
    .upsert(insertData, { onConflict: ['event_id', 'project_id'] })
    .select();
};

/**
 * Replace all event relationships for a project
 */
export const replaceEventsForProject = async (eventIds, projectId) => {
  // First delete all existing relationships
  const { error: deleteError } = await supabase
    .from('event_project')
    .delete()
    .eq('project_id', projectId);

  if (deleteError) {
    return { data: null, error: deleteError };
  }

  // If no events to add, we're done
  if (!eventIds || !eventIds.length) {
    return { data: [], error: null };
  }

  // Add new relationships
  return await linkEventsToProject(eventIds, projectId);
};

/**
 * Replace all project relationships for an event
 */
export const replaceProjectsForEvent = async (projectIds, eventId) => {
  // First delete all existing relationships
  const { error: deleteError } = await supabase
    .from('event_project')
    .delete()
    .eq('event_id', eventId);

  if (deleteError) {
    return { data: null, error: deleteError };
  }

  // If no projects to add, we're done
  if (!projectIds || !projectIds.length) {
    return { data: [], error: null };
  }

  // Add new relationships
  return await linkProjectsToEvent(projectIds, eventId);
};

/**
 * Get events for a project by type
 */
export const fetchEventsForProjectByType = async (projectId, eventType) => {
  return await supabase
    .from('event_project')
    .select(`
      event_id,
      event:event_id(*)
    `)
    .eq('project_id', projectId)
    .eq('event.type', eventType);
};

/**
 * Get events for a project by date range
 */
export const fetchEventsForProjectByDateRange = async (projectId, startDate, endDate) => {
  return await supabase
    .from('event_project')
    .select(`
      event_id,
      event:event_id(*)
    `)
    .eq('project_id', projectId)
    .gte('event.start_date', startDate)
    .lte('event.end_date', endDate);
};