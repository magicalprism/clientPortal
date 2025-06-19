// src/lib/supabase/queries/pivot/contact_email.js
import { createClient } from '@/lib/supabase/browser';

const supabase = createClient();

/**
 * Get all contacts for an email
 */
export const fetchContactsForEmail = async (emailId) => {
  const { data, error } = await supabase
    .from('contact_email')
    .select(`
      contact:contact_id(id, title, email, role, company_id, company:company_id(id, title))
    `)
    .eq('email_id', emailId);

  if (error) {
    console.error('Error fetching contacts for email:', error);
    return [];
  }

  return data?.map(row => row.contact) || [];
};

/**
 * Get all emails for a contact
 */
export const fetchEmailsForContact = async (contactId) => {
  const { data, error } = await supabase
    .from('contact_email')
    .select(`
      email:email_id(id, title, summary, status, created_at, author:author_id(id, title))
    `)
    .eq('contact_id', contactId);

  if (error) {
    console.error('Error fetching emails for contact:', error);
    return [];
  }

  return data?.map(row => row.email) || [];
};

/**
 * Link an email to a contact
 */
export const linkEmailToContact = async (emailId, contactId) => {
  // Check if the relationship already exists
  const { data: existing } = await supabase
    .from('contact_email')
    .select('*')
    .eq('email_id', emailId)
    .eq('contact_id', contactId)
    .maybeSingle();

  if (existing) {
    // Relationship already exists, no need to create it again
    return { data: existing, error: null };
  }

  // Create the relationship
  return await supabase
    .from('contact_email')
    .insert({
      email_id: emailId,
      contact_id: contactId,
      created_at: new Date().toISOString()
    });
};

/**
 * Unlink an email from a contact
 */
export const unlinkEmailFromContact = async (emailId, contactId) => {
  return await supabase
    .from('contact_email')
    .delete()
    .eq('email_id', emailId)
    .eq('contact_id', contactId);
};

/**
 * Link an email to multiple contacts
 */
export const linkEmailToContacts = async (emailId, contactIds) => {
  if (!contactIds || contactIds.length === 0) {
    return { data: null, error: null };
  }

  // Get existing relationships
  const { data: existing } = await supabase
    .from('contact_email')
    .select('contact_id')
    .eq('email_id', emailId);

  const existingContactIds = existing?.map(row => row.contact_id) || [];
  
  // Filter out contacts that are already linked
  const newContactIds = contactIds.filter(id => !existingContactIds.includes(id));

  if (newContactIds.length === 0) {
    return { data: null, error: null };
  }

  // Create new relationships
  const relationships = newContactIds.map(contactId => ({
    email_id: emailId,
    contact_id: contactId,
    created_at: new Date().toISOString()
  }));

  return await supabase
    .from('contact_email')
    .insert(relationships);
};

/**
 * Update email-contact relationships (replace all)
 */
export const updateEmailContacts = async (emailId, contactIds) => {
  // Delete all existing relationships
  await supabase
    .from('contact_email')
    .delete()
    .eq('email_id', emailId);

  if (!contactIds || contactIds.length === 0) {
    return { data: null, error: null };
  }

  // Create new relationships
  const relationships = contactIds.map(contactId => ({
    email_id: emailId,
    contact_id: contactId,
    created_at: new Date().toISOString()
  }));

  return await supabase
    .from('contact_email')
    .insert(relationships);
};