import { createClient } from '@/lib/supabase/browser';
const supabase = createClient();

/**
 * Get a single payment by ID with all related data
 */
export const fetchPaymentById = async (id) => {
  const { data, error } = await supabase
    .from('payment')
    .select(`
      *,
      contract:contract_id(id, title, status),
      company:company_id(id, title),
      project:project_id(id, title, status),
      author:author_id(id, title, email),
      parent:parent_id(id, title, amount, status),
      thumbnail:thumbnail_id(id, url, alt_text),
      tags:category_payment(
        category:category_id(id, title)
      ),
      child_payments:payment!parent_id(id, title, amount, status, due_date, order_index)
    `)
    .eq('id', id)
    .single();

  // Transform tags data
  if (data && data.tags) {
    data.tags = data.tags.map(t => t.category);
  }

  // Sort child payments by order_index
  if (data && data.child_payments) {
    data.child_payments.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
  }

  return { data, error };
};

/**
 * Get all payments with optional filters
 */
export const fetchAllPayments = async (filters = {}) => {
  let query = supabase
    .from('payment')
    .select(`
      id,
      title,
      amount,
      status,
      frequency,
      is_recurring,
      due_date,
      alt_due_date,
      paid_at,
      payment_url,
      order_index,
      created_at,
      updated_at,
      contract:contract_id(id, title, status),
      company:company_id(id, title),
      project:project_id(id, title),
      author:author_id(id, title),
      parent:parent_id(id, title),
      thumbnail:thumbnail_id(id, url, alt_text),
      child_count:payment!parent_id(count)
    `)
    .eq('is_deleted', false);

  // Apply filters
  if (filters.search) {
    query = query.or(`title.ilike.%${filters.search}%,alt_due_date.ilike.%${filters.search}%`);
  }

  if (filters.status && filters.status.length > 0) {
    query = query.in('status', filters.status);
  }
  
  if (filters.frequency) {
    if (filters.frequency === null) {
      query = query.is('frequency', null);
    } else {
      query = query.eq('frequency', filters.frequency);
    }
  }
  
  if (filters.is_recurring !== undefined) {
    query = query.eq('is_recurring', filters.is_recurring);
  }
  
  if (filters.contract_id) {
    query = query.eq('contract_id', filters.contract_id);
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

  // Date range filtering
  if (filters.due_start) {
    query = query.gte('due_date', filters.due_start);
  }
  if (filters.due_end) {
    query = query.lte('due_date', filters.due_end);
  }

  // Apply sorting
  if (filters.sort) {
    const [field, direction] = filters.sort.split(':');
    query = query.order(field, { ascending: direction === 'asc' });
  } else {
    // Default sorting: by due_date
    query = query.order('due_date', { ascending: true, nullsFirst: false });
    query = query.order('order_index', { ascending: true, nullsFirst: false });
  }

  const { data, error } = await query;
  return { data, error };
};

/**
 * Create a new payment
 */
export const createPayment = async (paymentData) => {
  // Get current max order_index for the contract/parent combination
  let orderQuery = supabase
    .from('payment')
    .select('order_index');

  if (paymentData.contract_id) {
    orderQuery = orderQuery.eq('contract_id', paymentData.contract_id);
  } else if (paymentData.parent_id) {
    orderQuery = orderQuery.eq('parent_id', paymentData.parent_id);
  }

  const { data: existingPayments } = await orderQuery
    .order('order_index', { ascending: false })
    .limit(1);
    
  const nextOrderIndex = (existingPayments?.[0]?.order_index || 0) + 1;

  // Auto-calculate is_recurring from frequency
  const isRecurring = paymentData.frequency && paymentData.frequency !== null;

  const { data, error } = await supabase
    .from('payment')
    .insert([{
      ...paymentData,
      status: paymentData.status || 'pending',
      is_recurring: paymentData.is_recurring ?? isRecurring,
      order_index: paymentData.order_index ?? nextOrderIndex,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }])
    .select(`
      *,
      contract:contract_id(id, title),
      company:company_id(id, title),
      project:project_id(id, title),
      author:author_id(id, title),
      parent:parent_id(id, title)
    `)
    .single();

  return { data, error };
};

/**
 * Update payment
 */
export const updatePayment = async (id, updates) => {
  // Auto-update is_recurring if frequency is changed
  if (updates.frequency !== undefined && updates.is_recurring === undefined) {
    updates.is_recurring = updates.frequency && updates.frequency !== null;
  }

  // Auto-set paid_at when status changes to paid
  if (updates.status === 'paid' && !updates.paid_at) {
    updates.paid_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('payment')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select(`
      *,
      contract:contract_id(id, title),
      company:company_id(id, title),
      project:project_id(id, title),
      author:author_id(id, title),
      parent:parent_id(id, title)
    `)
    .single();

  return { data, error };
};

/**
 * Delete payment (soft delete)
 */
export const deletePayment = async (id, softDelete = true) => {
  if (softDelete) {
    const { error } = await supabase
      .from('payment')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
    return { success: !error, error };
  } else {
    const { error } = await supabase
      .from('payment')
      .delete()
      .eq('id', id);
    return { success: !error, error };
  }
};

// ========== CONTRACT RELATIONS ==========

/**
 * Get payments by contract
 */
export const fetchPaymentsByContract = async (contractId) => {
  const { data, error } = await supabase
    .from('payment')
    .select(`
      id,
      title,
      amount,
      status,
      frequency,
      is_recurring,
      due_date,
      alt_due_date,
      paid_at,
      order_index,
      created_at,
      company:company_id(id, title),
      project:project_id(id, title)
    `)
    .eq('contract_id', contractId)
    .eq('is_deleted', false)
    .order('order_index', { ascending: true, nullsFirst: false })
    .order('due_date', { ascending: true, nullsFirst: false });

  return { data, error };
};

/**
 * Get payments by company
 */
export const fetchPaymentsByCompany = async (companyId) => {
  const { data, error } = await supabase
    .from('payment')
    .select(`
      id,
      title,
      amount,
      status,
      frequency,
      due_date,
      paid_at,
      order_index,
      created_at,
      contract:contract_id(id, title),
      project:project_id(id, title)
    `)
    .eq('company_id', companyId)
    .eq('is_deleted', false)
    .order('due_date', { ascending: true, nullsFirst: false });

  return { data, error };
};

/**
 * Get payments by project
 */
export const fetchPaymentsByProject = async (projectId) => {
  const { data, error } = await supabase
    .from('payment')
    .select(`
      id,
      title,
      amount,
      status,
      frequency,
      due_date,
      paid_at,
      order_index,
      created_at,
      contract:contract_id(id, title),
      company:company_id(id, title)
    `)
    .eq('project_id', projectId)
    .eq('is_deleted', false)
    .order('due_date', { ascending: true, nullsFirst: false });

  return { data, error };
};

// ========== HIERARCHICAL MANAGEMENT ==========

/**
 * Get payments by parent (hierarchical)
 */
export const fetchPaymentsByParent = async (parentId) => {
  const condition = parentId ? { parent_id: parentId } : { parent_id: null };

  const { data, error } = await supabase
    .from('payment')
    .select(`
      id,
      title,
      amount,
      status,
      frequency,
      due_date,
      paid_at,
      order_index,
      created_at,
      updated_at,
      contract:contract_id(id, title),
      company:company_id(id, title),
      child_count:payment!parent_id(count)
    `)
    .match(condition)
    .eq('is_deleted', false)
    .order('order_index', { ascending: true, nullsFirst: false })
    .order('due_date', { ascending: true, nullsFirst: false });

  return { data, error };
};

/**
 * Get root-level payments (no parent)
 */
export const fetchRootPayments = async (contractId = null) => {
  let query = supabase
    .from('payment')
    .select(`
      id,
      title,
      amount,
      status,
      frequency,
      due_date,
      paid_at,
      order_index,
      created_at,
      contract:contract_id(id, title),
      company:company_id(id, title),
      child_count:payment!parent_id(count)
    `)
    .is('parent_id', null)
    .eq('is_deleted', false);

  if (contractId) {
    query = query.eq('contract_id', contractId);
  }

  query = query.order('order_index', { ascending: true, nullsFirst: false })
    .order('due_date', { ascending: true, nullsFirst: false });

  const { data, error } = await query;
  return { data, error };
};

/**
 * Get child payments
 */
export const fetchChildPayments = async (parentId) => {
  return await fetchPaymentsByParent(parentId);
};

// ========== STATUS MANAGEMENT ==========

/**
 * Update payment status
 */
export const updatePaymentStatus = async (id, newStatus) => {
  const updateData = {
    status: newStatus,
    updated_at: new Date().toISOString()
  };

  // Auto-set paid_at when marking as paid
  if (newStatus === 'paid') {
    updateData.paid_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('payment')
    .update(updateData)
    .eq('id', id)
    .select('id, status, paid_at')
    .single();

  return { data, error };
};

/**
 * Mark payment as paid
 */
export const markPaymentPaid = async (id, paidAt = null) => {
  const { data, error } = await supabase
    .from('payment')
    .update({
      status: 'paid',
      paid_at: paidAt || new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select('id, status, paid_at')
    .single();

  return { data, error };
};

/**
 * Get payments by status
 */
export const fetchPaymentsByStatus = async (status, contractId = null) => {
  let query = supabase
    .from('payment')
    .select(`
      id,
      title,
      amount,
      frequency,
      due_date,
      paid_at,
      order_index,
      created_at,
      contract:contract_id(id, title),
      company:company_id(id, title)
    `)
    .eq('status', status)
    .eq('is_deleted', false);

  if (contractId) {
    query = query.eq('contract_id', contractId);
  }

  query = query.order('due_date', { ascending: true, nullsFirst: false });

  const { data, error } = await query;
  return { data, error };
};

// ========== RECURRING PAYMENTS ==========

/**
 * Get recurring payments
 */
export const fetchRecurringPayments = async (contractId = null) => {
  let query = supabase
    .from('payment')
    .select(`
      id,
      title,
      amount,
      frequency,
      status,
      due_date,
      stripe_subscription_id,
      order_index,
      created_at,
      contract:contract_id(id, title),
      company:company_id(id, title)
    `)
    .eq('is_recurring', true)
    .eq('is_deleted', false);

  if (contractId) {
    query = query.eq('contract_id', contractId);
  }

  query = query.order('order_index', { ascending: true, nullsFirst: false });

  const { data, error } = await query;
  return { data, error };
};

/**
 * Get one-time payments
 */
export const fetchOneTimePayments = async (contractId = null) => {
  let query = supabase
    .from('payment')
    .select(`
      id,
      title,
      amount,
      status,
      due_date,
      alt_due_date,
      paid_at,
      order_index,
      created_at,
      contract:contract_id(id, title),
      company:company_id(id, title)
    `)
    .eq('is_recurring', false)
    .eq('is_deleted', false);

  if (contractId) {
    query = query.eq('contract_id', contractId);
  }

  query = query.order('due_date', { ascending: true, nullsFirst: false });

  const { data, error } = await query;
  return { data, error };
};

// ========== STRIPE INTEGRATION ==========

/**
 * Update Stripe invoice information
 */
export const updatePaymentStripeInvoice = async (id, stripeInvoiceId, paymentUrl = null) => {
  const updateData = {
    stripe_invoice_id: stripeInvoiceId,
    updated_at: new Date().toISOString()
  };

  if (paymentUrl) {
    updateData.payment_url = paymentUrl;
  }

  const { data, error } = await supabase
    .from('payment')
    .update(updateData)
    .eq('id', id)
    .select('id, stripe_invoice_id, payment_url')
    .single();

  return { data, error };
};

/**
 * Update Stripe subscription information
 */
export const updatePaymentStripeSubscription = async (id, stripeSubscriptionId) => {
  const { data, error } = await supabase
    .from('payment')
    .update({
      stripe_subscription_id: stripeSubscriptionId,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select('id, stripe_subscription_id')
    .single();

  return { data, error };
};

/**
 * Get payments by Stripe subscription
 */
export const fetchPaymentsByStripeSubscription = async (subscriptionId) => {
  const { data, error } = await supabase
    .from('payment')
    .select(`
      id,
      title,
      amount,
      status,
      frequency,
      due_date,
      paid_at,
      contract:contract_id(id, title),
      company:company_id(id, title)
    `)
    .eq('stripe_subscription_id', subscriptionId)
    .eq('is_deleted', false)
    .order('due_date', { ascending: true });

  return { data, error };
};

// ========== CALENDAR VIEW FUNCTIONS ==========

/**
 * Get payments for calendar view within date range
 */
export const fetchPaymentsForCalendar = async (startDate, endDate, filters = {}) => {
  let query = supabase
    .from('payment')
    .select(`
      id,
      title,
      amount,
      status,
      frequency,
      due_date,
      alt_due_date,
      contract:contract_id(id, title),
      company:company_id(id, title)
    `)
    .eq('is_deleted', false)
    .gte('due_date', startDate)
    .lte('due_date', endDate);

  // Apply additional filters
  if (filters.status && filters.status.length > 0) {
    query = query.in('status', filters.status);
  }
  
  if (filters.contract_id) {
    query = query.eq('contract_id', filters.contract_id);
  }
  
  if (filters.company_id) {
    query = query.eq('company_id', filters.company_id);
  }

  query = query.order('due_date', { ascending: true });

  const { data, error } = await query;
  return { data, error };
};

/**
 * Get overdue payments
 */
export const fetchOverduePayments = async (contractId = null, companyId = null) => {
  const today = new Date().toISOString().split('T')[0];

  let query = supabase
    .from('payment')
    .select(`
      id,
      title,
      amount,
      status,
      due_date,
      alt_due_date,
      order_index,
      created_at,
      contract:contract_id(id, title),
      company:company_id(id, title)
    `)
    .lt('due_date', today)
    .neq('status', 'paid')
    .neq('status', 'cancelled')
    .neq('status', 'refunded')
    .eq('is_deleted', false);

  if (contractId) {
    query = query.eq('contract_id', contractId);
  }

  if (companyId) {
    query = query.eq('company_id', companyId);
  }

  query = query.order('due_date', { ascending: true });

  const { data, error } = await query;
  return { data, error };
};

/**
 * Get upcoming payments
 */
export const fetchUpcomingPayments = async (days = 30, contractId = null, companyId = null) => {
  const today = new Date().toISOString().split('T')[0];
  const futureDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  let query = supabase
    .from('payment')
    .select(`
      id,
      title,
      amount,
      status,
      frequency,
      due_date,
      alt_due_date,
      order_index,
      created_at,
      contract:contract_id(id, title),
      company:company_id(id, title)
    `)
    .gte('due_date', today)
    .lte('due_date', futureDate)
    .in('status', ['pending', 'sent'])
    .eq('is_deleted', false);

  if (contractId) {
    query = query.eq('contract_id', contractId);
  }

  if (companyId) {
    query = query.eq('company_id', companyId);
  }

  query = query.order('due_date', { ascending: true });

  const { data, error } = await query;
  return { data, error };
};

// ========== TAG MANAGEMENT ==========

/**
 * Link tags to payment
 */
export const linkTagsToPayment = async (paymentId, categoryIds) => {
  if (!Array.isArray(categoryIds)) {
    categoryIds = [categoryIds];
  }

  // Remove existing links first
  await supabase
    .from('category_payment')
    .delete()
    .eq('payment_id', paymentId);

  // Add new links
  const insertData = categoryIds.map(categoryId => ({
    payment_id: paymentId,
    category_id: categoryId,
    created_at: new Date().toISOString()
  }));

  const { data, error } = await supabase
    .from('category_payment')
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
 * Get payment tags
 */
export const fetchPaymentTags = async (paymentId) => {
  const { data, error } = await supabase
    .from('category_payment')
    .select(`
      category:category_id(id, title)
    `)
    .eq('payment_id', paymentId);

  return { 
    data: data?.map(item => item.category) || [], 
    error 
  };
};

// ========== REORDERING ==========

/**
 * Reorder payments within same contract
 */
export const reorderPayments = async (contractId, paymentOrders) => {
  const updates = paymentOrders.map(({ id, order_index }) => 
    supabase
      .from('payment')
      .update({ 
        order_index,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('contract_id', contractId)
  );
  
  const results = await Promise.all(updates);
  const errors = results.filter(result => result.error);
  
  return { 
    success: errors.length === 0,
    errors: errors.map(result => result.error)
  };
};

/**
 * Move payment to different contract/parent
 */
export const movePayment = async (paymentId, newContractId = null, newParentId = null, newOrderIndex = null) => {
  // Get next order_index if not provided
  if (newOrderIndex === null) {
    let orderQuery = supabase
      .from('payment')
      .select('order_index');

    if (newContractId) {
      orderQuery = orderQuery.eq('contract_id', newContractId);
    } else if (newParentId) {
      orderQuery = orderQuery.eq('parent_id', newParentId);
    }

    const { data: existingPayments } = await orderQuery
      .order('order_index', { ascending: false })
      .limit(1);
      
    newOrderIndex = (existingPayments?.[0]?.order_index || 0) + 1;
  }

  const updateData = {
    order_index: newOrderIndex,
    updated_at: new Date().toISOString()
  };

  if (newContractId !== undefined) {
    updateData.contract_id = newContractId;
  }

  if (newParentId !== undefined) {
    updateData.parent_id = newParentId;
  }

  const { data, error } = await supabase
    .from('payment')
    .update(updateData)
    .eq('id', paymentId)
    .select('*')
    .single();

  return { data, error };
};

// ========== UTILITY FUNCTIONS ==========

/**
 * Duplicate a payment
 */
export const duplicatePayment = async (paymentId, options = {}) => {
  const { 
    newTitle, 
    targetContractId, 
    targetParentId, 
    newDueDate,
    includeTags = true 
  } = options;

  // Get the original payment
  const { data: originalPayment, error: fetchError } = await fetchPaymentById(paymentId);
  
  if (fetchError) {
    return { data: null, error: fetchError };
  }

  // Prepare new payment data
  const { 
    id, 
    created_at, 
    updated_at, 
    paid_at,
    stripe_invoice_id,
    stripe_subscription_id,
    tags, 
    child_payments, 
    ...paymentData 
  } = originalPayment;
  
  const newPaymentData = {
    ...paymentData,
    title: newTitle || `${originalPayment.title} (Copy)`,
    status: 'pending', // Reset status for copy
    due_date: newDueDate || originalPayment.due_date,
    contract_id: targetContractId !== undefined ? targetContractId : originalPayment.contract_id,
    parent_id: targetParentId !== undefined ? targetParentId : originalPayment.parent_id,
    // Reset Stripe fields for copy
    stripe_invoice_id: null,
    stripe_subscription_id: null,
    paid_at: null
  };

  // Create new payment
  const { data: newPayment, error: createError } = await createPayment(newPaymentData);
  
  if (createError) {
    return { data: null, error: createError };
  }

  // Copy tags if requested
  if (includeTags && tags && tags.length > 0) {
    await linkTagsToPayment(newPayment.id, tags.map(t => t.id));
  }

  return { data: newPayment, error: null };
};

/**
 * Get payment statistics
 */
export const getPaymentStats = async (contractId = null, companyId = null) => {
  let query = supabase
    .from('payment')
    .select('id, status, amount, frequency, due_date')
    .eq('is_deleted', false);

  if (contractId) {
    query = query.eq('contract_id', contractId);
  }

  if (companyId) {
    query = query.eq('company_id', companyId);
  }

  const { data, error } = await query;

  if (error) {
    return { data: null, error };
  }

  const today = new Date().toISOString().split('T')[0];

  const stats = {
    total: data.length,
    totalAmount: data.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0),
    byStatus: {
      pending: data.filter(p => p.status === 'pending').length,
      sent: data.filter(p => p.status === 'sent').length,
      paid: data.filter(p => p.status === 'paid').length,
      overdue: data.filter(p => p.status === 'overdue').length,
      cancelled: data.filter(p => p.status === 'cancelled').length,
      refunded: data.filter(p => p.status === 'refunded').length
    },
    paidAmount: data.filter(p => p.status === 'paid').reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0),
    pendingAmount: data.filter(p => ['pending', 'sent'].includes(p.status)).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0),
    recurring: data.filter(p => p.frequency && p.frequency !== null).length,
    oneTime: data.filter(p => !p.frequency || p.frequency === null).length,
    overdue: data.filter(p => 
      p.due_date && 
      p.due_date < today && 
      !['paid', 'cancelled', 'refunded'].includes(p.status)
    ).length
  };

  stats.collectionRate = stats.totalAmount > 0 ? 
    Math.round((stats.paidAmount / stats.totalAmount) * 100) : 0;

  return { data: stats, error: null };
};