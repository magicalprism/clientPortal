// src/lib/supabase/queries/pivot/category_email.js
import { createClient } from '@/lib/supabase/browser';

const supabase = createClient();

/**
 * Get all categories (tags) for an email
 */
export const fetchCategoriesForEmail = async (emailId) => {
  const { data, error } = await supabase
    .from('category_email')
    .select(`
      category:category_id(id, title, color)
    `)
    .eq('email_id', emailId);

  if (error) {
    console.error('Error fetching categories for email:', error);
    return [];
  }

  return data?.map(row => row.category) || [];
};

/**
 * Get all emails for a category (tag)
 */
export const fetchEmailsForCategory = async (categoryId) => {
  const { data, error } = await supabase
    .from('category_email')
    .select(`
      email:email_id(id, title, summary, status, created_at, author:author_id(id, title))
    `)
    .eq('category_id', categoryId);

  if (error) {
    console.error('Error fetching emails for category:', error);
    return [];
  }

  return data?.map(row => row.email) || [];
};

/**
 * Link an email to a category (tag)
 */
export const linkEmailToCategory = async (emailId, categoryId) => {
  // Check if the relationship already exists
  const { data: existing } = await supabase
    .from('category_email')
    .select('*')
    .eq('email_id', emailId)
    .eq('category_id', categoryId)
    .maybeSingle();

  if (existing) {
    // Relationship already exists, no need to create it again
    return { data: existing, error: null };
  }

  // Create the relationship
  return await supabase
    .from('category_email')
    .insert({
      email_id: emailId,
      category_id: categoryId,
      created_at: new Date().toISOString()
    });
};

/**
 * Unlink an email from a category (tag)
 */
export const unlinkEmailFromCategory = async (emailId, categoryId) => {
  return await supabase
    .from('category_email')
    .delete()
    .eq('email_id', emailId)
    .eq('category_id', categoryId);
};

/**
 * Link an email to multiple categories (tags)
 */
export const linkEmailToCategories = async (emailId, categoryIds) => {
  if (!categoryIds || categoryIds.length === 0) {
    return { data: null, error: null };
  }

  // Get existing relationships
  const { data: existing } = await supabase
    .from('category_email')
    .select('category_id')
    .eq('email_id', emailId);

  const existingCategoryIds = existing?.map(row => row.category_id) || [];
  
  // Filter out categories that are already linked
  const newCategoryIds = categoryIds.filter(id => !existingCategoryIds.includes(id));

  if (newCategoryIds.length === 0) {
    return { data: null, error: null };
  }

  // Create new relationships
  const relationships = newCategoryIds.map(categoryId => ({
    email_id: emailId,
    category_id: categoryId,
    created_at: new Date().toISOString()
  }));

  return await supabase
    .from('category_email')
    .insert(relationships);
};

/**
 * Update email-category relationships (replace all)
 */
export const updateEmailCategories = async (emailId, categoryIds) => {
  // Delete all existing relationships
  await supabase
    .from('category_email')
    .delete()
    .eq('email_id', emailId);

  if (!categoryIds || categoryIds.length === 0) {
    return { data: null, error: null };
  }

  // Create new relationships
  const relationships = categoryIds.map(categoryId => ({
    email_id: emailId,
    category_id: categoryId,
    created_at: new Date().toISOString()
  }));

  return await supabase
    .from('category_email')
    .insert(relationships);
};