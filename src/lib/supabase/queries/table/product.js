// lib/supabase/queries/table/product.js

/*
REQUIRED SQL MIGRATIONS:

-- Rename order to order_index for standardization
ALTER TABLE product RENAME COLUMN "order" TO order_index;

-- Add missing columns referenced in config
ALTER TABLE product ADD COLUMN IF NOT EXISTS thumbnail_id integer;

-- Update existing records to have proper order_index values (if needed)
WITH ranked_products AS (
  SELECT id, 
    ROW_NUMBER() OVER (
      PARTITION BY COALESCE(parent_id, category_id, 0) 
      ORDER BY COALESCE(created_at, NOW()), id
    ) - 1 as new_order_index
  FROM product 
  WHERE order_index IS NULL
)
UPDATE product 
SET order_index = ranked_products.new_order_index
FROM ranked_products 
WHERE product.id = ranked_products.id;
*/

import { createClient } from '@/lib/supabase/browser';
const supabase = createClient();

/**
 * Get a single product by ID with all related data
 */
export const fetchProductById = async (id) => {
  const { data, error } = await supabase
    .from('product')
    .select(`
      *,
      category:category_id(id, title),
      author:author_id(id, title, email),
      parent:parent_id(id, title),
      thumbnail:thumbnail_id(id, url, alt_text),
      deliverables:deliverable_product(
        deliverable:deliverable_id(id, title, type)
      ),
      features:feature_product(
        feature:feature_id(id, title, type)
      ),
      proposals:product_proposal(
        proposal:proposal_id(id, title, status, tier)
      ),
      tags:category_product(
        category:category_id(id, title)
      ),
      child_products:product!parent_id(id, title, type, status, price, order_index)
    `)
    .eq('id', id)
    .single();

  // Transform nested data
  if (data) {
    data.deliverables = data.deliverables?.map(d => d.deliverable) || [];
    data.features = data.features?.map(f => f.feature) || [];
    data.proposals = data.proposals?.map(p => p.proposal) || [];
    data.tags = data.tags?.map(t => t.category) || [];
    
    // Sort child products by order_index
    if (data.child_products) {
      data.child_products.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
    }
  }

  return { data, error };
};

/**
 * Get all products with optional filters
 */
export const fetchAllProducts = async (filters = {}) => {
  let query = supabase
    .from('product')
    .select(`
      id,
      title,
      description,
      type,
      status,
      price,
      yearly_price,
      payment_split_count,
      frequency,
      includes_hosting,
      slug,
      order_index,
      created_at,
      updated_at,
      category:category_id(id, title),
      author:author_id(id, title),
      parent:parent_id(id, title),
      thumbnail:thumbnail_id(id, url, alt_text),
      deliverable_count:deliverable_product(count),
      feature_count:feature_product(count),
      proposal_count:product_proposal(count),
      child_count:product!parent_id(count)
    `)
    .eq('is_deleted', false);

  // Apply filters
  if (filters.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }

  if (filters.type) {
    query = query.eq('type', filters.type);
  }
  
  if (filters.status && filters.status.length > 0) {
    query = query.in('status', filters.status);
  }
  
  if (filters.category_id) {
    query = query.eq('category_id', filters.category_id);
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

  if (filters.includes_hosting !== undefined) {
    query = query.eq('includes_hosting', filters.includes_hosting);
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
 * Create a new product
 */
export const createProduct = async (productData) => {
  // Get current max order_index for the parent/category combination
  let orderQuery = supabase
    .from('product')
    .select('order_index');

  if (productData.parent_id) {
    orderQuery = orderQuery.eq('parent_id', productData.parent_id);
  } else if (productData.category_id) {
    orderQuery = orderQuery.eq('category_id', productData.category_id);
  }

  const { data: existingProducts } = await orderQuery
    .order('order_index', { ascending: false })
    .limit(1);
    
  const nextOrderIndex = (existingProducts?.[0]?.order_index || 0) + 1;

  const { data, error } = await supabase
    .from('product')
    .insert([{
      ...productData,
      status: productData.status || 'active',
      order_index: productData.order_index ?? nextOrderIndex,
      includes_hosting: productData.includes_hosting ?? true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }])
    .select(`
      *,
      category:category_id(id, title),
      author:author_id(id, title),
      parent:parent_id(id, title)
    `)
    .single();

  return { data, error };
};

/**
 * Update product
 */
export const updateProduct = async (id, updates) => {
  const { data, error } = await supabase
    .from('product')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select(`
      *,
      category:category_id(id, title),
      author:author_id(id, title),
      parent:parent_id(id, title)
    `)
    .single();

  return { data, error };
};

/**
 * Delete product (soft delete)
 */
export const deleteProduct = async (id, softDelete = true) => {
  if (softDelete) {
    const { error } = await supabase
      .from('product')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
    return { success: !error, error };
  } else {
    const { error } = await supabase
      .from('product')
      .delete()
      .eq('id', id);
    return { success: !error, error };
  }
};

// ========== CATEGORY RELATIONS ==========

/**
 * Get products by category
 */
export const fetchProductsByCategory = async (categoryId) => {
  const { data, error } = await supabase
    .from('product')
    .select(`
      id,
      title,
      description,
      type,
      status,
      price,
      yearly_price,
      order_index,
      created_at,
      author:author_id(id, title),
      deliverable_count:deliverable_product(count),
      feature_count:feature_product(count)
    `)
    .eq('category_id', categoryId)
    .eq('is_deleted', false)
    .order('order_index', { ascending: true, nullsFirst: false })
    .order('title', { ascending: true });

  return { data, error };
};

// ========== HIERARCHICAL MANAGEMENT ==========

/**
 * Get products by parent (hierarchical)
 */
export const fetchProductsByParent = async (parentId) => {
  const condition = parentId ? { parent_id: parentId } : { parent_id: null };

  const { data, error } = await supabase
    .from('product')
    .select(`
      id,
      title,
      description,
      type,
      status,
      price,
      yearly_price,
      order_index,
      created_at,
      updated_at,
      category:category_id(id, title),
      child_count:product!parent_id(count)
    `)
    .match(condition)
    .eq('is_deleted', false)
    .order('order_index', { ascending: true, nullsFirst: false })
    .order('title', { ascending: true });

  return { data, error };
};

/**
 * Get root-level products (no parent)
 */
export const fetchRootProducts = async (categoryId = null) => {
  let query = supabase
    .from('product')
    .select(`
      id,
      title,
      description,
      type,
      status,
      price,
      yearly_price,
      order_index,
      created_at,
      category:category_id(id, title),
      child_count:product!parent_id(count)
    `)
    .is('parent_id', null)
    .eq('is_deleted', false);

  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  query = query.order('order_index', { ascending: true, nullsFirst: false })
    .order('title', { ascending: true });

  const { data, error } = await query;
  return { data, error };
};

/**
 * Get child products
 */
export const fetchChildProducts = async (parentId) => {
  return await fetchProductsByParent(parentId);
};

// ========== TYPE & STATUS MANAGEMENT ==========

/**
 * Get products by type
 */
export const fetchProductsByType = async (type) => {
  const { data, error } = await supabase
    .from('product')
    .select(`
      id,
      title,
      description,
      status,
      price,
      yearly_price,
      order_index,
      created_at,
      category:category_id(id, title),
      deliverable_count:deliverable_product(count),
      feature_count:feature_product(count)
    `)
    .eq('type', type)
    .eq('is_deleted', false)
    .order('order_index', { ascending: true, nullsFirst: false })
    .order('title', { ascending: true });

  return { data, error };
};

/**
 * Get active products
 */
export const fetchActiveProducts = async () => {
  const { data, error } = await supabase
    .from('product')
    .select(`
      id,
      title,
      description,
      type,
      price,
      yearly_price,
      payment_split_count,
      order_index,
      category:category_id(id, title)
    `)
    .eq('status', 'active')
    .eq('is_deleted', false)
    .order('order_index', { ascending: true, nullsFirst: false })
    .order('title', { ascending: true });

  return { data, error };
};

/**
 * Update product status
 */
export const updateProductStatus = async (id, newStatus) => {
  const { data, error } = await supabase
    .from('product')
    .update({
      status: newStatus,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select('id, status')
    .single();

  return { data, error };
};

// ========== DELIVERABLE RELATIONSHIPS ==========

/**
 * Link deliverables to product
 */
export const linkDeliverablesToProduct = async (productId, deliverableIds) => {
  if (!Array.isArray(deliverableIds)) {
    deliverableIds = [deliverableIds];
  }

  // Remove existing links first
  await supabase
    .from('deliverable_product')
    .delete()
    .eq('product_id', productId);

  // Add new links
  const insertData = deliverableIds.map(deliverableId => ({
    product_id: productId,
    deliverable_id: deliverableId,
    created_at: new Date().toISOString()
  }));

  const { data, error } = await supabase
    .from('deliverable_product')
    .insert(insertData)
    .select(`
      deliverable:deliverable_id(id, title, type)
    `);

  return { 
    data: data?.map(item => item.deliverable) || [], 
    error 
  };
};

/**
 * Get product deliverables
 */
export const fetchProductDeliverables = async (productId) => {
  const { data, error } = await supabase
    .from('deliverable_product')
    .select(`
      deliverable:deliverable_id(
        id,
        title,
        type,
        description
      )
    `)
    .eq('product_id', productId);

  return { 
    data: data?.map(item => item.deliverable) || [], 
    error 
  };
};

// ========== FEATURE RELATIONSHIPS ==========

/**
 * Link features to product
 */
export const linkFeaturesToProduct = async (productId, featureIds) => {
  if (!Array.isArray(featureIds)) {
    featureIds = [featureIds];
  }

  // Remove existing links first
  await supabase
    .from('feature_product')
    .delete()
    .eq('product_id', productId);

  // Add new links
  const insertData = featureIds.map(featureId => ({
    product_id: productId,
    feature_id: featureId,
    created_at: new Date().toISOString()
  }));

  const { data, error } = await supabase
    .from('feature_product')
    .insert(insertData)
    .select(`
      feature:feature_id(id, title, type)
    `);

  return { 
    data: data?.map(item => item.feature) || [], 
    error 
  };
};

/**
 * Get product features
 */
export const fetchProductFeatures = async (productId) => {
  const { data, error } = await supabase
    .from('feature_product')
    .select(`
      feature:feature_id(
        id,
        title,
        type,
        description,
        user_benefits
      )
    `)
    .eq('product_id', productId);

  return { 
    data: data?.map(item => item.feature) || [], 
    error 
  };
};

// ========== PROPOSAL RELATIONSHIPS ==========

/**
 * Link proposals to product
 */
export const linkProposalsToProduct = async (productId, proposalIds) => {
  if (!Array.isArray(proposalIds)) {
    proposalIds = [proposalIds];
  }

  // Remove existing links first
  await supabase
    .from('product_proposal')
    .delete()
    .eq('product_id', productId);

  // Add new links
  const insertData = proposalIds.map(proposalId => ({
    product_id: productId,
    proposal_id: proposalId,
    created_at: new Date().toISOString()
  }));

  const { data, error } = await supabase
    .from('product_proposal')
    .insert(insertData)
    .select(`
      proposal:proposal_id(id, title, status, tier)
    `);

  return { 
    data: data?.map(item => item.proposal) || [], 
    error 
  };
};

/**
 * Get product proposals
 */
export const fetchProductProposals = async (productId) => {
  const { data, error } = await supabase
    .from('product_proposal')
    .select(`
      proposal:proposal_id(
        id,
        title,
        status,
        tier,
        created_at
      )
    `)
    .eq('product_id', productId);

  return { 
    data: data?.map(item => item.proposal) || [], 
    error 
  };
};

// ========== TAG MANAGEMENT ==========

/**
 * Link tags to product
 */
export const linkTagsToProduct = async (productId, categoryIds) => {
  if (!Array.isArray(categoryIds)) {
    categoryIds = [categoryIds];
  }

  // Remove existing links first
  await supabase
    .from('category_product')
    .delete()
    .eq('product_id', productId);

  // Add new links
  const insertData = categoryIds.map(categoryId => ({
    product_id: productId,
    category_id: categoryId,
    created_at: new Date().toISOString()
  }));

  const { data, error } = await supabase
    .from('category_product')
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
 * Get product tags
 */
export const fetchProductTags = async (productId) => {
  const { data, error } = await supabase
    .from('category_product')
    .select(`
      category:category_id(id, title)
    `)
    .eq('product_id', productId);

  return { 
    data: data?.map(item => item.category) || [], 
    error 
  };
};

// ========== PRICING FUNCTIONS ==========

/**
 * Get products by price range
 */
export const fetchProductsByPriceRange = async (minPrice = null, maxPrice = null) => {
  let query = supabase
    .from('product')
    .select(`
      id,
      title,
      type,
      price,
      yearly_price,
      payment_split_count,
      category:category_id(id, title)
    `)
    .eq('status', 'active')
    .eq('is_deleted', false);

  // Note: price is stored as text, so we need to cast it
  if (minPrice !== null) {
    query = query.gte('price::numeric', minPrice);
  }
  
  if (maxPrice !== null) {
    query = query.lte('price::numeric', maxPrice);
  }

  query = query.order('price::numeric', { ascending: true });

  const { data, error } = await query;
  return { data, error };
};

/**
 * Get products with hosting included
 */
export const fetchProductsWithHosting = async () => {
  const { data, error } = await supabase
    .from('product')
    .select(`
      id,
      title,
      type,
      price,
      yearly_price,
      description,
      category:category_id(id, title)
    `)
    .eq('includes_hosting', true)
    .eq('status', 'active')
    .eq('is_deleted', false)
    .order('order_index', { ascending: true, nullsFirst: false })
    .order('title', { ascending: true });

  return { data, error };
};

// ========== REORDERING ==========

/**
 * Reorder products within same container
 */
export const reorderProducts = async (containerId, productOrders, containerType = 'category') => {
  const containerField = containerType === 'parent' ? 'parent_id' : 'category_id';
  
  const updates = productOrders.map(({ id, order_index }) => 
    supabase
      .from('product')
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
 * Move product to different parent/category
 */
export const moveProduct = async (productId, newParentId = null, newCategoryId = null, newOrderIndex = null) => {
  // Get next order_index if not provided
  if (newOrderIndex === null) {
    let orderQuery = supabase
      .from('product')
      .select('order_index');

    if (newParentId) {
      orderQuery = orderQuery.eq('parent_id', newParentId);
    } else if (newCategoryId) {
      orderQuery = orderQuery.eq('category_id', newCategoryId);
    }

    const { data: existingProducts } = await orderQuery
      .order('order_index', { ascending: false })
      .limit(1);
      
    newOrderIndex = (existingProducts?.[0]?.order_index || 0) + 1;
  }

  const updateData = {
    order_index: newOrderIndex,
    updated_at: new Date().toISOString()
  };

  if (newParentId !== undefined) {
    updateData.parent_id = newParentId;
  }

  if (newCategoryId !== undefined) {
    updateData.category_id = newCategoryId;
  }

  const { data, error } = await supabase
    .from('product')
    .update(updateData)
    .eq('id', productId)
    .select('*')
    .single();

  return { data, error };
};

// ========== SEARCH ==========

/**
 * Search products by title or description
 */
export const searchProducts = async (searchTerm, filters = {}) => {
  let query = supabase
    .from('product')
    .select(`
      id,
      title,
      description,
      type,
      status,
      price,
      yearly_price,
      category:category_id(id, title)
    `)
    .eq('is_deleted', false);

  // Apply search
  if (searchTerm) {
    query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
  }

  // Apply additional filters
  if (filters.type) {
    query = query.eq('type', filters.type);
  }
  
  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  
  if (filters.category_id) {
    query = query.eq('category_id', filters.category_id);
  }

  query = query.order('title');

  const { data, error } = await query;
  return { data, error };
};

// ========== UTILITY FUNCTIONS ==========

/**
 * Duplicate a product
 */
export const duplicateProduct = async (productId, options = {}) => {
  const { 
    newTitle, 
    targetParentId, 
    targetCategoryId,
    includeDeliverables = true, 
    includeFeatures = true, 
    includeTags = true 
  } = options;

  // Get the original product
  const { data: originalProduct, error: fetchError } = await fetchProductById(productId);
  
  if (fetchError) {
    return { data: null, error: fetchError };
  }

  // Prepare new product data
  const { 
    id, 
    created_at, 
    updated_at, 
    slug,
    deliverables, 
    features, 
    proposals,
    tags, 
    child_products, 
    ...productData 
  } = originalProduct;
  
  const newProductData = {
    ...productData,
    title: newTitle || `${originalProduct.title} (Copy)`,
    status: 'draft', // Reset status for copy
    parent_id: targetParentId !== undefined ? targetParentId : originalProduct.parent_id,
    category_id: targetCategoryId !== undefined ? targetCategoryId : originalProduct.category_id,
    slug: null // Reset slug for copy
  };

  // Create new product
  const { data: newProduct, error: createError } = await createProduct(newProductData);
  
  if (createError) {
    return { data: null, error: createError };
  }

  // Copy relationships
  if (includeDeliverables && deliverables && deliverables.length > 0) {
    await linkDeliverablesToProduct(newProduct.id, deliverables.map(d => d.id));
  }

  if (includeFeatures && features && features.length > 0) {
    await linkFeaturesToProduct(newProduct.id, features.map(f => f.id));
  }

  if (includeTags && tags && tags.length > 0) {
    await linkTagsToProduct(newProduct.id, tags.map(t => t.id));
  }

  return { data: newProduct, error: null };
};

/**
 * Get product statistics
 */
export const getProductStats = async (categoryId = null) => {
  let query = supabase
    .from('product')
    .select('id, type, status, price, yearly_price')
    .eq('is_deleted', false);

  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  const { data, error } = await query;

  if (error) {
    return { data: null, error };
  }

  const stats = {
    total: data.length,
    byStatus: {
      active: data.filter(p => p.status === 'active').length,
      deprecated: data.filter(p => p.status === 'deprecated').length,
      draft: data.filter(p => p.status === 'draft').length,
      archived: data.filter(p => p.status === 'archived').length
    },
    byType: {
      website: data.filter(p => p.type === 'website').length,
      maintenance: data.filter(p => p.type === 'maintenance').length,
      app: data.filter(p => p.type === 'app').length,
      addon: data.filter(p => p.type === 'addon').length,
      consulting: data.filter(p => p.type === 'consulting').length
    }
  };

  // Calculate pricing stats (price is stored as text, so convert to number)
  const prices = data
    .map(p => parseFloat(p.price))
    .filter(price => !isNaN(price) && price > 0);

  if (prices.length > 0) {
    stats.pricing = {
      min: Math.min(...prices),
      max: Math.max(...prices),
      average: prices.reduce((sum, price) => sum + price, 0) / prices.length
    };
  }

  return { data: stats, error: null };
};