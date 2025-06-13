// lib/supabase/queries/table/color.js

import { createClient } from '@/lib/supabase/browser';
const supabase = createClient();

/**
 * Get a single color by ID with all related data
 */
export const fetchColorById = async (id) => {
  const { data, error } = await supabase
    .from('color')
    .select(`
      *,
      brand:brand_id(id, title),
      author:author_id(id, title, email),
      parent_color:parent_id(id, token, value, resolved),
      child_colors:color!parent_id(id, token, value, resolved, type)
    `)
    .eq('id', id)
    .single();

  return { data, error };
};

/**
 * Get all colors with optional filters
 */
export const fetchAllColors = async (filters = {}) => {
  let query = supabase
    .from('color')
    .select(`
      id,
      title,
      token,
      description,
      value,
      resolved,
      mode,
      group,
      type,
      created_at,
      updated_at,
      brand:brand_id(id, title),
      author:author_id(id, title),
      parent_color:parent_id(id, token, resolved)
    `);

  // Apply filters
  if (filters.search) {
    query = query.or(`title.ilike.%${filters.search}%,token.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }
  
  if (filters.mode && filters.mode.length > 0) {
    query = query.in('mode', filters.mode);
  }
  
  if (filters.type && filters.type.length > 0) {
    query = query.in('type', filters.type);
  }
  
  if (filters.brand_id) {
    query = query.eq('brand_id', filters.brand_id);
  }
  
  if (filters.group) {
    query = query.eq('group', filters.group);
  }

  // Apply sorting
  if (filters.sort) {
    const [field, direction] = filters.sort.split(':');
    query = query.order(field, { ascending: direction === 'asc' });
  } else {
    query = query.order('token', { ascending: true });
  }

  const { data, error } = await query;
  return { data, error };
};

/**
 * Create a new color
 */
export const createColor = async (colorData) => {
  const { data, error } = await supabase
    .from('color')
    .insert([{
      ...colorData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }])
    .select(`
      *,
      brand:brand_id(id, title),
      author:author_id(id, title),
      parent_color:parent_id(id, token, resolved)
    `)
    .single();

  return { data, error };
};

/**
 * Update a color
 */
export const updateColor = async (id, updates) => {
  const { data, error } = await supabase
    .from('color')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select(`
      *,
      brand:brand_id(id, title),
      author:author_id(id, title),
      parent_color:parent_id(id, token, resolved)
    `)
    .single();

  return { data, error };
};

/**
 * Delete a color (soft delete)
 */
export const deleteColor = async (id, softDelete = true) => {
  if (softDelete) {
    const { error } = await supabase
      .from('color')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
    return { success: !error, error };
  } else {
    const { error } = await supabase
      .from('color')
      .delete()
      .eq('id', id);
    return { success: !error, error };
  }
};

/**
 * Get colors by brand
 */
export const fetchColorsByBrand = async (brandId, mode = null) => {
  let query = supabase
    .from('color')
    .select(`
      id,
      title,
      token,
      value,
      resolved,
      mode,
      group,
      type,
      parent_color:parent_id(id, token, resolved)
    `)
    .eq('brand_id', brandId)
    .eq('is_deleted', false);

  if (mode) {
    query = query.eq('mode', mode);
  }

  const { data, error } = await query.order('group').order('token');
  return { data, error };
};

/**
 * Get color tokens for a specific mode (light/dark/base)
 */
export const fetchColorTokensByMode = async (brandId, mode) => {
  const { data, error } = await supabase
    .from('color')
    .select(`
      id,
      token,
      value,
      resolved,
      type,
      group
    `)
    .eq('brand_id', brandId)
    .eq('mode', mode)
    .eq('is_deleted', false)
    .order('group')
    .order('token');

  return { data, error };
};

/**
 * Get base colors (foundation colors)
 */
export const fetchBaseColors = async (brandId) => {
  const { data, error } = await supabase
    .from('color')
    .select(`
      id,
      token,
      value,
      resolved,
      group,
      title,
      description
    `)
    .eq('brand_id', brandId)
    .eq('type', 'base')
    .eq('is_deleted', false)
    .order('group')
    .order('token');

  return { data, error };
};

/**
 * Get alias colors (colors that reference other colors)
 */
export const fetchAliasColors = async (brandId) => {
  const { data, error } = await supabase
    .from('color')
    .select(`
      id,
      token,
      value,
      resolved,
      group,
      title,
      description,
      parent_color:parent_id(id, token, resolved)
    `)
    .eq('brand_id', brandId)
    .eq('type', 'alias')
    .eq('is_deleted', false)
    .order('group')
    .order('token');

  return { data, error };
};

/**
 * Get color hierarchy for a brand
 */
export const fetchColorHierarchy = async (brandId) => {
  // Get all colors for the brand
  const { data: allColors, error } = await supabase
    .from('color')
    .select(`
      id,
      token,
      value,
      resolved,
      type,
      group,
      parent_id,
      title
    `)
    .eq('brand_id', brandId)
    .eq('is_deleted', false)
    .order('group')
    .order('token');

  if (error) return { data: null, error };

  // Build hierarchy
  const buildHierarchy = (colors) => {
    const colorMap = new Map();
    const roots = [];

    // Create a map of all colors
    colors.forEach(color => {
      colorMap.set(color.id, { ...color, children: [] });
    });

    // Build the hierarchy
    colors.forEach(color => {
      if (color.parent_id) {
        const parent = colorMap.get(color.parent_id);
        if (parent) {
          parent.children.push(colorMap.get(color.id));
        }
      } else {
        roots.push(colorMap.get(color.id));
      }
    });

    return roots;
  };

  const hierarchy = buildHierarchy(allColors);
  return { data: hierarchy, error: null };
};

/**
 * Get color groups for a brand
 */
export const fetchColorGroups = async (brandId) => {
  const { data, error } = await supabase
    .from('color')
    .select('group')
    .eq('brand_id', brandId)
    .eq('is_deleted', false)
    .not('group', 'is', null);

  if (error) return { data: null, error };

  // Get unique groups
  const uniqueGroups = [...new Set(data.map(item => item.group))].filter(Boolean);
  return { data: uniqueGroups, error: null };
};

/**
 * Generate CSS variables from color tokens
 */
export const generateColorCSS = async (brandId, mode = 'base') => {
  const { data: colors, error } = await fetchColorTokensByMode(brandId, mode);
  
  if (error || !colors) {
    return { data: null, error };
  }

  const cssVariables = colors
    .map(color => `  ${color.token}: ${color.resolved || color.value};`)
    .join('\n');

  const css = `:root {\n${cssVariables}\n}`;

  return { data: css, error: null };
};

/**
 * Generate design token JSON
 */
export const generateTokenJSON = async (brandId) => {
  const { data: colors, error } = await fetchColorsByBrand(brandId);
  
  if (error || !colors) {
    return { data: null, error };
  }

  // Group by mode and type
  const tokens = {
    base: {},
    alias: {}
  };

  colors.forEach(color => {
    const category = color.type === 'base' ? 'base' : 'alias';
    const group = color.group || 'default';
    
    if (!tokens[category][group]) {
      tokens[category][group] = {};
    }
    
    tokens[category][group][color.token] = {
      value: color.value,
      resolved: color.resolved,
      mode: color.mode,
      description: color.description
    };
  });

  return { data: tokens, error: null };
};

/**
 * Resolve color value (for alias colors that reference others)
 */
export const resolveColorValue = async (colorId) => {
  const { data: color, error } = await fetchColorById(colorId);
  
  if (error || !color) {
    return { data: null, error };
  }

  // If it's a base color, return its value
  if (color.type === 'base') {
    return { data: color.value, error: null };
  }

  // If it's an alias, resolve the parent
  if (color.parent_id) {
    return await resolveColorValue(color.parent_id);
  }

  // Fallback to the color's own value
  return { data: color.value, error: null };
};

/**
 * Duplicate colors to different mode
 */
export const duplicateColorsToMode = async (brandId, fromMode, toMode) => {
  const { data: sourceColors, error: fetchError } = await fetchColorTokensByMode(brandId, fromMode);
  
  if (fetchError || !sourceColors) {
    return { data: null, error: fetchError };
  }

  // Create new colors for the target mode
  const duplicatedColors = sourceColors.map(color => ({
    title: color.title,
    token: color.token,
    value: color.value,
    resolved: color.resolved,
    mode: toMode,
    group: color.group,
    type: color.type,
    brand_id: brandId
  }));

  const { data, error } = await supabase
    .from('color')
    .insert(duplicatedColors)
    .select();

  return { data, error };
};

/**
 * Import colors from CSS variables
 */
export const importColorsFromCSS = async (brandId, cssText, mode = 'base', authorId) => {
  // Parse CSS variables
  const variableRegex = /--([^:]+):\s*([^;]+);/g;
  const colors = [];
  let match;

  while ((match = variableRegex.exec(cssText)) !== null) {
    const token = `--${match[1].trim()}`;
    const value = match[2].trim();
    
    colors.push({
      title: token.replace('--', '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      token: token,
      value: value,
      resolved: value,
      mode: mode,
      type: 'base',
      brand_id: brandId,
      author_id: authorId
    });
  }

  if (colors.length === 0) {
    return { data: [], error: null };
  }

  const { data, error } = await supabase
    .from('color')
    .insert(colors)
    .select();

  return { data, error };
};

/**
 * Get colors that reference a specific color (find dependencies)
 */
export const fetchColorDependencies = async (colorId) => {
  const { data, error } = await supabase
    .from('color')
    .select(`
      id,
      token,
      value,
      title,
      type
    `)
    .eq('parent_id', colorId)
    .eq('is_deleted', false)
    .order('token');

  return { data, error };
};

/**
 * Alias for fetchColorsByBrand - for component compatibility
 */
export const fetchColorsByBrandId = async (brandId) => {
  return await fetchColorsByBrand(brandId);
};

/**
 * Delete colors by brand and group (for alt color removal)
 */
export const deleteColorsByBrandAndGroup = async (brandId, group) => {
  const { error } = await supabase
    .from('color')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('brand_id', brandId)
    .eq('group', group);

  return { success: !error, error };
};

/**
 * Batch update color values
 */
export const batchUpdateColors = async (colorUpdates) => {
  const updates = colorUpdates.map(({ id, ...updateData }) =>
    supabase
      .from('color')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
  );

  const results = await Promise.all(updates);
  const errors = results.filter(result => result.error);

  return {
    success: errors.length === 0,
    errors: errors.map(result => result.error)
  };
};