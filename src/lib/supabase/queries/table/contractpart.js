// lib/supabase/queries/table/contractpart.js

import { createClient } from '@/lib/supabase/browser';
const supabase = createClient();

/**
 * Get a single contract part by ID with all related data
 */
export const fetchContractPartById = async (id) => {
  const { data, error } = await supabase
    .from('contractpart')
    .select(`
      *,
      author:author_id(id, title, email),
      parent:parent_id(id, title),
      tags:category_contractpart(
        category:category_id(id, title)
      ),
      child_parts:contractpart!parent_id(id, title, status, order_index)
    `)
    .eq('id', id)
    .single();

  // Transform tags data
  if (data && data.tags) {
    data.tags = data.tags.map(t => t.category);
  }

  return { data, error };
};

/**
 * Get all contract parts with optional filters
 */
export const fetchAllContractParts = async (filters = {}) => {
  let query = supabase
    .from('contractpart')
    .select(`
      id,
      title,
      content,
      status,
      is_required,
      is_active,
      insert_if_missing,
      show_if_products,
      required_initials,
      order_index,
      created_at,
      updated_at,
      author:author_id(id, title),
      parent:parent_id(id, title),
      child_count:contractpart!parent_id(count)
    `)
    .eq('is_deleted', false);

  // Apply filters
  if (filters.status && filters.status.length > 0) {
    query = query.in('status', filters.status);
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

  if (filters.is_active !== undefined) {
    query = query.eq('is_active', filters.is_active);
  }

  if (filters.is_required !== undefined) {
    query = query.eq('is_required', filters.is_required);
  }

  // Apply sorting
  if (filters.sort) {
    const [field, direction] = filters.sort.split(':');
    query = query.order(field, { ascending: direction === 'asc' });
  } else {
    // Default sorting: by order_index, then by created_at
    query = query.order('order_index', { ascending: true });
    query = query.order('created_at', { ascending: true });
  }

  const { data, error } = await query;
  return { data, error };
};

/**
 * Create a new contract part
 */
export const createContractPart = async (contractPartData) => {
  // Get current max order_index for the parent
  const parentCondition = contractPartData.parent_id 
    ? { parent_id: contractPartData.parent_id }
    : { parent_id: null };

  const { data: existingParts } = await supabase
    .from('contractpart')
    .select('order_index')
    .match(parentCondition)
    .order('order_index', { ascending: false })
    .limit(1);
    
  const nextSortOrder = (existingParts?.[0]?.order_index || -1) + 1;

  const { data, error } = await supabase
    .from('contractpart')
    .insert([{
      ...contractPartData,
      status: contractPartData.status || 'todo',
      order_index: contractPartData.order_index ?? nextSortOrder,
      is_active: contractPartData.is_active ?? true,
      is_required: contractPartData.is_required ?? false,
      insert_if_missing: contractPartData.insert_if_missing ?? false,
      required_initials: contractPartData.required_initials ?? false,
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

/**
 * Update contract part
 */
export const updateContractPart = async (id, updates) => {
  const { data, error } = await supabase
    .from('contractpart')
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
 * Delete contract part (soft delete)
 */
export const deleteContractPart = async (id, softDelete = true) => {
  if (softDelete) {
    const { error } = await supabase
      .from('contractpart')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
    return { success: !error, error };
  } else {
    const { error } = await supabase
      .from('contractpart')
      .delete()
      .eq('id', id);
    return { success: !error, error };
  }
};

/**
 * Get contract parts by parent (hierarchical)
 */
export const fetchContractPartsByParent = async (parentId) => {
  const condition = parentId ? { parent_id: parentId } : { parent_id: null };

  const { data, error } = await supabase
    .from('contractpart')
    .select(`
      id,
      title,
      content,
      status,
      is_required,
      is_active,
      order_index,
      required_initials,
      created_at,
      updated_at,
      child_count:contractpart!parent_id(count)
    `)
    .match(condition)
    .eq('is_deleted', false)
    .order('order_index', { ascending: true })
    .order('created_at', { ascending: true });

  return { data, error };
};

/**
 * Get root-level contract parts (no parent)
 */
export const fetchRootContractParts = async () => {
  return await fetchContractPartsByParent(null);
};

/**
 * Get child contract parts
 */
export const fetchChildContractParts = async (parentId) => {
  return await fetchContractPartsByParent(parentId);
};

/**
 * Get contract parts hierarchy (recursive)
 */
export const fetchContractPartsHierarchy = async (rootParentId = null) => {
  const buildHierarchy = async (parentId, level = 0) => {
    const { data: children, error } = await supabase
      .from('contractpart')
      .select(`
        id,
        title,
        status,
        is_required,
        is_active,
        order_index,
        required_initials
      `)
      .eq('parent_id', parentId)
      .eq('is_deleted', false)
      .order('order_index');

    if (error || !children) return [];

    const hierarchy = [];
    for (const child of children) {
      const subChildren = await buildHierarchy(child.id, level + 1);
      hierarchy.push({
        ...child,
        level,
        children: subChildren
      });
    }

    return hierarchy;
  };

  const hierarchy = await buildHierarchy(rootParentId);
  return { data: hierarchy, error: null };
};

/**
 * Reorder contract parts within same parent
 */
export const reorderContractParts = async (parentId, partOrders) => {
  const updates = partOrders.map(({ id, order_index }) => 
    supabase
      .from('contractpart')
      .update({ 
        order_index,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('parent_id', parentId)
  );
  
  const results = await Promise.all(updates);
  const errors = results.filter(result => result.error);
  
  return { 
    success: errors.length === 0,
    errors: errors.map(result => result.error)
  };
};

/**
 * Toggle contract part active status
 */
export const toggleContractPartActive = async (id) => {
  // First get current status
  const { data: current } = await supabase
    .from('contractpart')
    .select('is_active')
    .eq('id', id)
    .single();

  if (!current) {
    return { data: null, error: 'Contract part not found' };
  }

  const { data, error } = await supabase
    .from('contractpart')
    .update({
      is_active: !current.is_active,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select('id, is_active')
    .single();

  return { data, error };
};

/**
 * Update contract part status
 */
export const updateContractPartStatus = async (id, newStatus) => {
  const { data, error } = await supabase
    .from('contractpart')
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
 * Get contract parts for specific products
 */
export const fetchContractPartsForProducts = async (productIds) => {
  if (!Array.isArray(productIds)) {
    productIds = [productIds];
  }

  const { data, error } = await supabase
    .from('contractpart')
    .select(`
      id,
      title,
      content,
      is_required,
      required_initials,
      order_index,
      show_if_products
    `)
    .eq('is_active', true)
    .eq('is_deleted', false)
    .order('order_index');

  if (error) {
    return { data: null, error };
  }

  // Filter parts based on product matching
  const filteredParts = data?.filter(part => {
    // If no product requirements, include it
    if (!part.show_if_products || part.show_if_products.length === 0) {
      return true;
    }
    
    // Check if any of the provided product IDs match the requirements
    return part.show_if_products.some(requiredProductId => 
      productIds.includes(requiredProductId)
    );
  }) || [];

  return { data: filteredParts, error: null };
};

/**
 * Get active contract parts (for contract generation)
 */
export const fetchActiveContractParts = async () => {
  const { data, error } = await supabase
    .from('contractpart')
    .select(`
      id,
      title,
      content,
      is_required,
      insert_if_missing,
      required_initials,
      order_index,
      show_if_products,
      parent_id
    `)
    .eq('is_active', true)
    .eq('is_deleted', false)
    .order('order_index');

  return { data, error };
};

/**
 * Get required contract parts
 */
export const fetchRequiredContractParts = async () => {
  const { data, error } = await supabase
    .from('contractpart')
    .select(`
      id,
      title,
      content,
      required_initials,
      order_index
    `)
    .eq('is_required', true)
    .eq('is_active', true)
    .eq('is_deleted', false)
    .order('order_index');

  return { data, error };
};

// ========== TAG MANAGEMENT ==========

/**
 * Link tags to contract part
 */
export const linkTagsToContractPart = async (contractPartId, categoryIds) => {
  if (!Array.isArray(categoryIds)) {
    categoryIds = [categoryIds];
  }

  // Remove existing links first
  await supabase
    .from('category_contractpart')
    .delete()
    .eq('contractpart_id', contractPartId);

  // Add new links
  const insertData = categoryIds.map(categoryId => ({
    contractpart_id: contractPartId,
    category_id: categoryId,
    created_at: new Date().toISOString()
  }));

  const { data, error } = await supabase
    .from('category_contractpart')
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
 * Get contract part tags
 */
export const fetchContractPartTags = async (contractPartId) => {
  const { data, error } = await supabase
    .from('category_contractpart')
    .select(`
      category:category_id(id, title)
    `)
    .eq('contractpart_id', contractPartId);

  return { 
    data: data?.map(item => item.category) || [], 
    error 
  };
};

// ========== VIEW-SPECIFIC FUNCTIONS ==========

/**
 * Get contract parts for Kanban view (grouped by status)
 */
export const fetchContractPartsForKanban = async (filters = {}) => {
  const { data, error } = await fetchAllContractParts(filters);
  
  if (error) {
    return { data: null, error };
  }

  // Group by status
  const grouped = {
    'status-todo': [],
    'status-in_progress': [],
    'status-complete': [],
    'status-archived': []
  };

  (data || []).forEach(part => {
    const statusKey = `status-${part.status || 'todo'}`;
    if (grouped[statusKey]) {
      grouped[statusKey].push(part);
    }
  });

  return { data: grouped, error: null };
};

/**
 * Get contract parts for Checklist view (with completion tracking)
 */
export const fetchContractPartsForChecklist = async (filters = {}) => {
  const { data, error } = await fetchAllContractParts({
    ...filters,
    is_active: true
  });
  
  if (error) {
    return { data: null, error };
  }

  const stats = {
    total: data?.length || 0,
    completed: data?.filter(p => p.status === 'complete').length || 0,
    inProgress: data?.filter(p => p.status === 'in_progress').length || 0,
    todo: data?.filter(p => p.status === 'todo').length || 0
  };

  stats.completionRate = stats.total > 0 ? 
    Math.round((stats.completed / stats.total) * 100) : 0;

  return { 
    data: {
      parts: data || [],
      stats
    }, 
    error: null 
  };
};

/**
 * Get contract parts for Calendar view (with dates)
 */
export const fetchContractPartsForCalendar = async (startDate, endDate) => {
  const { data, error } = await supabase
    .from('contractpart')
    .select(`
      id,
      title,
      status,
      created_at,
      updated_at,
      author:author_id(id, title)
    `)
    .eq('is_active', true)
    .eq('is_deleted', false)
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at');

  return { data, error };
};

// ========== UTILITY FUNCTIONS ==========

/**
 * Duplicate a contract part
 */
export const duplicateContractPart = async (contractPartId, options = {}) => {
  const { newTitle, targetParentId, includeTags = true } = options;

  // Get the original contract part
  const { data: originalPart, error: fetchError } = await fetchContractPartById(contractPartId);
  
  if (fetchError) {
    return { data: null, error: fetchError };
  }

  // Prepare new contract part data
  const { id, created_at, updated_at, tags, ...partData } = originalPart;
  
  const newPartData = {
    ...partData,
    title: newTitle || `${originalPart.title} (Copy)`,
    status: 'todo',
    parent_id: targetParentId !== undefined ? targetParentId : originalPart.parent_id
  };

  // Create new contract part
  const { data: newPart, error: createError } = await createContractPart(newPartData);
  
  if (createError) {
    return { data: null, error: createError };
  }

  // Copy tags if requested
  if (includeTags && tags && tags.length > 0) {
    await linkTagsToContractPart(newPart.id, tags.map(t => t.id));
  }

  return { data: newPart, error: null };
};

/**
 * Get contract parts statistics
 */
export const getContractPartsStats = async () => {
  const { data, error } = await supabase
    .from('contractpart')
    .select('id, status, is_active, is_required')
    .eq('is_deleted', false);

  if (error) {
    return { data: null, error };
  }

  const stats = {
    total: data.length,
    active: data.filter(p => p.is_active).length,
    inactive: data.filter(p => !p.is_active).length,
    required: data.filter(p => p.is_required).length,
    byStatus: {
      todo: data.filter(p => p.status === 'todo').length,
      in_progress: data.filter(p => p.status === 'in_progress').length,
      complete: data.filter(p => p.status === 'complete').length,
      archived: data.filter(p => p.status === 'archived').length
    }
  };

  return { data: stats, error: null };
};

/**
 * Move contract part to different parent
 */
export const moveContractPartToParent = async (partId, newParentId, newSortOrder = null) => {
  // Get next sort order if not provided
  if (newSortOrder === null) {
    const parentCondition = newParentId ? { parent_id: newParentId } : { parent_id: null };
    
    const { data: existingParts } = await supabase
      .from('contractpart')
      .select('order_index')
      .match(parentCondition)
      .order('order_index', { ascending: false })
      .limit(1);
      
    newSortOrder = (existingParts?.[0]?.order_index || -1) + 1;
  }

  const { data, error } = await supabase
    .from('contractpart')
    .update({
      parent_id: newParentId,
      order_index: newSortOrder,
      updated_at: new Date().toISOString()
    })
    .eq('id', partId)
    .select('*')
    .single();

  return { data, error };
};