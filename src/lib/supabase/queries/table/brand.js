// lib/supabase/queries/table/brand.js

import { createClient } from '@/lib/supabase/browser';
const supabase = createClient();

/**
 * Get a single brand by ID with all related data
 */
export const fetchBrandById = async (id) => {
  const { data, error } = await supabase
    .from('brand')
    .select(`
      *,
      company:company_id(id, title),
      author:author_id(id, title, email),
      parent:parent_id(id, title),
      projects:brand_project(
        project:project_id(id, title, status)
      ),
      tags:brand_category(
        category:category_id(id, title)
      ),
      inspiration_media:brand_media(
        media:media_id(id, title, url, alt_text, mime_type)
      ),
      brand_board_media:media!brand_board(id, title, url, alt_text),
      primary_font_media:media!primary_font(id, title, url, alt_text),
      secondary_font_media:media!secondary_font(id, title, url, alt_text),
      body_font_media:media!body_font(id, title, url, alt_text),
      accent_font_media:media!accent_font(id, title, url, alt_text),
      primary_square_logo_media:media!primary_square_logo(id, title, url, alt_text),
      secondary_square_logo_media:media!secondary_square_logo(id, title, url, alt_text),
      primary_horizontal_logo_media:media!primary_horizontal_logo(id, title, url, alt_text),
      secondary_horizontal_logo_media:media!secondary_horizontal_logo(id, title, url, alt_text),
      favicon_media:media!favicon(id, title, url, alt_text)
    `)
    .eq('id', id)
    .single();

  // Transform the data for easier use
  if (data) {
    data.projects = data.projects?.map(p => p.project) || [];
    data.tags = data.tags?.map(t => t.category) || [];
    data.inspiration = data.inspiration_media?.map(im => im.media) || [];
  }

  return { data, error };
};

/**
 * Get all brands with optional filters
 */
export const fetchAllBrands = async (filters = {}) => {
  let query = supabase
    .from('brand')
    .select(`
      id,
      title,
      status,
      primary_color,
      secondary_color,
      created_at,
      updated_at,
      company:company_id(id, title),
      author:author_id(id, title),
      project_count:brand_project(count),
      primary_square_logo_media:media!primary_square_logo(url, alt_text)
    `);

  // Apply filters
  if (filters.search) {
    query = query.ilike('title', `%${filters.search}%`);
  }
  
  if (filters.status && filters.status.length > 0) {
    query = query.in('status', filters.status);
  }
  
  if (filters.company_id) {
    query = query.eq('company_id', filters.company_id);
  }

  // Apply sorting
  if (filters.sort) {
    const [field, direction] = filters.sort.split(':');
    query = query.order(field, { ascending: direction === 'asc' });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  const { data, error } = await query;
  return { data, error };
};

/**
 * Create a new brand
 */
export const createBrand = async (brandData) => {
  const { data, error } = await supabase
    .from('brand')
    .insert([{
      ...brandData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }])
    .select(`
      *,
      company:company_id(id, title),
      author:author_id(id, title)
    `)
    .single();

  return { data, error };
};

/**
 * Update a brand
 */
export const updateBrand = async (id, updates) => {
  const { data, error } = await supabase
    .from('brand')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select(`
      *,
      company:company_id(id, title),
      author:author_id(id, title)
    `)
    .single();

  return { data, error };
};

/**
 * Delete a brand (soft delete)
 */
export const deleteBrand = async (id, softDelete = true) => {
  if (softDelete) {
    const { error } = await supabase
      .from('brand')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
    return { success: !error, error };
  } else {
    const { error } = await supabase
      .from('brand')
      .delete()
      .eq('id', id);
    return { success: !error, error };
  }
};

/**
 * Get brand color tokens
 */
export const fetchBrandColorTokens = async (brandId) => {
  const { data, error } = await supabase
    .from('brand')
    .select(`
      primary_color,
      secondary_color,
      neutral_color_100,
      neutral_color_900,
      success_color,
      error_color,
      warning_color,
      info_color,
      alt_color_1,
      alt_color_2,
      alt_color_3,
      alt_color_4
    `)
    .eq('id', brandId)
    .single();

  return { data, error };
};

/**
 * Update brand color tokens
 */
export const updateBrandColorTokens = async (brandId, colorTokens) => {
  const { data, error } = await supabase
    .from('brand')
    .update({
      ...colorTokens,
      updated_at: new Date().toISOString()
    })
    .eq('id', brandId)
    .select('id, primary_color, secondary_color')
    .single();

  return { data, error };
};

/**
 * Get brand typography tokens (stored as JSON or separate fields)
 */
export const fetchBrandTypographyTokens = async (brandId) => {
  const { data, error } = await supabase
    .from('brand')
    .select(`
      typography_tokens,
      primary_font,
      italic_primary_font,
      secondary_font,
      italic_secondary_font,
      body_font,
      italic_body_font,
      accent_font,
      italic_accent_font
    `)
    .eq('id', brandId)
    .single();

  return { data, error };
};

/**
 * Update brand typography tokens
 */
export const updateBrandTypographyTokens = async (brandId, typographyTokens) => {
  const { data, error } = await supabase
    .from('brand')
    .update({
      typography_tokens: typographyTokens,
      updated_at: new Date().toISOString()
    })
    .eq('id', brandId)
    .select('id, typography_tokens')
    .single();

  return { data, error };
};

/**
 * Get brand media assets (logos, fonts, etc.)
 */
export const fetchBrandMediaAssets = async (brandId) => {
  const { data, error } = await supabase
    .from('brand')
    .select(`
      id,
      brand_board,
      brand_folder,
      images_folder,
      canva_folder,
      primary_font,
      secondary_font,
      body_font,
      accent_font,
      primary_square_logo,
      secondary_square_logo,
      primary_horizontal_logo,
      secondary_horizontal_logo,
      favicon,
      brand_board_media:media!brand_board(*),
      primary_square_logo_media:media!primary_square_logo(*),
      secondary_square_logo_media:media!secondary_square_logo(*),
      primary_horizontal_logo_media:media!primary_horizontal_logo(*),
      secondary_horizontal_logo_media:media!secondary_horizontal_logo(*),
      favicon_media:media!favicon(*)
    `)
    .eq('id', brandId)
    .single();

  return { data, error };
};

/**
 * Add inspiration media to brand
 */
export const addBrandInspiration = async (brandId, mediaIds) => {
  if (!Array.isArray(mediaIds)) {
    mediaIds = [mediaIds];
  }

  const insertData = mediaIds.map(mediaId => ({
    brand_id: brandId,
    media_id: mediaId,
    created_at: new Date().toISOString()
  }));

  const { data, error } = await supabase
    .from('brand_media')
    .insert(insertData)
    .select(`
      media:media_id(id, title, url, alt_text, file_type)
    `);

  return { 
    data: data?.map(item => item.media) || [], 
    error 
  };
};

/**
 * Remove inspiration media from brand
 */
export const removeBrandInspiration = async (brandId, mediaIds) => {
  if (!Array.isArray(mediaIds)) {
    mediaIds = [mediaIds];
  }

  const { error } = await supabase
    .from('brand_media')
    .delete()
    .eq('brand_id', brandId)
    .in('media_id', mediaIds);

  return { success: !error, error };
};

/**
 * Get brand inspiration gallery
 */
export const fetchBrandInspiration = async (brandId) => {
  const { data, error } = await supabase
    .from('brand_media')
    .select(`
      media:media_id(
        id,
        title,
        url,
        alt_text,
        file_type,
        file_size,
        created_at
      )
    `)
    .eq('brand_id', brandId)
    .order('created_at', { ascending: false });

  return { 
    data: data?.map(item => item.media) || [], 
    error 
  };
};

/**
 * Link projects to brand
 */
export const linkProjectsToBrand = async (brandId, projectIds) => {
  if (!Array.isArray(projectIds)) {
    projectIds = [projectIds];
  }

  // Remove existing links first
  await supabase
    .from('brand_project')
    .delete()
    .eq('brand_id', brandId);

  // Add new links
  const insertData = projectIds.map(projectId => ({
    brand_id: brandId,
    project_id: projectId,
    created_at: new Date().toISOString()
  }));

  const { data, error } = await supabase
    .from('brand_project')
    .insert(insertData)
    .select(`
      project:project_id(id, title, status)
    `);

  return { 
    data: data?.map(item => item.project) || [], 
    error 
  };
};

/**
 * Link tags to brand
 */
export const linkTagsToBrand = async (brandId, categoryIds) => {
  if (!Array.isArray(categoryIds)) {
    categoryIds = [categoryIds];
  }

  // Remove existing links first
  await supabase
    .from('brand_category')
    .delete()
    .eq('brand_id', brandId);

  // Add new links
  const insertData = categoryIds.map(categoryId => ({
    brand_id: brandId,
    category_id: categoryId,
    created_at: new Date().toISOString()
  }));

  const { data, error } = await supabase
    .from('brand_category')
    .insert(insertData)
    .select(`
      category:category_id(id, title)
    `);

  return { 
    data: data?.map(item => item.category) || [], 
    error 
  };
};

/**
 * Get brands by company
 */
export const fetchBrandsByCompany = async (companyId) => {
  const { data, error } = await supabase
    .from('brand')
    .select(`
      id,
      title,
      status,
      primary_color,
      secondary_color,
      primary_square_logo_media:media!primary_square_logo(url, alt_text)
    `)
    .eq('company_id', companyId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });

  return { data, error };
};

/**
 * Get primary brand for a company
 */
export const fetchPrimaryBrandByCompany = async (companyId) => {
  const { data, error } = await supabase
    .from('brand')
    .select('*')
    .eq('company_id', companyId)
    .eq('status', 'primary')
    .eq('is_deleted', false)
    .single();

  return { data, error };
};

/**
 * Set brand as primary for company
 */
export const setBrandAsPrimary = async (brandId, companyId) => {
  // First, unset any existing primary brands for this company
  await supabase
    .from('brand')
    .update({ status: 'secondary' })
    .eq('company_id', companyId)
    .eq('status', 'primary');

  // Then set this brand as primary
  const { data, error } = await supabase
    .from('brand')
    .update({ 
      status: 'primary',
      updated_at: new Date().toISOString()
    })
    .eq('id', brandId)
    .select('*')
    .single();

  return { data, error };
};

/**
 * Generate CSS variables from brand colors
 */
export const generateBrandCSS = async (brandId) => {
  const { data: brand, error } = await fetchBrandColorTokens(brandId);
  
  if (error || !brand) {
    return { data: null, error };
  }

  const cssVariables = `
:root {
  --primary-color-500: ${brand.primary_color || '#3B82F6'};
  --secondary-color-500: ${brand.secondary_color || '#10B981'};
  --neutral-color-100: ${brand.neutral_color_100 || '#F3F4F6'};
  --neutral-color-900: ${brand.neutral_color_900 || '#111827'};
  --success-color-500: ${brand.success_color || '#10B981'};
  --error-color-500: ${brand.error_color || '#EF4444'};
  --warning-color-500: ${brand.warning_color || '#F59E0B'};
  --info-color-500: ${brand.info_color || '#3B82F6'};
  --alt-color-1: ${brand.alt_color_1 || '#8B5CF6'};
  --alt-color-2: ${brand.alt_color_2 || '#EC4899'};
  --alt-color-3: ${brand.alt_color_3 || '#F97316'};
  --alt-color-4: ${brand.alt_color_4 || '#84CC16'};
}`;

  return { data: cssVariables, error: null };
};

/**
 * Duplicate a brand
 */
export const duplicateBrand = async (brandId, newTitle) => {
  // Get the original brand
  const { data: originalBrand, error: fetchError } = await fetchBrandById(brandId);
  
  if (fetchError) {
    return { data: null, error: fetchError };
  }

  // Create new brand data (excluding id, created_at, updated_at)
  const { id, created_at, updated_at, projects, tags, inspiration, ...brandData } = originalBrand;
  
  const newBrandData = {
    ...brandData,
    title: newTitle || `${originalBrand.title} (Copy)`,
    status: 'secondary' // Don't duplicate as primary
  };

  // Create the new brand
  const { data: newBrand, error: createError } = await createBrand(newBrandData);
  
  if (createError) {
    return { data: null, error: createError };
  }

  // Copy relationships
  if (projects && projects.length > 0) {
    await linkProjectsToBrand(newBrand.id, projects.map(p => p.id));
  }

  if (tags && tags.length > 0) {
    await linkTagsToBrand(newBrand.id, tags.map(t => t.id));
  }

  if (inspiration && inspiration.length > 0) {
    await addBrandInspiration(newBrand.id, inspiration.map(i => i.id));
  }

  return { data: newBrand, error: null };
};

/**
 * Update brand company relationship
 */
export const updateBrandCompany = async (brandId, companyId) => {
  const { data, error } = await supabase
    .from('brand')
    .update({
      company_id: companyId,
      updated_at: new Date().toISOString()
    })
    .eq('id', brandId)
    .select(`
      *,
      company:company_id(id, title)
    `)
    .single();

  return { data, error };
};

/**
 * Remove specific alt color (set to null)
 */
export const removeAltColor = async (brandId, colorKey) => {
  const updateData = {
    [colorKey]: null,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('brand')
    .update(updateData)
    .eq('id', brandId)
    .select('id, alt_color_1, alt_color_2, alt_color_3, alt_color_4')
    .single();

  return { data, error };
};

/**
 * Update brand title
 */
export const updateBrandTitle = async (brandId, title) => {
  const { data, error } = await supabase
    .from('brand')
    .update({
      title: title.trim(),
      updated_at: new Date().toISOString()
    })
    .eq('id', brandId)
    .select('id, title')
    .single();

  return { data, error };
};