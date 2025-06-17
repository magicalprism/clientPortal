import { createClient } from '@/lib/supabase/browser';

const supabase = createClient();

/**
 * Get a single login event by ID
 */
export const fetchLoginEventById = async (id) => {
  return await supabase
    .from('login_event')
    .select('*')
    .eq('id', id)
    .single();
};

/**
 * Get all login events
 */
export const fetchAllLoginEvents = async () => {
  return await supabase
    .from('login_event')
    .select('*')
    .order('created_at', { ascending: false });
};

/**
 * Insert a new login event
 */
export const insertLoginEvent = async (eventData) => {
  return await supabase
    .from('login_event')
    .insert(eventData)
    .select()
    .single();
};

/**
 * Update login event by ID
 */
export const updateLoginEventById = async (id, updates) => {
  return await supabase
    .from('login_event')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
};

/**
 * Delete login event by ID
 */
export const deleteLoginEventById = async (id) => {
  return await supabase
    .from('login_event')
    .delete()
    .eq('id', id);
};

/**
 * Get login events by contact ID
 */
export const fetchLoginEventsByContactId = async (contactId) => {
  return await supabase
    .from('login_event')
    .select('*')
    .eq('contact_id', contactId)
    .order('created_at', { ascending: false });
};

/**
 * Get login events by event type
 */
export const fetchLoginEventsByType = async (eventType) => {
  return await supabase
    .from('login_event')
    .select('*')
    .eq('event_type', eventType)
    .order('created_at', { ascending: false });
};

/**
 * Get login events by date range
 */
export const fetchLoginEventsByDateRange = async (startDate, endDate) => {
  return await supabase
    .from('login_event')
    .select('*')
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at', { ascending: false });
};

/**
 * Get login events with contact details
 */
export const fetchLoginEventsWithContactDetails = async () => {
  return await supabase
    .from('login_event')
    .select(`
      *,
      contact:contact_id(id, title, email)
    `)
    .order('created_at', { ascending: false });
};

/**
 * Log a login event
 * Convenience function for the common use case
 */
export const logLoginEvent = async (contactId, eventType, details = {}) => {
  const eventData = {
    contact_id: contactId,
    event_type: eventType,
    details,
    created_at: new Date().toISOString()
  };
  
  return await insertLoginEvent(eventData);
};