import { createClient } from '@/lib/supabase/browser';
const supabase = createClient();

/**
 * Get a single milestone by ID with all related data (ENHANCED FROM EXISTING)
 */
export const fetchMilestoneById = async (id) => {
  const { data, error } = await supabase
    .from('milestone')
    .select(`
      *,
      author:author_id(id, title, email),
      parent:parent_id(id, title),
      checklist:checklist_id(id, title, status),
      thumbnail:thumbnail_id(id, url, alt_text),
      tags:category_milestone(
        category:category_id(id, title)
      ),
      child_milestones:milestone!parent_id(id, title, status, order_index)
    `)
    .eq('id', id)
    .single();

  // Transform nested data
  if (data) {
    data.tags = data.tags?.map(t => t.category) || [];
    
    // Sort child milestones by order_index
    if (data.child_milestones) {
      data.child_milestones.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
    }
  }

  return { data, error };
};

/**
 * Get all milestones with optional filters (ENHANCED FROM EXISTING)
 */
export const fetchAllMilestones = async (filters = {}) => {
  let query = supabase
    .from('milestone')
    .select(`
      id,
      title,
      description,
      status,
      type,
      order_index,
      start_date,
      end_date,
      content,
      created_at,
      updated_at,
      author:author_id(id, title),
      parent:parent_id(id, title),
      checklist:checklist_id(id, title),
      thumbnail:thumbnail_id(id, url, alt_text),
      child_count:milestone!parent_id(count)
    `)
    .eq('is_deleted', false);

  // Apply filters
  if (filters.status && filters.status.length > 0) {
    query = query.in('status', filters.status);
  }
  
  if (filters.type) {
    query = query.eq('type', filters.type);
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

  // Date range filtering using actual table fields
  if (filters.start_date) {
    query = query.gte('start_date', filters.start_date);
  }
  if (filters.end_date) {
    query = query.lte('end_date', filters.end_date);
  }

  // Apply sorting
  if (filters.sort) {
    const [field, direction] = filters.sort.split(':');
    query = query.order(field, { ascending: direction === 'asc' });
  } else {
    // Default sorting: by order_index
    query = query.order('order_index', { ascending: true });
  }

  const { data, error } = await query;
  return { data, error };
};

/**
 * Create a new milestone (ENHANCED FROM EXISTING insertMilestone)
 */
export const createMilestone = async (milestoneData) => {
  // Get current max order_index for the parent
  let orderQuery = supabase
    .from('milestone')
    .select('order_index');

  if (milestoneData.parent_id) {
    orderQuery = orderQuery.eq('parent_id', milestoneData.parent_id);
  }

  const { data: existingMilestones } = await orderQuery
    .order('order_index', { ascending: false })
    .limit(1);
    
  const nextOrderIndex = (existingMilestones?.[0]?.order_index || 0) + 1;

  const { data, error } = await supabase
    .from('milestone')
    .insert([{
      ...milestoneData,
      status: milestoneData.status || 'pending',
      order_index: milestoneData.order_index ?? nextOrderIndex,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }])
    .select(`
      *,
      author:author_id(id, title),
      parent:parent_id(id, title),
      checklist:checklist_id(id, title)
    `)
    .single();

  return { data, error };
};

/**
 * Legacy function name for backward compatibility
 */
export const insertMilestone = async (milestoneData) => {
  return await createMilestone(milestoneData);
};

/**
 * Update milestone (ENHANCED FROM EXISTING updateMilestoneById)
 */
export const updateMilestone = async (id, updates) => {
  const { data, error } = await supabase
    .from('milestone')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select(`
      *,
      author:author_id(id, title),
      parent:parent_id(id, title),
      checklist:checklist_id(id, title)
    `)
    .single();

  return { data, error };
};

/**
 * Legacy function name for backward compatibility
 */
export const updateMilestoneById = async (id, updates) => {
  return await updateMilestone(id, updates);
};

/**
 * Update milestone order (PRESERVED FROM EXISTING)
 */
export const updateMilestoneOrder = async (id, newOrder) => {
  return await supabase
    .from('milestone')
    .update({ order_index: newOrder })
    .eq('id', id);
};

/**
 * Delete milestone (ENHANCED FROM EXISTING deleteMilestoneById)
 */
export const deleteMilestone = async (id, softDelete = true) => {
  if (softDelete) {
    const { error } = await supabase
      .from('milestone')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
    return { success: !error, error };
  } else {
    const { error } = await supabase
      .from('milestone')
      .delete()
      .eq('id', id);
    return { success: !error, error };
  }
};

/**
 * Legacy function name for backward compatibility
 */
export const deleteMilestoneById = async (id) => {
  return await deleteMilestone(id, false); // Hard delete to match original behavior
};

// ========== HIERARCHICAL MANAGEMENT ==========

/**
 * Get milestones by parent (hierarchical)
 */
export const fetchMilestonesByParent = async (parentId) => {
  const condition = parentId ? { parent_id: parentId } : { parent_id: null };

  const { data, error } = await supabase
    .from('milestone')
    .select(`
      id,
      title,
      description,
      status,
      type,
      order_index,
      start_date,
      end_date,
      created_at,
      updated_at,
      child_count:milestone!parent_id(count)
    `)
    .match(condition)
    .eq('is_deleted', false)
    .order('order_index', { ascending: true });

  return { data, error };
};

/**
 * Get root-level milestones (no parent)
 */
export const fetchRootMilestones = async () => {
  const { data, error } = await supabase
    .from('milestone')
    .select(`
      id,
      title,
      description,
      status,
      type,
      order_index,
      start_date,
      end_date,
      created_at,
      child_count:milestone!parent_id(count)
    `)
    .is('parent_id', null)
    .eq('is_deleted', false)
    .order('order_index', { ascending: true });

  return { data, error };
};

/**
 * Get child milestones
 */
export const fetchChildMilestones = async (parentId) => {
  return await fetchMilestonesByParent(parentId);
};

// ========== STATUS MANAGEMENT ==========

/**
 * Update milestone status
 */
export const updateMilestoneStatus = async (id, newStatus) => {
  const { data, error } = await supabase
    .from('milestone')
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
 * Mark milestone as completed
 */
export const markMilestoneCompleted = async (id) => {
  return await updateMilestoneStatus(id, 'completed');
};

/**
 * Get milestones by status
 */
export const fetchMilestonesByStatus = async (status) => {
  const { data, error } = await supabase
    .from('milestone')
    .select(`
      id,
      title,
      description,
      type,
      order_index,
      start_date,
      end_date,
      created_at
    `)
    .eq('status', status)
    .eq('is_deleted', false)
    .order('order_index', { ascending: true });

  return { data, error };
};

// ========== TYPE MANAGEMENT ==========

/**
 * Get milestones by type
 */
export const fetchMilestonesByType = async (type) => {
  const { data, error } = await supabase
    .from('milestone')
    .select(`
      id,
      title,
      description,
      status,
      order_index,
      start_date,
      end_date,
      created_at,
      author:author_id(id, title)
    `)
    .eq('type', type)
    .eq('is_deleted', false)
    .order('order_index', { ascending: true });

  return { data, error };
};

// ========== CHECKLIST INTEGRATION ==========

/**
 * Get milestones with checklists
 */
export const fetchMilestonesWithChecklists = async () => {
  const { data, error } = await supabase
    .from('milestone')
    .select(`
      id,
      title,
      description,
      status,
      order_index,
      checklist:checklist_id(id, title, status)
    `)
    .not('checklist_id', 'is', null)
    .eq('is_deleted', false)
    .order('order_index', { ascending: true });

  return { data, error };
};

/**
 * Link checklist to milestone
 */
export const linkChecklistToMilestone = async (milestoneId, checklistId) => {
  const { data, error } = await supabase
    .from('milestone')
    .update({
      checklist_id: checklistId,
      updated_at: new Date().toISOString()
    })
    .eq('id', milestoneId)
    .select('id, checklist_id')
    .single();

  return { data, error };
};

// ========== TAG MANAGEMENT ==========

/**
 * Link tags to milestone
 */
export const linkTagsToMilestone = async (milestoneId, categoryIds) => {
  if (!Array.isArray(categoryIds)) {
    categoryIds = [categoryIds];
  }

  // Remove existing links first
  await supabase
    .from('category_milestone')
    .delete()
    .eq('milestone_id', milestoneId);

  // Add new links
  const insertData = categoryIds.map(categoryId => ({
    milestone_id: milestoneId,
    category_id: categoryId,
    created_at: new Date().toISOString()
  }));

  const { data, error } = await supabase
    .from('category_milestone')
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
 * Get milestone tags
 */
export const fetchMilestoneTags = async (milestoneId) => {
  const { data, error } = await supabase
    .from('category_milestone')
    .select(`
      category:category_id(id, title)
    `)
    .eq('milestone_id', milestoneId);

  return { 
    data: data?.map(item => item.category) || [], 
    error 
  };
};

// ========== REORDERING ==========

/**
 * Reorder milestones within same parent
 */
export const reorderMilestones = async (parentId, milestoneOrders) => {
  const updates = milestoneOrders.map(({ id, order_index }) => 
    supabase
      .from('milestone')
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
 * Move milestone to different parent
 */
export const moveMilestoneToParent = async (milestoneId, newParentId, newOrderIndex = null) => {
  // Get next order_index if not provided
  if (newOrderIndex === null) {
    const parentCondition = newParentId ? { parent_id: newParentId } : { parent_id: null };
    
    const { data: existingMilestones } = await supabase
      .from('milestone')
      .select('order_index')
      .match(parentCondition)
      .order('order_index', { ascending: false })
      .limit(1);
      
    newOrderIndex = (existingMilestones?.[0]?.order_index || 0) + 1;
  }

  const { data, error } = await supabase
    .from('milestone')
    .update({
      parent_id: newParentId,
      order_index: newOrderIndex,
      updated_at: new Date().toISOString()
    })
    .eq('id', milestoneId)
    .select('*')
    .single();

  return { data, error };
};

// ========== DATE MANAGEMENT ==========

/**
 * Get milestones within date range
 */
export const fetchMilestonesInDateRange = async (startDate, endDate) => {
  const { data, error } = await supabase
    .from('milestone')
    .select(`
      id,
      title,
      description,
      status,
      type,
      start_date,
      end_date,
      order_index
    `)
    .eq('is_deleted', false)
    .or(`start_date.gte.${startDate},start_date.lte.${endDate},end_date.gte.${startDate},end_date.lte.${endDate}`)
    .order('start_date', { ascending: true, nullsFirst: false })
    .order('order_index', { ascending: true });

  return { data, error };
};

// ========== SEARCH ==========

/**
 * Search milestones by title, description, or content
 */
export const searchMilestones = async (searchTerm, filters = {}) => {
  let query = supabase
    .from('milestone')
    .select(`
      id,
      title,
      description,
      status,
      type,
      order_index,
      start_date,
      end_date,
      created_at
    `)
    .eq('is_deleted', false);

  // Apply search
  if (searchTerm) {
    query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`);
  }

  // Apply additional filters
  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  
  if (filters.type) {
    query = query.eq('type', filters.type);
  }

  query = query.order('order_index', { ascending: true });

  const { data, error } = await query;
  return { data, error };
};

// ========== UTILITY FUNCTIONS ==========

/**
 * Duplicate a milestone
 */
export const duplicateMilestone = async (milestoneId, options = {}) => {
  const { newTitle, targetParentId, includeTags = true } = options;

  // Get the original milestone
  const { data: originalMilestone, error: fetchError } = await fetchMilestoneById(milestoneId);
  
  if (fetchError) {
    return { data: null, error: fetchError };
  }

  // Prepare new milestone data
  const { id, created_at, updated_at, tags, child_milestones, ...milestoneData } = originalMilestone;
  
  const newMilestoneData = {
    ...milestoneData,
    title: newTitle || `${originalMilestone.title} (Copy)`,
    status: 'pending', // Reset status for copy
    parent_id: targetParentId !== undefined ? targetParentId : originalMilestone.parent_id,
    checklist_id: null // Don't copy checklist reference
  };

  // Create new milestone
  const { data: newMilestone, error: createError } = await createMilestone(newMilestoneData);
  
  if (createError) {
    return { data: null, error: createError };
  }

  // Copy tags if requested
  if (includeTags && tags && tags.length > 0) {
    await linkTagsToMilestone(newMilestone.id, tags.map(t => t.id));
  }

  return { data: newMilestone, error: null };
};

/**
 * Get milestone statistics
 */
export const getMilestoneStats = async () => {
  const { data, error } = await supabase
    .from('milestone')
    .select('id, status, type')
    .eq('is_deleted', false);

  if (error) {
    return { data: null, error };
  }

  const stats = {
    total: data.length,
    byStatus: {
      pending: data.filter(m => m.status === 'pending').length,
      in_progress: data.filter(m => m.status === 'in_progress').length,
      completed: data.filter(m => m.status === 'completed').length,
      cancelled: data.filter(m => m.status === 'cancelled').length
    },
    byType: {}
  };

  // Get unique types and count them
  const types = [...new Set(data.map(m => m.type).filter(Boolean))];
  types.forEach(type => {
    stats.byType[type] = data.filter(m => m.type === type).length;
  });

  stats.completionRate = stats.total > 0 ? 
    Math.round((stats.byStatus.completed / stats.total) * 100) : 0;

  return { data: stats, error: null };
};