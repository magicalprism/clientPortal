import { createClient } from '@/lib/supabase/browser';

/**
 * Utilities for managing product_proposal pivot table operations
 * Handles the many-to-many relationship between proposals and products
 */

/**
 * Add products to a proposal with optional customization
 * 
 * @param {number} proposalId - Proposal ID
 * @param {Array} products - Array of product objects or IDs
 * @param {string} tier - Proposal tier (basic, premium, enterprise, custom)
 * @returns {Promise<Object>} - Operation result
 */
export const addProductsToProposal = async (proposalId, products, tier = 'basic') => {
  const supabase = createClient();
  
  try {
    console.log('[ProductProposal] Adding products to proposal:', { proposalId, productCount: products.length, tier });

    // Prepare product_proposal records
    const productProposalRecords = products.map((product, index) => {
      // Handle both product objects and simple IDs
      const productId = typeof product === 'object' ? product.id || product.product_id : product;
      
      return {
        proposal_id: proposalId,
        product_id: productId,
        tier,
        type: product.type || 'core', // core, addon
        custom_price: product.custom_price || null,
        order: product.order || index + 1,
        created_at: new Date().toISOString()
      };
    });

    // Insert product_proposal records
    const { data: insertedRecords, error } = await supabase
      .from('product_proposal')
      .insert(productProposalRecords)
      .select(`
        *,
        product:product_id(
          id,
          title,
          price,
          yearly_price,
          description
        )
      `);

    if (error) {
      throw new Error(`Failed to add products to proposal: ${error.message}`);
    }

    console.log('[ProductProposal] Successfully added products:', insertedRecords.length);
    
    return {
      success: true,
      records: insertedRecords,
      count: insertedRecords.length
    };

  } catch (error) {
    console.error('[ProductProposal] Error adding products:', error);
    return {
      success: false,
      error: error.message,
      records: []
    };
  }
};

/**
 * Remove products from a proposal
 * 
 * @param {number} proposalId - Proposal ID
 * @param {Array} productIds - Array of product IDs to remove
 * @returns {Promise<Object>} - Operation result
 */
export const removeProductsFromProposal = async (proposalId, productIds) => {
  const supabase = createClient();
  
  try {
    console.log('[ProductProposal] Removing products from proposal:', { proposalId, productIds });

    const { error } = await supabase
      .from('product_proposal')
      .delete()
      .eq('proposal_id', proposalId)
      .in('product_id', productIds);

    if (error) {
      throw new Error(`Failed to remove products from proposal: ${error.message}`);
    }

    console.log('[ProductProposal] Successfully removed products');
    
    return {
      success: true,
      removedCount: productIds.length
    };

  } catch (error) {
    console.error('[ProductProposal] Error removing products:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Update product customization in a proposal
 * 
 * @param {number} proposalId - Proposal ID
 * @param {number} productId - Product ID
 * @param {Object} updates - Updates to apply
 * @returns {Promise<Object>} - Operation result
 */
export const updateProductInProposal = async (proposalId, productId, updates) => {
  const supabase = createClient();
  
  try {
    console.log('[ProductProposal] Updating product in proposal:', { proposalId, productId, updates });

    const { data, error } = await supabase
      .from('product_proposal')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('proposal_id', proposalId)
      .eq('product_id', productId)
      .select(`
        *,
        product:product_id(
          id,
          title,
          price,
          yearly_price
        )
      `)
      .single();

    if (error) {
      throw new Error(`Failed to update product in proposal: ${error.message}`);
    }

    console.log('[ProductProposal] Successfully updated product');
    
    return {
      success: true,
      record: data
    };

  } catch (error) {
    console.error('[ProductProposal] Error updating product:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get all products for a proposal with details
 * 
 * @param {number} proposalId - Proposal ID
 * @returns {Promise<Object>} - Products with details
 */
export const getProposalProducts = async (proposalId) => {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .from('product_proposal')
      .select(`
        *,
        product:product_id(
          id,
          title,
          price,
          yearly_price,
          payment_split_count,
          description,
          type
        )
      `)
      .eq('proposal_id', proposalId)
      .order('order', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch proposal products: ${error.message}`);
    }

    return {
      success: true,
      products: data || []
    };

  } catch (error) {
    console.error('[ProductProposal] Error fetching products:', error);
    return {
      success: false,
      error: error.message,
      products: []
    };
  }
};

/**
 * Calculate proposal totals based on billing mode
 * 
 * @param {number} proposalId - Proposal ID
 * @param {string} billingMode - 'monthly', 'yearly', or 'one-time'
 * @returns {Promise<Object>} - Pricing calculations
 */
export const calculateProposalTotals = async (proposalId, billingMode = 'monthly') => {
  const supabase = createClient();
  
  try {
    const { data: productProposals, error } = await supabase
      .from('product_proposal')
      .select(`
        *,
        product:product_id(
          id,
          title,
          price,
          yearly_price
        )
      `)
      .eq('proposal_id', proposalId);

    if (error) {
      throw new Error(`Failed to fetch products for calculation: ${error.message}`);
    }

    let totalAmount = 0;
    const breakdown = [];

    for (const pp of productProposals || []) {
      const { product, custom_price, type } = pp;
      
      if (!product) continue;

      let amount = 0;
      
      if (custom_price && custom_price > 0) {
        amount = custom_price;
      } else if (billingMode === 'yearly' && product.yearly_price) {
        amount = product.yearly_price;
      } else if (product.price) {
        amount = product.price;
      }

      totalAmount += amount;
      
      breakdown.push({
        productId: product.id,
        productTitle: product.title,
        type,
        amount,
        isCustomPrice: !!(custom_price && custom_price > 0),
        billingMode
      });
    }

    return {
      success: true,
      totalAmount,
      breakdown,
      billingMode,
      productCount: breakdown.length
    };

  } catch (error) {
    console.error('[ProductProposal] Error calculating totals:', error);
    return {
      success: false,
      error: error.message,
      totalAmount: 0,
      breakdown: []
    };
  }
};

/**
 * Reorder products in a proposal
 * 
 * @param {number} proposalId - Proposal ID
 * @param {Array} productOrders - Array of {productId, order} objects
 * @returns {Promise<Object>} - Operation result
 */
export const reorderProposalProducts = async (proposalId, productOrders) => {
  const supabase = createClient();
  
  try {
    console.log('[ProductProposal] Reordering products:', { proposalId, orders: productOrders });

    // Update each product's order
    const updatePromises = productOrders.map(({ productId, order }) =>
      supabase
        .from('product_proposal')
        .update({ 
          order,
          updated_at: new Date().toISOString()
        })
        .eq('proposal_id', proposalId)
        .eq('product_id', productId)
    );

    const results = await Promise.all(updatePromises);
    
    // Check for any errors
    const errors = results.filter(result => result.error);
    if (errors.length > 0) {
      throw new Error(`Failed to reorder some products: ${errors[0].error.message}`);
    }

    console.log('[ProductProposal] Successfully reordered products');
    
    return {
      success: true,
      updatedCount: productOrders.length
    };

  } catch (error) {
    console.error('[ProductProposal] Error reordering products:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Clone products from one proposal to another
 * 
 * @param {number} sourceProposalId - Source proposal ID
 * @param {number} targetProposalId - Target proposal ID
 * @param {Object} options - Cloning options
 * @returns {Promise<Object>} - Operation result
 */
export const cloneProposalProducts = async (sourceProposalId, targetProposalId, options = {}) => {
  const supabase = createClient();
  
  try {
    console.log('[ProductProposal] Cloning products between proposals:', { sourceProposalId, targetProposalId });

    // Get source products
    const { data: sourceProducts, error: fetchError } = await supabase
      .from('product_proposal')
      .select('*')
      .eq('proposal_id', sourceProposalId);

    if (fetchError) {
      throw new Error(`Failed to fetch source products: ${fetchError.message}`);
    }

    if (!sourceProducts || sourceProducts.length === 0) {
      return {
        success: true,
        message: 'No products to clone',
        clonedCount: 0
      };
    }

    // Prepare cloned records
    const clonedRecords = sourceProducts.map(product => ({
      proposal_id: targetProposalId,
      product_id: product.product_id,
      tier: options.tier || product.tier,
      type: product.type,
      custom_price: options.preserveCustomPrices ? product.custom_price : null,
      order: product.order,
      created_at: new Date().toISOString()
    }));

    // Insert cloned records
    const { data: insertedRecords, error: insertError } = await supabase
      .from('product_proposal')
      .insert(clonedRecords)
      .select();

    if (insertError) {
      throw new Error(`Failed to clone products: ${insertError.message}`);
    }

    console.log('[ProductProposal] Successfully cloned products:', insertedRecords.length);
    
    return {
      success: true,
      clonedCount: insertedRecords.length,
      records: insertedRecords
    };

  } catch (error) {
    console.error('[ProductProposal] Error cloning products:', error);
    return {
      success: false,
      error: error.message,
      clonedCount: 0
    };
  }
};

/**
 * Get products available for a specific tier
 * Useful for proposal building interfaces
 * 
 * @param {string} tier - Tier level
 * @param {Object} filters - Additional filters
 * @returns {Promise<Object>} - Available products
 */
export const getAvailableProductsForTier = async (tier = 'basic', filters = {}) => {
  const supabase = createClient();
  
  try {
    let query = supabase
      .from('product')
      .select('*')
      .eq('status', 'active');

    // Apply additional filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        query = query.eq(key, value);
      }
    });

    const { data: products, error } = await query.order('title');

    if (error) {
      throw new Error(`Failed to fetch available products: ${error.message}`);
    }

    // TODO: Add tier-specific filtering logic based on your business rules
    // For now, return all active products
    
    return {
      success: true,
      products: products || [],
      tier
    };

  } catch (error) {
    console.error('[ProductProposal] Error fetching available products:', error);
    return {
      success: false,
      error: error.message,
      products: []
    };
  }
};