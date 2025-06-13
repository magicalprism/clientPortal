// lib/supabase/queries/table/typography.js

import { createClient } from '@/lib/supabase/browser';
const supabase = createClient();

/**
 * Get a single typography token by ID
 */
export const fetchTypographyById = async (id) => {
  return await supabase
    .from('typography')
    .select('*')
    .eq('id', id)
    .eq('is_deleted', false)
    .single();
};

/**
 * Get all typography tokens
 */
export const fetchAllTypography = async () => {
  return await supabase
    .from('typography')
    .select('*')
    .eq('is_deleted', false)
    .order('group_name', { ascending: true });
};

/**
 * Get typography tokens by brand ID
 */
export const fetchTypographyByBrandId = async (brandId) => {
  return await supabase
    .from('typography')
    .select('*')
    .eq('brand_id', brandId)
    .eq('is_deleted', false)
    .order('group_name', { ascending: true });
};

/**
 * Get typography tokens by category
 */
export const fetchTypographyByCategory = async (brandId, category) => {
  return await supabase
    .from('typography')
    .select('*')
    .eq('brand_id', brandId)
    .eq('category', category)
    .eq('is_deleted', false)
    .order('title', { ascending: true });
};

/**
 * Get typography tokens by type
 */
export const fetchTypographyByType = async (brandId, type) => {
  return await supabase
    .from('typography')
    .select('*')
    .eq('brand_id', brandId)
    .eq('type', type)
    .eq('is_deleted', false)
    .order('group_name', { ascending: true });
};

/**
 * Get semantic typography (for display)
 */
export const fetchSemanticTypography = async (brandId) => {
  return await supabase
    .from('typography')
    .select('*')
    .eq('brand_id', brandId)
    .eq('type', 'alias')
    .in('category', ['display', 'heading', 'body', 'ui'])
    .eq('is_deleted', false)
    .order('category', { ascending: true });
};

/**
 * Create a new typography token
 */
export const createTypography = async (data) => {
  const typographyData = {
    ...data,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  return await supabase
    .from('typography')
    .insert(typographyData)
    .select()
    .single();
};

/**
 * Update typography token by ID
 */
export const updateTypographyById = async (id, updates) => {
  const updateData = {
    ...updates,
    updated_at: new Date().toISOString()
  };

  return await supabase
    .from('typography')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();
};

/**
 * Delete typography token by ID (soft delete)
 */
export const deleteTypographyById = async (id) => {
  return await supabase
    .from('typography')
    .update({ 
      is_deleted: true,
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();
};

/**
 * Delete all typography tokens by brand ID
 */
export const deleteTypographyByBrandId = async (brandId) => {
  return await supabase
    .from('typography')
    .update({ 
      is_deleted: true,
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('brand_id', brandId);
};

/**
 * Bulk create typography tokens
 */
export const createBulkTypography = async (typographyArray) => {
  const typographyData = typographyArray.map(typo => ({
    ...typo,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));

  return await supabase
    .from('typography')
    .insert(typographyData)
    .select();
};

/**
 * Get typography tokens with font data
 */
export const fetchTypographyWithFonts = async (brandId) => {
  return await supabase
    .from('typography')
    .select('*, regular_font_data, italic_font_data')
    .eq('brand_id', brandId)
    .eq('is_deleted', false)
    .order('group_name', { ascending: true });
};

/**
 * Update font data for typography token
 */
export const updateTypographyFontData = async (id, fontData) => {
  const updateData = {
    ...fontData,
    updated_at: new Date().toISOString()
  };

  return await supabase
    .from('typography')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();
};

/**
 * Search typography tokens
 */
export const searchTypography = async (brandId, searchTerm) => {
  return await supabase
    .from('typography')
    .select('*')
    .eq('brand_id', brandId)
    .eq('is_deleted', false)
    .or(`title.ilike.%${searchTerm}%,token.ilike.%${searchTerm}%,font_family.ilike.%${searchTerm}%`)
    .order('group_name', { ascending: true });
};

