export const createProposal = async (proposalData) => {
  const { order_index, ...otherData } = proposalData;
  
  // Get next order_index if not provided
  let finalOrderIndex = order_index;
  if (finalOrderIndex === undefined) {
    const { data: maxOrder } = await supabase
      .from('proposal')
      .select('order_index')
      .eq('parent_id', proposalData.parent_id || null)
      .order('order_index', { ascending: false })
      .limit(1)
      .single();
    
    finalOrderIndex = (maxOrder?.order_index || 0) + 1;
  }

  return await supabase
    .from('proposal')
    .insert({
      ...otherData,
      order_index: finalOrderIndex,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();
};

/**
 * Update proposal by ID
 */
export const updateProposal = async (id, updates) => {
  // Handle status change timestamps
  const updateData = {
    ...updates,
    updated_at: new Date().toISOString()
  };

  // Set completion timestamps based on status
  if (updates.status) {
    switch (updates.status) {
      case 'sent':
        updateData.sent_at = new Date().toISOString();
        break;
      case 'accepted':
        updateData.accepted_at = new Date().toISOString();
        break;
      case 'rejected':
        updateData.rejected_at = new Date().toISOString();
        break;
      case 'expired':
        updateData.expired_at = new Date().toISOString();
        break;
    }
  }

  return await supabase
    .from('proposal')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();
};

/**
 * Delete proposal by ID (soft delete)
 */
export const deleteProposal = async (id) => {
  return await supabase
    .from('proposal')
    .update({ 
      is_deleted: true, 
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', id);
};

// ===============================
// RELATIONSHIP QUERIES
// ===============================

/**
 * Get proposals by company ID
 */
export const fetchProposalsByCompanyId = async (companyId) => {
  return await supabase
    .from('proposal')
    .select(`
      *,
      company:company_id(id, title)
    `)
    .eq('company_id', companyId)
    .eq('is_deleted', false)
    .order('order_index')
    .order('created_at', { ascending: false });
};

/**
 * Get proposals by status
 */
export const fetchProposalsByStatus = async (status) => {
  return await supabase
    .from('proposal')
    .select('*')
    .eq('status', status)
    .eq('is_deleted', false)
    .order('order_index')
    .order('created_at', { ascending: false });
};

/**
 * Get proposals by tier
 */
export const fetchProposalsByTier = async (tier) => {
  return await supabase
    .from('proposal')
    .select('*')
    .eq('tier', tier)
    .eq('is_deleted', false)
    .order('order_index')
    .order('created_at', { ascending: false });
};

/**
 * Get proposals by author
 */
export const fetchProposalsByAuthorId = async (authorId) => {
  return await supabase
    .from('proposal')
    .select('*')
    .eq('author_id', authorId)
    .eq('is_deleted', false)
    .order('order_index')
    .order('created_at', { ascending: false });
};

/**
 * Get proposal with full details including relationships
 */
export const fetchProposalWithDetails = async (id) => {
  return await supabase
    .from('proposal')
    .select(`
      *,
      company:company_id(id, title),
      author:author_id(id, title),
      parent:parent_id(id, title)
    `)
    .eq('id', id)
    .eq('is_deleted', false)
    .single();
};

// ===============================
// HIERARCHICAL FUNCTIONS
// ===============================

/**
 * Get child proposals
 */
export const fetchChildProposals = async (parentId) => {
  return await supabase
    .from('proposal')
    .select('*')
    .eq('parent_id', parentId)
    .eq('is_deleted', false)
    .order('order_index')
    .order('created_at', { ascending: false });
};

/**
 * Get proposal hierarchy (parent and children)
 */
export const fetchProposalHierarchy = async (proposalId) => {
  const { data: proposal, error: proposalError } = await fetchProposalById(proposalId);
  if (proposalError) return { data: null, error: proposalError };

  const { data: children, error: childrenError } = await fetchChildProposals(proposalId);
  if (childrenError) return { data: null, error: childrenError };

  let parent = null;
  if (proposal.parent_id) {
    const { data: parentData, error: parentError } = await fetchProposalById(proposal.parent_id);
    if (!parentError) parent = parentData;
  }

  return {
    data: {
      proposal,
      parent,
      children: children || []
    },
    error: null
  };
};

/**
 * Reorder proposals within the same parent
 */
export const reorderProposals = async (proposalIds, parentId = null) => {
  const updates = proposalIds.map((id, index) => ({
    id,
    order_index: index,
    updated_at: new Date().toISOString()
  }));

  const promises = updates.map(update => 
    supabase
      .from('proposal')
      .update({ order_index: update.order_index, updated_at: update.updated_at })
      .eq('id', update.id)
  );

  const results = await Promise.all(promises);
  return { data: results, error: null };
};

// ===============================
// PRODUCT RELATIONSHIP FUNCTIONS
// ===============================

/**
 * Link a product to a proposal (core products)
 */
export const linkProductToProposal = async (productId, proposalId, type = 'core') => {
  return await supabase
    .from('product_proposal')
    .insert({ product_id: productId, proposal_id: proposalId, type })
    .select();
};

/**
 * Unlink a product from a proposal
 */
export const unlinkProductFromProposal = async (productId, proposalId, type = null) => {
  let query = supabase
    .from('product_proposal')
    .delete()
    .eq('product_id', productId)
    .eq('proposal_id', proposalId);

  if (type) {
    query = query.eq('type', type);
  }

  return await query;
};

/**
 * Get products for a proposal (core products)
 */
export const fetchProductsForProposal = async (proposalId) => {
  return await supabase
    .from('product_proposal')
    .select(`
      product_id,
      type,
      product:product_id(*)
    `)
    .eq('proposal_id', proposalId)
    .eq('type', 'core');
};

/**
 * Get add-ons for a proposal
 */
export const fetchAddOnsForProposal = async (proposalId) => {
  return await supabase
    .from('product_proposal')
    .select(`
      product_id,
      type,
      product:product_id(*)
    `)
    .eq('proposal_id', proposalId)
    .eq('type', 'addon');
};

/**
 * Get all products (core + addons) for a proposal
 */
export const fetchAllProductsForProposal = async (proposalId) => {
  return await supabase
    .from('product_proposal')
    .select(`
      product_id,
      type,
      product:product_id(*)
    `)
    .eq('proposal_id', proposalId);
};

/**
 * Get proposals for a product
 */
export const fetchProposalsForProduct = async (productId) => {
  return await supabase
    .from('product_proposal')
    .select(`
      proposal_id,
      type,
      proposal:proposal_id(*)
    `)
    .eq('product_id', productId);
};

// ===============================
// CONTRACT RELATIONSHIP FUNCTIONS
// ===============================

/**
 * Link a contract to a proposal
 */
export const linkContractToProposal = async (contractId, proposalId) => {
  return await supabase
    .from('contract_proposal')
    .insert({ contract_id: contractId, proposal_id: proposalId })
    .select();
};

/**
 * Unlink a contract from a proposal
 */
export const unlinkContractFromProposal = async (contractId, proposalId) => {
  return await supabase
    .from('contract_proposal')
    .delete()
    .eq('contract_id', contractId)
    .eq('proposal_id', proposalId);
};

/**
 * Get contracts for a proposal
 */
export const fetchContractsForProposal = async (proposalId) => {
  return await supabase
    .from('contract_proposal')
    .select(`
      contract_id,
      contract:contract_id(*)
    `)
    .eq('proposal_id', proposalId);
};

/**
 * Get proposals for a contract
 */
export const fetchProposalsForContract = async (contractId) => {
  return await supabase
    .from('contract_proposal')
    .select(`
      proposal_id,
      proposal:proposal_id(*)
    `)
    .eq('contract_id', contractId);
};

// ===============================
// DELIVERABLE RELATIONSHIP FUNCTIONS
// ===============================

/**
 * Link a deliverable to a proposal
 */
export const linkDeliverableToProposal = async (deliverableId, proposalId) => {
  return await supabase
    .from('deliverable_proposal')
    .insert({ deliverable_id: deliverableId, proposal_id: proposalId })
    .select();
};

/**
 * Unlink a deliverable from a proposal
 */
export const unlinkDeliverableFromProposal = async (deliverableId, proposalId) => {
  return await supabase
    .from('deliverable_proposal')
    .delete()
    .eq('deliverable_id', deliverableId)
    .eq('proposal_id', proposalId);
};

/**
 * Get deliverables for a proposal
 */
export const fetchDeliverablesForProposal = async (proposalId) => {
  return await supabase
    .from('deliverable_proposal')
    .select(`
      deliverable_id,
      deliverable:deliverable_id(*)
    `)
    .eq('proposal_id', proposalId);
};

/**
 * Get proposals for a deliverable
 */
export const fetchProposalsForDeliverable = async (deliverableId) => {
  return await supabase
    .from('deliverable_proposal')
    .select(`
      proposal_id,
      proposal:proposal_id(*)
    `)
    .eq('deliverable_id', deliverableId);
};

// ===============================
// FEATURE RELATIONSHIP FUNCTIONS
// ===============================

/**
 * Link a feature to a proposal
 */
export const linkFeatureToProposal = async (featureId, proposalId) => {
  return await supabase
    .from('feature_proposal')
    .insert({ feature_id: featureId, proposal_id: proposalId })
    .select();
};

/**
 * Unlink a feature from a proposal
 */
export const unlinkFeatureFromProposal = async (featureId, proposalId) => {
  return await supabase
    .from('feature_proposal')
    .delete()
    .eq('feature_id', featureId)
    .eq('proposal_id', proposalId);
};

/**
 * Get features for a proposal
 */
export const fetchFeaturesForProposal = async (proposalId) => {
  return await supabase
    .from('feature_proposal')
    .select(`
      feature_id,
      feature:feature_id(*)
    `)
    .eq('proposal_id', proposalId);
};

/**
 * Get proposals for a feature
 */
export const fetchProposalsForFeature = async (featureId) => {
  return await supabase
    .from('feature_proposal')
    .select(`
      proposal_id,
      proposal:proposal_id(*)
    `)
    .eq('feature_id', featureId);
};

// ===============================
// PROBLEM RELATIONSHIP FUNCTIONS
// ===============================

/**
 * Link a problem to a proposal
 */
export const linkProblemToProposal = async (problemId, proposalId) => {
  return await supabase
    .from('problem_proposal')
    .insert({ problem_id: problemId, proposal_id: proposalId })
    .select();
};

/**
 * Unlink a problem from a proposal
 */
export const unlinkProblemFromProposal = async (problemId, proposalId) => {
  return await supabase
    .from('problem_proposal')
    .delete()
    .eq('problem_id', problemId)
    .eq('proposal_id', proposalId);
};

/**
 * Get problems for a proposal
 */
export const fetchProblemsForProposal = async (proposalId) => {
  return await supabase
    .from('problem_proposal')
    .select(`
      problem_id,
      problem:problem_id(*)
    `)
    .eq('proposal_id', proposalId);
};

/**
 * Get proposals for a problem
 */
export const fetchProposalsForProblem = async (problemId) => {
  return await supabase
    .from('problem_proposal')
    .select(`
      proposal_id,
      proposal:proposal_id(*)
    `)
    .eq('problem_id', problemId);
};

// ===============================
// TAG RELATIONSHIP FUNCTIONS
// ===============================

/**
 * Link a tag (category) to a proposal
 */
export const linkTagToProposal = async (categoryId, proposalId) => {
  return await supabase
    .from('category_proposal')
    .insert({ category_id: categoryId, proposal_id: proposalId })
    .select();
};

/**
 * Unlink a tag from a proposal
 */
export const unlinkTagFromProposal = async (categoryId, proposalId) => {
  return await supabase
    .from('category_proposal')
    .delete()
    .eq('category_id', categoryId)
    .eq('proposal_id', proposalId);
};

/**
 * Get tags for a proposal
 */
export const fetchTagsForProposal = async (proposalId) => {
  return await supabase
    .from('category_proposal')
    .select(`
      category_id,
      category:category_id(*)
    `)
    .eq('proposal_id', proposalId);
};

/**
 * Get proposals for a tag
 */
export const fetchProposalsForTag = async (categoryId) => {
  return await supabase
    .from('category_proposal')
    .select(`
      proposal_id,
      proposal:proposal_id(*)
    `)
    .eq('category_id', categoryId);
};

// ===============================
// UTILITY FUNCTIONS
// ===============================

/**
 * Duplicate a proposal
 */
export const duplicateProposal = async (proposalId, newTitle = null) => {
  const { data: originalProposal, error: fetchError } = await fetchProposalById(proposalId);
  if (fetchError) return { data: null, error: fetchError };

  const { id, created_at, updated_at, ...proposalData } = originalProposal;
  
  const duplicatedData = {
    ...proposalData,
    title: newTitle || `${originalProposal.title} (Copy)`,
    status: 'draft' // Reset status for duplicate
  };

  return await createProposal(duplicatedData);
};

/**
 * Get proposal statistics
 */
export const getProposalStats = async (proposalId) => {
  // Get basic proposal info
  const { data: proposal, error: proposalError } = await fetchProposalById(proposalId);
  if (proposalError) return { data: null, error: proposalError };

  // Get related counts
  const { count: productCount } = await supabase
    .from('product_proposal')
    .select('*', { count: 'exact', head: true })
    .eq('proposal_id', proposalId)
    .eq('type', 'core');

  const { count: addonCount } = await supabase
    .from('product_proposal')
    .select('*', { count: 'exact', head: true })
    .eq('proposal_id', proposalId)
    .eq('type', 'addon');

  const { count: contractCount } = await supabase
    .from('contract_proposal')
    .select('*', { count: 'exact', head: true })
    .eq('proposal_id', proposalId);

  const { count: deliverableCount } = await supabase
    .from('deliverable_proposal')
    .select('*', { count: 'exact', head: true })
    .eq('proposal_id', proposalId);

  const { count: featureCount } = await supabase
    .from('feature_proposal')
    .select('*', { count: 'exact', head: true })
    .eq('proposal_id', proposalId);

  const { count: problemCount } = await supabase
    .from('problem_proposal')
    .select('*', { count: 'exact', head: true })
    .eq('proposal_id', proposalId);

  return {
    data: {
      proposal,
      productCount: productCount || 0,
      addonCount: addonCount || 0,
      contractCount: contractCount || 0,
      deliverableCount: deliverableCount || 0,
      featureCount: featureCount || 0,
      problemCount: problemCount || 0
    },
    error: null
  };
};

/**
 * Search proposals with advanced filtering
 */
export const searchProposals = async (searchTerm = '', filters = {}) => {
  let query = supabase
    .from('proposal')
    .select(`
      *,
      company:company_id(id, title),
      author:author_id(id, title)
    `)
    .eq('is_deleted', false);

  // Apply search term
  if (searchTerm) {
    query = query.or(`title.ilike.%${searchTerm}%,proposal_content.ilike.%${searchTerm}%`);
  }

  // Apply filters
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '' && value !== null) {
      if (Array.isArray(value)) {
        query = query.in(key, value);
      } else {
        query = query.eq(key, value);
      }
    }
  });

  // Default ordering
  query = query.order('order_index').order('created_at', { ascending: false });

  return await query;
};

/**
 * Get proposals with advanced filtering and pagination
 */
export const fetchProposalsWithFilters = async (filters = {}, searchQuery = '', page = 1, limit = 50) => {
  const offset = (page - 1) * limit;

  let query = supabase
    .from('proposal')
    .select(`
      *,
      company:company_id(id, title),
      author:author_id(id, title)
    `, { count: 'exact' })
    .eq('is_deleted', false);

  // Apply search
  if (searchQuery) {
    query = query.or(`title.ilike.%${searchQuery}%,proposal_content.ilike.%${searchQuery}%`);
  }

  // Apply filters
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '' && value !== null) {
      if (Array.isArray(value)) {
        query = query.in(key, value);
      } else {
        query = query.eq(key, value);
      }
    }
  });

  // Apply sorting
  if (filters.sort) {
    const [field, direction] = filters.sort.split(':');
    query = query.order(field, { ascending: direction === 'asc' });
  } else {
    query = query.order('order_index').order('created_at', { ascending: false });
  }

  // Apply pagination
  query = query.range(offset, offset + limit - 1);

  return await query;
};

/**
 * Calculate proposal totals based on linked products
 */
export const calculateProposalTotals = async (proposalId) => {
  // Get all products (core + addons) for this proposal
  const { data: productLinks, error: productError } = await fetchAllProductsForProposal(proposalId);
  if (productError) return { data: null, error: productError };

  let totalMonthly = 0;
  let totalYearly = 0;

  productLinks.forEach(link => {
    const product = link.product;
    if (product) {
      totalMonthly += parseFloat(product.price || 0);
      totalYearly += parseFloat(product.yearly_price || 0);
    }
  });

  // Update the proposal with calculated totals
  const { data: updatedProposal, error: updateError } = await updateProposal(proposalId, {
    total_monthly: totalMonthly,
    total_yearly: totalYearly
  });

  return {
    data: {
      totalMonthly,
      totalYearly,
      proposal: updatedProposal
    },
    error: updateError
  };
};