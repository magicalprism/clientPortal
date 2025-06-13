// lib/supabase/queries/table/deliverable.js

import { createClient } from '@/lib/supabase/browser';
const supabase = createClient();

/**
 * Get a single deliverable by ID with all related data
 */
export const fetchDeliverableById = async (id) => {
  const { data, error } = await supabase
    .from('deliverable')
    .select(`
      *,
      company:company_id(id, title),
      project:project_id(id, title, status),
      author:author_id(id, title, email),
      parent:parent_id(id, title),
      thumbnail:thumbnail_id(id, url, alt_text),
      tags:category_deliverable(
        category:category_id(id, title)
      ),
      child_deliverables:deliverable!parent_id(id, title, type, status)
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
 * Get all deliverables with optional filters
 */
export const fetchAllDeliverables = async (filters = {}) => {
  let query = supabase
    .from('deliverable')
    .select(`
      id,
      title,
      type,
      status,
      url,
      order_index,
      created_at,
      updated_at,
      company:company_id(id, title),
      project:project_id(id, title, status),
      author:author_id(id, title),
      parent:parent_id(id, title),
      thumbnail:thumbnail_id(id, url, alt_text),
      child_count:deliverable!parent_id(count)
    `)
    .eq('is_deleted', false);

  // Apply filters
  if (filters.type && filters.type.length > 0) {
    query = query.in('type', filters.type);
  }
  
  if (filters.status && filters.status.length > 0) {
    query = query.in('status', filters.status);
  }
  
  if (filters.company_id) {
    query = query.eq('company_id', filters.company_id);
  }
  
  if (filters.project_id) {
    query = query.eq('project_id', filters.project_id);
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

  // Apply sorting
  if (filters.sort) {
    const [field, direction] = filters.sort.split(':');
    query = query.order(field, { ascending: direction === 'asc' });
  } else {
    // Default sorting: by order_index, then by created_at
    query = query.order('order_index', { ascending: true, nullsFirst: false });
    query = query.order('created_at', { ascending: false });
  }

  const { data, error } = await query;
  return { data, error };
};

/**
 * Create a new deliverable
 */
export const createDeliverable = async (deliverableData) => {
  // Get current max order_index for the parent/project combination
  let orderQuery = supabase
    .from('deliverable')
    .select('order_index');

  if (deliverableData.parent_id) {
    orderQuery = orderQuery.eq('parent_id', deliverableData.parent_id);
  } else if (deliverableData.project_id) {
    orderQuery = orderQuery.eq('project_id', deliverableData.project_id);
  }

  const { data: existingDeliverables } = await orderQuery
    .order('order_index', { ascending: false })
    .limit(1);
    
  const nextOrderIndex = (existingDeliverables?.[0]?.order_index || -1) + 1;

  const { data, error } = await supabase
    .from('deliverable')
    .insert([{
      ...deliverableData,
      status: deliverableData.status || 'todo',
      order_index: deliverableData.order_index ?? nextOrderIndex,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }])
    .select(`
      *,
      company:company_id(id, title),
      project:project_id(id, title),
      author:author_id(id, title),
      parent:parent_id(id, title)
    `)
    .single();

  return { data, error };
};

/**
 * Update deliverable
 */
export const updateDeliverable = async (id, updates) => {
  const { data, error } = await supabase
    .from('deliverable')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select(`
      *,
      company:company_id(id, title),
      project:project_id(id, title),
      author:author_id(id, title),
      parent:parent_id(id, title)
    `)
    .single();

  return { data, error };
};

/**
 * Delete deliverable (soft delete)
 */
export const deleteDeliverable = async (id, softDelete = true) => {
  if (softDelete) {
    const { error } = await supabase
      .from('deliverable')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
    return { success: !error, error };
  } else {
    const { error } = await supabase
      .from('deliverable')
      .delete()
      .eq('id', id);
    return { success: !error, error };
  }
};

/**
 * Get deliverables by company
 */
export const fetchDeliverablesByCompany = async (companyId) => {
  const { data, error } = await supabase
    .from('deliverable')
    .select(`
      id,
      title,
      type,
      status,
      url,
      order_index,
      created_at,
      project:project_id(id, title),
      author:author_id(id, title)
    `)
    .eq('company_id', companyId)
    .eq('is_deleted', false)
    .order('order_index', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false });

  return { data, error };
};

/**
 * Get deliverables by project
 */
export const fetchDeliverablesByProject = async (projectId) => {
  const { data, error } = await supabase
    .from('deliverable')
    .select(`
      id,
      title,
      type,
      status,
      url,
      order_index,
      created_at,
      updated_at,
      company:company_id(id, title),
      author:author_id(id, title),
      parent:parent_id(id, title),
      child_count:deliverable!parent_id(count)
    `)
    .eq('project_id', projectId)
    .eq('is_deleted', false)
    .order('order_index', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false });

  return { data, error };
};

/**
 * Get deliverables by parent (hierarchical)
 */
export const fetchDeliverablesByParent = async (parentId) => {
  const condition = parentId ? { parent_id: parentId } : { parent_id: null };

  const { data, error } = await supabase
    .from('deliverable')
    .select(`
      id,
      title,
      type,
      status,
      url,
      order_index,
      created_at,
      updated_at,
      company:company_id(id, title),
      project:project_id(id, title),
      child_count:deliverable!parent_id(count)
    `)
    .match(condition)
    .eq('is_deleted', false)
    .order('order_index', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false });

  return { data, error };
};

/**
 * Get root-level deliverables (no parent)
 */
export const fetchRootDeliverables = async (projectId = null) => {
  let query = supabase
    .from('deliverable')
    .select(`
      id,
      title,
      type,
      status,
      url,
      order_index,
      created_at,
      company:company_id(id, title),
      project:project_id(id, title),
      child_count:deliverable!parent_id(count)
    `)
    .is('parent_id', null)
    .eq('is_deleted', false);

  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  query = query.order('order_index', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false });

  const { data, error } = await query;
  return { data, error };
};

/**
 * Get child deliverables
 */
export const fetchChildDeliverables = async (parentId) => {
  return await fetchDeliverablesByParent(parentId);
};

/**
 * Get deliverables hierarchy (recursive)
 */
export const fetchDeliverablesHierarchy = async (rootParentId = null, projectId = null) => {
  const buildHierarchy = async (parentId, level = 0) => {
    let query = supabase
      .from('deliverable')
      .select(`
        id,
        title,
        type,
        status,
        url,
        order_index
      `)
      .eq('is_deleted', false);

    if (parentId) {
      query = query.eq('parent_id', parentId);
    } else {
      query = query.is('parent_id', null);
      if (projectId) {
        query = query.eq('project_id', projectId);
      }
    }

    const { data: children, error } = await query.order('order_index');

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
 * Reorder deliverables within same container (parent or project)
 */
export const reorderDeliverables = async (containerId, deliverableOrders, containerType = 'parent') => {
  const containerField = containerType === 'parent' ? 'parent_id' : 'project_id';
  
  const updates = deliverableOrders.map(({ id, order_index }) => 
    supabase
      .from('deliverable')
      .update({ 
        order_index,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq(containerField, containerId)
  );
  
  const results = await Promise.all(updates);
  const errors = results.filter(result => result.error);
  
  return { 
    success: errors.length === 0,
    errors: errors.map(result => result.error)
  };
};

/**
 * Update deliverable status
 */
export const updateDeliverableStatus = async (id, newStatus) => {
  const { data, error } = await supabase
    .from('deliverable')
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
 * Get deliverables by type
 */
export const fetchDeliverablesByType = async (type, projectId = null) => {
  let query = supabase
    .from('deliverable')
    .select(`
      id,
      title,
      status,
      url,
      order_index,
      created_at,
      company:company_id(id, title),
      project:project_id(id, title),
      parent:parent_id(id, title)
    `)
    .eq('type', type)
    .eq('is_deleted', false);

  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  query = query.order('order_index', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false });

  const { data, error } = await query;
  return { data, error };
};

// ========== TAG MANAGEMENT ==========

/**
 * Link tags to deliverable
 */
export const linkTagsToDeliverable = async (deliverableId, categoryIds) => {
  if (!Array.isArray(categoryIds)) {
    categoryIds = [categoryIds];
  }

  // Remove existing links first
  await supabase
    .from('category_deliverable')
    .delete()
    .eq('deliverable_id', deliverableId);

  // Add new links
  const insertData = categoryIds.map(categoryId => ({
    deliverable_id: deliverableId,
    category_id: categoryId,
    created_at: new Date().toISOString()
  }));

  const { data, error } = await supabase
    .from('category_deliverable')
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
 * Get deliverable tags
 */
export const fetchDeliverableTags = async (deliverableId) => {
  const { data, error } = await supabase
    .from('category_deliverable')
    .select(`
      category:category_id(id, title)
    `)
    .eq('deliverable_id', deliverableId);

  return { 
    data: data?.map(item => item.category) || [], 
    error 
  };
};

// ========== UTILITY FUNCTIONS ==========

/**
 * Duplicate a deliverable
 */
export const duplicateDeliverable = async (deliverableId, options = {}) => {
  const { newTitle, targetParentId, targetProjectId, includeTags = true, includeChildren = false } = options;

  // Get the original deliverable
  const { data: originalDeliverable, error: fetchError } = await fetchDeliverableById(deliverableId);
  
  if (fetchError) {
    return { data: null, error: fetchError };
  }

  // Prepare new deliverable data
  const { id, created_at, updated_at, tags, child_deliverables, ...deliverableData } = originalDeliverable;
  
  const newDeliverableData = {
    ...deliverableData,
    title: newTitle || `${originalDeliverable.title} (Copy)`,
    parent_id: targetParentId !== undefined ? targetParentId : originalDeliverable.parent_id,
    project_id: targetProjectId !== undefined ? targetProjectId : originalDeliverable.project_id
  };

  // Create new deliverable
  const { data: newDeliverable, error: createError } = await createDeliverable(newDeliverableData);
  
  if (createError) {
    return { data: null, error: createError };
  }

  // Copy tags if requested
  if (includeTags && tags && tags.length > 0) {
    await linkTagsToDeliverable(newDeliverable.id, tags.map(t => t.id));
  }

  // Copy children if requested
  if (includeChildren && child_deliverables && child_deliverables.length > 0) {
    const childDuplicationPromises = child_deliverables.map(child => 
      duplicateDeliverable(child.id, {
        targetParentId: newDeliverable.id,
        targetProjectId: newDeliverable.project_id,
        includeTags,
        includeChildren: true
      })
    );

    await Promise.all(childDuplicationPromises);
  }

  return { data: newDeliverable, error: null };
};

/**
 * Get deliverable statistics
 */
export const getDeliverableStats = async (projectId = null, companyId = null) => {
  let query = supabase
    .from('deliverable')
    .select('id, type, status')
    .eq('is_deleted', false);

  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  if (companyId) {
    query = query.eq('company_id', companyId);
  }

  const { data, error } = await query;

  if (error) {
    return { data: null, error };
  }

  const stats = {
    total: data.length,
    byType: {
      page: data.filter(d => d.type === 'page').length,
      feature: data.filter(d => d.type === 'feature').length,
      strategy: data.filter(d => d.type === 'strategy').length
    },
    byStatus: {}
  };

  // Get unique statuses and count them
  const statuses = [...new Set(data.map(d => d.status))];
  statuses.forEach(status => {
    stats.byStatus[status] = data.filter(d => d.status === status).length;
  });

  return { data: stats, error: null };
};

/**
 * Move deliverable to different parent/project
 */
export const moveDeliverable = async (deliverableId, newParentId = null, newProjectId = null, newOrderIndex = null) => {
  // Get next order_index if not provided
  if (newOrderIndex === null) {
    let orderQuery = supabase
      .from('deliverable')
      .select('order_index');

    if (newParentId) {
      orderQuery = orderQuery.eq('parent_id', newParentId);
    } else if (newProjectId) {
      orderQuery = orderQuery.eq('project_id', newProjectId);
    }

    const { data: existingDeliverables } = await orderQuery
      .order('order_index', { ascending: false })
      .limit(1);
      
    newOrderIndex = (existingDeliverables?.[0]?.order_index || -1) + 1;
  }

  const updateData = {
    order_index: newOrderIndex,
    updated_at: new Date().toISOString()
  };

  if (newParentId !== undefined) {
    updateData.parent_id = newParentId;
  }

  if (newProjectId !== undefined) {
    updateData.project_id = newProjectId;
  }

  const { data, error } = await supabase
    .from('deliverable')
    .update(updateData)
    .eq('id', deliverableId)
    .select('*')
    .single();

  return { data, error };
};

/**
 * Get deliverables with URLs (for validation/linking)
 */
export const fetchDeliverablesWithUrls = async (projectId = null) => {
  let query = supabase
    .from('deliverable')
    .select(`
      id,
      title,
      url,
      type,
      status,
      project:project_id(id, title)
    `)
    .not('url', 'is', null)
    .neq('url', '')
    .eq('is_deleted', false);

  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  query = query.order('title');

  const { data, error } = await query;
  return { data, error };
};