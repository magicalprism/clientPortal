// lib/supabase/queries/table/contract.js

import { createClient } from '@/lib/supabase/browser';
const supabase = createClient();

/**
 * Updates a contract's content (EXISTING - PRESERVED)
 */
export const updateContractContentById = async (id, content) => {
  return await supabase
    .from('contract')
    .update({
      content,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
};

/**
 * Get a single contract by ID with all related data
 */
export const fetchContractById = async (id) => {
  const { data, error } = await supabase
    .from('contract')
    .select(`
      *,
      company:company_id(id, title),
      proposal:proposal_id(id, title, status),
      project:project_id(id, title, status),
      author:author_id(id, title, email),
      parent:parent_id(id, title),
      thumbnail:thumbnail_id(id, url, alt_text),
      products:contract_product(
        product:product_id(id, title, price, yearly_price)
      ),
      milestones:contract_milestone(
        milestone:milestone_id(id, title, description)
      ),
      projects:contract_project(
        project:project_id(id, title, status)
      ),
      payments:contract_payment(
        id,
        amount,
        due_date,
        status,
        payment_method,
        description,
        invoice_id,
        created_at
      ),
      tags:category_contract(
        category:category_id(id, title)
      ),
      child_contracts:contract!parent_id(id, title, status)
    `)
    .eq('id', id)
    .single();

  // Transform the nested data for easier use
  if (data) {
    data.products = data.products?.map(p => p.product) || [];
    data.milestones = data.milestones?.map(m => m.milestone) || [];
    data.projects = data.projects?.map(p => p.project) || [];
    data.tags = data.tags?.map(t => t.category) || [];
  }

  return { data, error };
};

/**
 * Get all contracts with optional filters
 */
export const fetchAllContracts = async (filters = {}) => {
  let query = supabase
    .from('contract')
    .select(`
      id,
      title,
      status,
      signature_status,
      start_date,
      due_date,
      platform,
      projected_length,
      created_at,
      updated_at,
      company:company_id(id, title),
      proposal:proposal_id(id, title),
      project:project_id(id, title),
      author:author_id(id, title),
      parent:parent_id(id, title),
      thumbnail:thumbnail_id(id, url, alt_text),
      payment_count:contract_payment(count),
      product_count:contract_product(count)
    `)
    .eq('is_deleted', false);

  // Apply filters
  if (filters.status && filters.status.length > 0) {
    query = query.in('status', filters.status);
  }
  
  if (filters.signature_status && filters.signature_status.length > 0) {
    query = query.in('signature_status', filters.signature_status);
  }
  
  if (filters.company_id) {
    query = query.eq('company_id', filters.company_id);
  }
  
  if (filters.proposal_id) {
    query = query.eq('proposal_id', filters.proposal_id);
  }
  
  if (filters.author_id) {
    query = query.eq('author_id', filters.author_id);
  }

  if (filters.parent_id) {
    query = query.eq('parent_id', filters.parent_id);
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
 * Create a new contract
 */
export const createContract = async (contractData) => {
  const { data, error } = await supabase
    .from('contract')
    .insert([{
      ...contractData,
      status: contractData.status || 'draft',
      signature_status: contractData.signature_status || 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }])
    .select(`
      *,
      company:company_id(id, title),
      proposal:proposal_id(id, title),
      project:project_id(id, title),
      author:author_id(id, title),
      parent:parent_id(id, title)
    `)
    .single();

  return { data, error };
};

/**
 * Update contract
 */
export const updateContract = async (id, updates) => {
  const { data, error } = await supabase
    .from('contract')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select(`
      *,
      company:company_id(id, title),
      proposal:proposal_id(id, title),
      project:project_id(id, title),
      author:author_id(id, title),
      parent:parent_id(id, title)
    `)
    .single();

  return { data, error };
};

/**
 * Delete contract (soft delete)
 */
export const deleteContract = async (id, softDelete = true) => {
  if (softDelete) {
    const { error } = await supabase
      .from('contract')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
    return { success: !error, error };
  } else {
    const { error } = await supabase
      .from('contract')
      .delete()
      .eq('id', id);
    return { success: !error, error };
  }
};

/**
 * Get contracts by company
 */
export const fetchContractsByCompany = async (companyId) => {
  const { data, error } = await supabase
    .from('contract')
    .select(`
      id,
      title,
      status,
      signature_status,
      start_date,
      due_date,
      created_at,
      proposal:proposal_id(id, title),
      project:project_id(id, title)
    `)
    .eq('company_id', companyId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });

  return { data, error };
};

/**
 * Get contracts by proposal
 */
export const fetchContractsByProposal = async (proposalId) => {
  const { data, error } = await supabase
    .from('contract')
    .select(`
      id,
      title,
      status,
      signature_status,
      start_date,
      due_date,
      created_at,
      company:company_id(id, title)
    `)
    .eq('proposal_id', proposalId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });

  return { data, error };
};

/**
 * Get child contracts (hierarchical)
 */
export const fetchChildContracts = async (parentId) => {
  const { data, error } = await supabase
    .from('contract')
    .select(`
      id,
      title,
      status,
      signature_status,
      created_at,
      company:company_id(id, title)
    `)
    .eq('parent_id', parentId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });

  return { data, error };
};

// ========== SIGNATURE MANAGEMENT ==========

/**
 * Update signature status and metadata
 */
export const updateContractSignatureStatus = async (id, signatureData) => {
  const { data, error } = await supabase
    .from('contract')
    .update({
      ...signatureData,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select('id, signature_status, signature_sent_at, signature_signed_at')
    .single();

  return { data, error };
};

/**
 * Mark contract as sent for signature
 */
export const markContractSentForSignature = async (id, signatureData) => {
  const { data, error } = await supabase
    .from('contract')
    .update({
      signature_status: 'sent',
      signature_sent_at: new Date().toISOString(),
      signature_document_id: signatureData.document_id,
      signature_platform: signatureData.platform,
      signature_metadata: signatureData.metadata || {},
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select('*')
    .single();

  return { data, error };
};

/**
 * Mark contract as signed
 */
export const markContractSigned = async (id, signedData = {}) => {
  const { data, error } = await supabase
    .from('contract')
    .update({
      status: 'signed',
      signature_status: 'signed',
      signature_signed_at: new Date().toISOString(),
      signed_document_url: signedData.document_url,
      signature_metadata: signedData.metadata || {},
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select('*')
    .single();

  return { data, error };
};

/**
 * Mark contract signature as declined
 */
export const markContractDeclined = async (id, declineReason = null) => {
  const { data, error } = await supabase
    .from('contract')
    .update({
      signature_status: 'declined',
      signature_declined_at: new Date().toISOString(),
      signature_decline_reason: declineReason,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select('*')
    .single();

  return { data, error };
};

/**
 * Mark contract signature as expired
 */
export const markContractExpired = async (id) => {
  const { data, error } = await supabase
    .from('contract')
    .update({
      status: 'expired',
      signature_status: 'expired',
      signature_expired_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select('*')
    .single();

  return { data, error };
};

/**
 * Record signature document view
 */
export const recordContractViewed = async (id) => {
  const { data, error } = await supabase
    .from('contract')
    .update({
      signature_viewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select('id, signature_viewed_at')
    .single();

  return { data, error };
};

// ========== RELATIONSHIP MANAGEMENT ==========

/**
 * Link products to contract
 */
export const linkProductsToContract = async (contractId, productIds) => {
  if (!Array.isArray(productIds)) {
    productIds = [productIds];
  }

  // Remove existing links first
  await supabase
    .from('contract_product')
    .delete()
    .eq('contract_id', contractId);

  // Add new links
  const insertData = productIds.map(productId => ({
    contract_id: contractId,
    product_id: productId,
    created_at: new Date().toISOString()
  }));

  const { data, error } = await supabase
    .from('contract_product')
    .insert(insertData)
    .select(`
      product:product_id(id, title, price, yearly_price)
    `);

  return { 
    data: data?.map(item => item.product) || [], 
    error 
  };
};

/**
 * Link milestones to contract
 */
export const linkMilestonesToContract = async (contractId, milestoneIds) => {
  if (!Array.isArray(milestoneIds)) {
    milestoneIds = [milestoneIds];
  }

  // Remove existing links first
  await supabase
    .from('contract_milestone')
    .delete()
    .eq('contract_id', contractId);

  // Add new links
  const insertData = milestoneIds.map(milestoneId => ({
    contract_id: contractId,
    milestone_id: milestoneId,
    created_at: new Date().toISOString()
  }));

  const { data, error } = await supabase
    .from('contract_milestone')
    .insert(insertData)
    .select(`
      milestone:milestone_id(id, title, description)
    `);

  return { 
    data: data?.map(item => item.milestone) || [], 
    error 
  };
};

/**
 * Link projects to contract
 */
export const linkProjectsToContract = async (contractId, projectIds) => {
  if (!Array.isArray(projectIds)) {
    projectIds = [projectIds];
  }

  // Remove existing links first
  await supabase
    .from('contract_project')
    .delete()
    .eq('contract_id', contractId);

  // Add new links
  const insertData = projectIds.map(projectId => ({
    contract_id: contractId,
    project_id: projectId,
    created_at: new Date().toISOString()
  }));

  const { data, error } = await supabase
    .from('contract_project')
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
 * Link tags to contract
 */
export const linkTagsToContract = async (contractId, categoryIds) => {
  if (!Array.isArray(categoryIds)) {
    categoryIds = [categoryIds];
  }

  // Remove existing links first
  await supabase
    .from('category_contract')
    .delete()
    .eq('contract_id', contractId);

  // Add new links
  const insertData = categoryIds.map(categoryId => ({
    contract_id: contractId,
    category_id: categoryId,
    created_at: new Date().toISOString()
  }));

  const { data, error } = await supabase
    .from('category_contract')
    .insert(insertData)
    .select(`
      category:category_id(id, title)
    `);

  return { 
    data: data?.map(item => item.category) || [], 
    error 
  };
};

// ========== PAYMENT MANAGEMENT ==========

/**
 * Get contract payments
 */
export const fetchContractPayments = async (contractId) => {
  const { data, error } = await supabase
    .from('contract_payment')
    .select(`
      id,
      amount,
      due_date,
      status,
      payment_method,
      description,
      invoice_id,
      created_at,
      updated_at
    `)
    .eq('contract_id', contractId)
    .order('due_date', { ascending: true });

  return { data, error };
};

/**
 * Add payment to contract
 */
export const addContractPayment = async (contractId, paymentData) => {
  const { data, error } = await supabase
    .from('contract_payment')
    .insert([{
      contract_id: contractId,
      ...paymentData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }])
    .select('*')
    .single();

  return { data, error };
};

/**
 * Update contract payment
 */
export const updateContractPayment = async (paymentId, updates) => {
  const { data, error } = await supabase
    .from('contract_payment')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', paymentId)
    .select('*')
    .single();

  return { data, error };
};

/**
 * Delete contract payment
 */
export const deleteContractPayment = async (paymentId) => {
  const { error } = await supabase
    .from('contract_payment')
    .delete()
    .eq('id', paymentId);

  return { success: !error, error };
};

// ========== UTILITY FUNCTIONS ==========

/**
 * Get contract statistics
 */
export const getContractStats = async (contractId) => {
  const { data: contract, error } = await supabase
    .from('contract')
    .select(`
      id,
      status,
      signature_status,
      created_at,
      start_date,
      due_date,
      payments:contract_payment(amount, status, due_date),
      products:contract_product(product:product_id(price, yearly_price))
    `)
    .eq('id', contractId)
    .single();

  if (error) {
    return { data: null, error };
  }

  const stats = {
    totalPayments: contract.payments?.length || 0,
    paidPayments: contract.payments?.filter(p => p.status === 'paid').length || 0,
    totalAmount: contract.payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0,
    paidAmount: contract.payments?.filter(p => p.status === 'paid').reduce((sum, p) => sum + (p.amount || 0), 0) || 0,
    productValue: contract.products?.reduce((sum, p) => sum + (p.product?.price || 0), 0) || 0,
    overduePayments: 0
  };

  // Calculate overdue payments
  const today = new Date().toISOString().split('T')[0];
  stats.overduePayments = contract.payments?.filter(p => 
    p.due_date && p.due_date < today && p.status !== 'paid'
  ).length || 0;

  stats.paymentCompletionRate = stats.totalPayments > 0 ? 
    Math.round((stats.paidPayments / stats.totalPayments) * 100) : 0;

  return { data: stats, error: null };
};

/**
 * Duplicate a contract
 */
export const duplicateContract = async (contractId, options = {}) => {
  const { includePayments = false, includeProducts = true, newTitle, targetCompanyId } = options;

  // Get the original contract
  const { data: originalContract, error: fetchError } = await fetchContractById(contractId);
  
  if (fetchError) {
    return { data: null, error: fetchError };
  }

  // Prepare new contract data
  const { 
    id, 
    created_at, 
    updated_at, 
    signature_status,
    signature_sent_at,
    signature_signed_at,
    signature_declined_at,
    signature_expired_at,
    signature_viewed_at,
    signature_document_id,
    signed_document_url,
    signature_decline_reason,
    signature_metadata,
    products,
    milestones, 
    projects,
    payments,
    tags,
    ...contractData 
  } = originalContract;
  
  const newContractData = {
    ...contractData,
    title: newTitle || `${originalContract.title} (Copy)`,
    status: 'draft',
    signature_status: 'draft',
    company_id: targetCompanyId || originalContract.company_id,
    signature_document_id: null,
    signed_document_url: null,
    signature_decline_reason: null,
    signature_metadata: null
  };

  // Create new contract
  const { data: newContract, error: createError } = await createContract(newContractData);
  
  if (createError) {
    return { data: null, error: createError };
  }

  // Copy relationships
  if (products && products.length > 0 && includeProducts) {
    await linkProductsToContract(newContract.id, products.map(p => p.id));
  }

  if (milestones && milestones.length > 0) {
    await linkMilestonesToContract(newContract.id, milestones.map(m => m.id));
  }

  if (projects && projects.length > 0) {
    await linkProjectsToContract(newContract.id, projects.map(p => p.id));
  }

  if (tags && tags.length > 0) {
    await linkTagsToContract(newContract.id, tags.map(t => t.id));
  }

  // Copy payments if requested
  if (includePayments && payments && payments.length > 0) {
    const paymentCreationPromises = payments.map(payment => 
      addContractPayment(newContract.id, {
        amount: payment.amount,
        due_date: payment.due_date,
        status: 'pending', // Reset status for duplicated payments
        payment_method: payment.payment_method,
        description: payment.description
      })
    );

    await Promise.all(paymentCreationPromises);
  }

  return { data: newContract, error: null };
};

/**
 * Get contracts requiring attention (overdue, pending signatures, etc.)
 */
export const fetchContractsRequiringAttention = async () => {
  const today = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('contract')
    .select(`
      id,
      title,
      status,
      signature_status,
      start_date,
      due_date,
      signature_sent_at,
      company:company_id(id, title),
      overdue_payments:contract_payment!inner(count)
    `)
    .eq('is_deleted', false)
    .or(`
      signature_status.eq.sent,
      due_date.lt.${today},
      contract_payment.due_date.lt.${today}
    `)
    .neq('contract_payment.status', 'paid')
    .order('created_at', { ascending: false });

  return { data, error };
};