import { createClient } from '@/lib/supabase/browser';
const supabase = createClient();

/**
 * Get a single feature by ID with all related data
 */
export const fetchFeatureById = async (id) => {
  const { data, error } = await supabase
    .from('feature')
    .select(`
      *,
      author:author_id(id, title, email),
      parent:parent_id(id, title),
      thumbnail:thumbnail_id(id, url, alt_text),
      proposal:proposal_id(id, title, status),
      products:feature_product(
        product:product_id(id, title, type, price)
      ),
      tags:category_feature(
        category:category_id(id, title)
      ),
      child_features:feature!parent_id(id, title, type, is_active)
    `)
    .eq('id', id)
    .single();

  // Transform nested data
  if (data) {
    data.products = data.products?.map(p => p.product) || [];
    data.tags = data.tags?.map(t => t.category) || [];
  }

  return { data, error };
};

/**
 * Get all features with optional filters
 */
export const fetchAllFeatures = async (filters = {}) => {
  let query = supabase
    .from('feature')
    .select(`
      id,
      title,
      description,
      type,
      is_active,
      slug,
      order_index,
      created_at,
      updated_at,
      author:author_id(id, title),
      parent:parent_id(id, title),
      proposal:proposal_id(id, title),
      thumbnail:thumbnail_id(id, url, alt_text),
      product_count:feature_product(count),
      child_count:feature!parent_id(count)
    `)
    .eq('is_deleted', false);

  // Apply filters
  if (filters.type && filters.type.length > 0) {
    query = query.in('type', filters.type);
  }
  
  if (filters.is_active !== undefined) {
    query = query.eq('is_active', filters.is_active);
  }
  
  if (filters.author_id) {
    query = query.eq('author_id', filters.author_id);
  }
  
  if (filters.proposal_id) {
    query = query.eq('proposal_id', filters.proposal_id);
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
    // Default sorting: by order_index, then by title
    query = query.order('order_index', { ascending: true, nullsFirst: false });
    query = query.order('title', { ascending: true });
  }

  const { data, error } = await query;
  return { data, error };
};

/**
 * Create a new feature
 */
export const createFeature = async (featureData) => {
  // Get current max order_index for the parent
  const parentCondition = featureData.parent_id 
    ? { parent_id: featureData.parent_id }
    : { parent_id: null };

  const { data: existingFeatures } = await supabase
    .from('feature')
    .select('order_index')
    .match(parentCondition)
    .order('order_index', { ascending: false })
    .limit(1);
    
  const nextOrderIndex = (existingFeatures?.[0]?.order_index || -1) + 1;

  const { data, error } = await supabase
    .from('feature')
    .insert([{
      ...featureData,
      type: featureData.type || 'standard',
      is_active: featureData.is_active ?? true,
      order_index: featureData.order_index ?? nextOrderIndex,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }])
    .select(`
      *,
      author:author_id(id, title),
      parent:parent_id(id, title),
      proposal:proposal_id(id, title)
    `)
    .single();

  return { data, error };
};

/**
 * Update feature
 */
export const updateFeature = async (id, updates) => {
  const { data, error } = await supabase
    .from('feature')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select(`
      *,
      author:author_id(id, title),
      parent:parent_id(id, title),
      proposal:proposal_id(id, title)
    `)
    .single();

  return { data, error };
};

/**
 * Delete feature (soft delete)
 */
export const deleteFeature = async (id, softDelete = true) => {
  if (softDelete) {
    const { error } = await supabase
      .from('feature')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
    return { success: !error, error };
  } else {
    const { error } = await supabase
      .from('feature')
      .delete()
      .eq('id', id);
    return { success: !error, error };
  }
};

// ========== HIERARCHICAL MANAGEMENT ==========

/**
 * Get features by parent (hierarchical)
 */
export const fetchFeaturesByParent = async (parentId) => {
  const condition = parentId ? { parent_id: parentId } : { parent_id: null };

  const { data, error } = await supabase
    .from('feature')
    .select(`
      id,
      title,
      description,
      type,
      is_active,
      order_index,
      created_at,
      updated_at,
      child_count:feature!parent_id(count)
    `)
    .match(condition)
    .eq('is_deleted', false)
    .order('order_index', { ascending: true, nullsFirst: false })
    .order('title', { ascending: true });

  return { data, error };
};

/**
 * Get root-level features (no parent)
 */
export const fetchRootFeatures = async () => {
  return await fetchFeaturesByParent(null);
};

/**
 * Get child features
 */
export const fetchChildFeatures = async (parentId) => {
  return await fetchFeaturesByParent(parentId);
};

/**
 * Get feature hierarchy (recursive)
 */
export const fetchFeatureHierarchy = async (rootParentId = null) => {
  const buildHierarchy = async (parentId, level = 0) => {
    const { data: children, error } = await supabase
      .from('feature')
      .select(`
        id,
        title,
        type,
        is_active,
        order_index
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

// ========== TYPE & STATUS MANAGEMENT ==========

/**
 * Get features by type
 */
export const fetchFeaturesByType = async (type) => {
  const { data, error } = await supabase
    .from('feature')
    .select(`
      id,
      title,
      description,
      is_active,
      order_index,
      created_at,
      author:author_id(id, title),
      product_count:feature_product(count)
    `)
    .eq('type', type)
    .eq('is_deleted', false)
    .order('order_index', { ascending: true, nullsFirst: false })
    .order('title', { ascending: true });

  return { data, error };
};

/**
 * Get active features
 */
export const fetchActiveFeatures = async () => {
  const { data, error } = await supabase
    .from('feature')
    .select(`
      id,
      title,
      description,
      type,
      order_index,
      user_benefits,
      product_count:feature_product(count)
    `)
    .eq('is_active', true)
    .eq('is_deleted', false)
    .order('order_index', { ascending: true, nullsFirst: false })
    .order('title', { ascending: true });

  return { data, error };
};

/**
 * Toggle feature active status
 */
export const toggleFeatureActive = async (id) => {
  // First get current status
  const { data: current } = await supabase
    .from('feature')
    .select('is_active')
    .eq('id', id)
    .single();

  if (!current) {
    return { data: null, error: 'Feature not found' };
  }

  const { data, error } = await supabase
    .from('feature')
    .update({
      is_active: !current.is_active,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select('id, is_active')
    .single();

  return { data, error };
};

// ========== PRODUCT RELATIONSHIPS ==========

/**
 * Link products to feature
 */
export const linkProductsToFeature = async (featureId, productIds) => {
  if (!Array.isArray(productIds)) {
    productIds = [productIds];
  }

  // Remove existing links first
  await supabase
    .from('feature_product')
    .delete()
    .eq('feature_id', featureId);

  // Add new links
  const insertData = productIds.map(productId => ({
    feature_id: featureId,
    product_id: productId,
    created_at: new Date().toISOString()
  }));

  const { data, error } = await supabase
    .from('feature_product')
    .insert(insertData)
    .select(`
      product:product_id(id, title, type, price)
    `);

  return { 
    data: data?.map(item => item.product) || [], 
    error 
  };
};

/**
 * Get feature products
 */
export const fetchFeatureProducts = async (featureId) => {
  const { data, error } = await supabase
    .from('feature_product')
    .select(`
      product:product_id(
        id,
        title,
        type,
        price,
        status,
        description
      )
    `)
    .eq('feature_id', featureId);

  return { 
    data: data?.map(item => item.product) || [], 
    error 
  };
};

/**
 * Get products by feature
 */
export const fetchProductsByFeature = async (featureId) => {
  return await fetchFeatureProducts(featureId);
};

// ========== TAG MANAGEMENT ==========

/**
 * Link tags to feature
 */
export const linkTagsToFeature = async (featureId, categoryIds) => {
  if (!Array.isArray(categoryIds)) {
    categoryIds = [categoryIds];
  }

  // Remove existing links first
  await supabase
    .from('category_feature')
    .delete()
    .eq('feature_id', featureId);

  // Add new links
  const insertData = categoryIds.map(categoryId => ({
    feature_id: featureId,
    category_id: categoryId,
    created_at: new Date().toISOString()
  }));

  const { data, error } = await supabase
    .from('category_feature')
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
 * Get feature tags
 */
export const fetchFeatureTags = async (featureId) => {
  const { data, error } = await supabase
    .from('category_feature')
    .select(`
      category:category_id(id, title)
    `)
    .eq('feature_id', featureId);

  return { 
    data: data?.map(item => item.category) || [], 
    error 
  };
};

// ========== PROPOSAL RELATIONSHIPS ==========

/**
 * Get features by proposal
 */
export const fetchFeaturesByProposal = async (proposalId) => {
  const { data, error } = await supabase
    .from('feature')
    .select(`
      id,
      title,
      description,
      type,
      is_active,
      user_benefits,
      order_index,
      created_at
    `)
    .eq('proposal_id', proposalId)
    .eq('is_deleted', false)
    .order('order_index', { ascending: true, nullsFirst: false })
    .order('title', { ascending: true });

  return { data, error };
};

// ========== REORDERING ==========

/**
 * Reorder features within same parent
 */
export const reorderFeatures = async (parentId, featureOrders) => {
  const updates = featureOrders.map(({ id, order_index }) => 
    supabase
      .from('feature')
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
 * Move feature to different parent
 */
export const moveFeatureToParent = async (featureId, newParentId, newOrderIndex = null) => {
  // Get next order_index if not provided
  if (newOrderIndex === null) {
    const parentCondition = newParentId ? { parent_id: newParentId } : { parent_id: null };
    
    const { data: existingFeatures } = await supabase
      .from('feature')
      .select('order_index')
      .match(parentCondition)
      .order('order_index', { ascending: false })
      .limit(1);
      
    newOrderIndex = (existingFeatures?.[0]?.order_index || -1) + 1;
  }

  const { data, error } = await supabase
    .from('feature')
    .update({
      parent_id: newParentId,
      order_index: newOrderIndex,
      updated_at: new Date().toISOString()
    })
    .eq('id', featureId)
    .select('*')
    .single();

  return { data, error };
};

// ========== UTILITY FUNCTIONS ==========

/**
 * Duplicate a feature
 */
export const duplicateFeature = async (featureId, options = {}) => {
  const { newTitle, targetParentId, includeProducts = true, includeTags = true } = options;

  // Get the original feature
  const { data: originalFeature, error: fetchError } = await fetchFeatureById(featureId);
  
  if (fetchError) {
    return { data: null, error: fetchError };
  }

  // Prepare new feature data
  const { id, created_at, updated_at, products, tags, child_features, ...featureData } = originalFeature;
  
  const newFeatureData = {
    ...featureData,
    title: newTitle || `${originalFeature.title} (Copy)`,
    parent_id: targetParentId !== undefined ? targetParentId : originalFeature.parent_id,
    slug: null // Reset slug for copy
  };

  // Create new feature
  const { data: newFeature, error: createError } = await createFeature(newFeatureData);
  
  if (createError) {
    return { data: null, error: createError };
  }

  // Copy relationships
  if (includeProducts && products && products.length > 0) {
    await linkProductsToFeature(newFeature.id, products.map(p => p.id));
  }

  if (includeTags && tags && tags.length > 0) {
    await linkTagsToFeature(newFeature.id, tags.map(t => t.id));
  }

  return { data: newFeature, error: null };
};

/**
 * Get feature statistics
 */
export const getFeatureStats = async () => {
  const { data, error } = await supabase
    .from('feature')
    .select('id, type, is_active')
    .eq('is_deleted', false);

  if (error) {
    return { data: null, error };
  }

  const stats = {
    total: data.length,
    active: data.filter(f => f.is_active).length,
    inactive: data.filter(f => !f.is_active).length,
    byType: {
      standard: data.filter(f => f.type === 'standard').length,
      premium: data.filter(f => f.type === 'premium').length,
      addon: data.filter(f => f.type === 'addon').length,
      enterprise: data.filter(f => f.type === 'enterprise').length
    }
  };

  return { data: stats, error: null };
};

/**
 * Search features by title and description
 */
export const searchFeatures = async (searchTerm, filters = {}) => {
  let query = supabase
    .from('feature')
    .select(`
      id,
      title,
      description,
      type,
      is_active,
      slug,
      user_benefits
    `)
    .eq('is_deleted', false);

  // Apply search
  if (searchTerm) {
    query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,user_benefits.ilike.%${searchTerm}%`);
  }

  // Apply additional filters
  if (filters.type) {
    query = query.eq('type', filters.type);
  }
  
  if (filters.is_active !== undefined) {
    query = query.eq('is_active', filters.is_active);
  }

  query = query.order('title');

  const { data, error } = await query;
  return { data, error };
};

/**
 * Get features for product selection (active features only)
 */
export const fetchFeaturesForProducts = async () => {
  const { data, error } = await supabase
    .from('feature')
    .select(`
      id,
      title,
      description,
      type,
      user_benefits,
      order_index
    `)
    .eq('is_active', true)
    .eq('is_deleted', false)
    .order('type')
    .order('order_index', { ascending: true, nullsFirst: false })
    .order('title');

  return { data, error };
};