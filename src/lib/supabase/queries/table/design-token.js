// lib/supabase/queries/table/design-token.js

import { createClient } from '@/lib/supabase/browser';
const supabase = createClient();

/**
 * Get all design tokens for a brand, organized by group
 */
export const fetchBrandDesignTokens = async (brandId) => {
  const { data, error } = await supabase
    .from('design_token')
    .select('*')
    .eq('brand_id', brandId)
    .eq('is_deleted', false)
    .order('group')
    .order('token');
    
  if (error) {
    return { data: null, error };
  }

  // Transform into grouped format for easier use
  const tokens = {};
  data?.forEach(token => {
    const group = token.group || 'other';
    if (!tokens[group]) {
      tokens[group] = {};
    }
    
    tokens[group][token.token] = {
      value: token.resolved || token.value,
      type: token.type,
      mode: token.mode,
      description: token.description,
      id: token.id
    };
  });
  
  return { data: tokens, error: null };
};

/**
 * Get all design tokens (flat list)
 */
export const fetchAllDesignTokens = async (brandId) => {
  const { data, error } = await supabase
    .from('design_token')
    .select('*')
    .eq('brand_id', brandId)
    .eq('is_deleted', false)
    .order('group')
    .order('token');

  return { data, error };
};

/**
 * Create a new design token
 */
export const createDesignToken = async (tokenData) => {
  const { data, error } = await supabase
    .from('design_token')
    .insert([{
      ...tokenData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }])
    .select('*')
    .single();

  return { data, error };
};

/**
 * Update a design token
 */
export const updateDesignToken = async (id, updates) => {
  const { data, error } = await supabase
    .from('design_token')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select('*')
    .single();

  return { data, error };
};

/**
 * Delete a design token (soft delete)
 */
export const deleteDesignToken = async (id, softDelete = true) => {
  if (softDelete) {
    const { error } = await supabase
      .from('design_token')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
    return { success: !error, error };
  } else {
    const { error } = await supabase
      .from('design_token')
      .delete()
      .eq('id', id);
    return { success: !error, error };
  }
};

/**
 * Get tokens by group for a brand
 */
export const fetchTokensByGroup = async (brandId, group) => {
  const { data, error } = await supabase
    .from('design_token')
    .select('*')
    .eq('brand_id', brandId)
    .eq('group', group)
    .eq('is_deleted', false)
    .order('token');

  return { data, error };
};

/**
 * Get color tokens specifically
 */
export const fetchColorTokens = async (brandId) => {
  return fetchTokensByGroup(brandId, 'colors');
};

/**
 * Get typography tokens specifically
 */
export const fetchTypographyTokens = async (brandId) => {
  return fetchTokensByGroup(brandId, 'typography');
};

/**
 * Get spacing tokens specifically
 */
export const fetchSpacingTokens = async (brandId) => {
  return fetchTokensByGroup(brandId, 'spacing');
};

/**
 * Bulk create design tokens
 */
export const createBulkDesignTokens = async (tokensArray) => {
  const timestamp = new Date().toISOString();
  const tokensWithTimestamp = tokensArray.map(token => ({
    ...token,
    created_at: timestamp,
    updated_at: timestamp
  }));

  const { data, error } = await supabase
    .from('design_token')
    .insert(tokensWithTimestamp)
    .select('*');

  return { data, error };
};

/**
 * Generate CSS custom properties from brand tokens
 */
export const generateCSSFromTokens = async (brandId) => {
  const { data: tokens, error } = await fetchBrandDesignTokens(brandId);
  
  if (error || !tokens) {
    return { data: null, error };
  }

  let css = ':root {\n';
  
  // Process each group
  Object.entries(tokens).forEach(([groupName, groupTokens]) => {
    css += `  /* ${groupName} tokens */\n`;
    
    Object.entries(groupTokens).forEach(([tokenName, token]) => {
      const cssVarName = `--${groupName}-${tokenName}`.replace(/[A-Z]/g, '-$&').toLowerCase();
      css += `  ${cssVarName}: ${token.value};\n`;
    });
    
    css += '\n';
  });
  
  css += '}';
  
  return { data: css, error: null };
};

/**
 * Clone tokens from one brand to another
 */
export const cloneBrandTokens = async (sourceBrandId, targetBrandId, authorId) => {
  // Get all tokens from source brand
  const { data: sourceTokens, error: fetchError } = await fetchAllDesignTokens(sourceBrandId);
  
  if (fetchError) {
    return { data: null, error: fetchError };
  }

  // Prepare tokens for target brand
  const clonedTokens = sourceTokens.map(token => ({
    title: token.title,
    token: token.token,
    description: token.description,
    value: token.value,
    resolved: token.resolved,
    mode: token.mode,
    group: token.group,
    type: token.type,
    brand_id: targetBrandId,
    author_id: authorId,
    parent_id: token.id // Reference to original token
  }));

  // Insert cloned tokens
  const { data, error } = await createBulkDesignTokens(clonedTokens);
  
  return { data, error };
};

/**
 * Search tokens across multiple brands
 */
export const searchDesignTokens = async (searchTerm, brandIds = []) => {
  let query = supabase
    .from('design_token')
    .select(`
      *,
      brand:brand_id(id, title)
    `)
    .eq('is_deleted', false);

  // Add search filters
  if (searchTerm) {
    query = query.or(`title.ilike.%${searchTerm}%,token.ilike.%${searchTerm}%,value.ilike.%${searchTerm}%`);
  }

  if (brandIds.length > 0) {
    query = query.in('brand_id', brandIds);
  }

  const { data, error } = await query.order('brand_id').order('group').order('token');
  
  return { data, error };
};

/**
 * Get token usage statistics
 */
export const getTokenUsageStats = async (brandId) => {
  const { data, error } = await supabase
    .from('design_token')
    .select('group, type')
    .eq('brand_id', brandId)
    .eq('is_deleted', false);

  if (error) {
    return { data: null, error };
  }

  // Calculate statistics
  const stats = {
    total: data.length,
    byGroup: {},
    byType: {}
  };

  data.forEach(token => {
    // Count by group
    const group = token.group || 'other';
    stats.byGroup[group] = (stats.byGroup[group] || 0) + 1;

    // Count by type
    const type = token.type || 'other';
    stats.byType[type] = (stats.byType[type] || 0) + 1;
  });

  return { data: stats, error: null };
};