import { createClient } from '@/lib/supabase/browser';

/**
 * Generates payment records from a proposal and billing mode
 * 
 * @param {number} proposalId - The proposal ID
 * @param {string} billingMode - 'monthly', 'yearly', or 'one-time'
 * @param {number} contractId - The contract ID to link payments to
 * @param {string} paymentUrl - Optional Stripe URL for first payment
 * @returns {Promise<Object>} - { success: boolean, payments: Array, error?: string }
 */
export const generatePaymentsFromProposal = async (proposalId, billingMode, contractId, paymentUrl = null) => {
  const supabase = createClient();
  
  try {
    console.log('[generatePayments] Starting payment generation:', { proposalId, billingMode, contractId });
    
    // Get proposal with selected products
    const { data: proposalData, error: proposalError } = await supabase
      .from('proposal')
      .select(`
        id,
        tier,
        company_id,
        product_proposal!inner(
          id,
          product_id,
          tier,
          type,
          custom_price,
          "order",
          product(
            id,
            title,
            price,
            yearly_price,
            payment_split_count
          )
        )
      `)
      .eq('id', proposalId)
      .single();

    if (proposalError || !proposalData) {
      throw new Error(`Failed to fetch proposal: ${proposalError?.message || 'Proposal not found'}`);
    }

    const productProposals = proposalData.product_proposal || [];
    
    if (productProposals.length === 0) {
      throw new Error('No products found for this proposal');
    }

    console.log('[generatePayments] Found products:', productProposals.length);

    // Calculate payments for each product
    const allPayments = [];
    let paymentOrder = 1;

    for (const productProposal of productProposals) {
      const { product, custom_price, type } = productProposal;
      
      if (!product) {
        console.warn('[generatePayments] Skipping product proposal without product data');
        continue;
      }

      // Determine the price based on billing mode and custom pricing
      let amount;
      let frequency;
      let isRecurring;

      if (custom_price && custom_price > 0) {
        // Use custom price - assume it matches the billing mode
        amount = custom_price;
        frequency = billingMode === 'one-time' ? null : billingMode;
        isRecurring = frequency !== null;
      } else {
        // Use product's standard pricing
        if (billingMode === 'yearly' && product.yearly_price) {
          amount = product.yearly_price;
          frequency = 'yearly';
          isRecurring = true;
        } else if (billingMode === 'monthly' && product.price) {
          amount = product.price;
          frequency = 'monthly';
          isRecurring = true;
        } else if (billingMode === 'one-time') {
          // For one-time, use monthly price as base
          amount = product.price || 0;
          frequency = null;
          isRecurring = false;
        } else {
          console.warn(`[generatePayments] No price found for ${product.title} with billing mode ${billingMode}`);
          continue;
        }
      }

      // Handle payment splitting for one-time payments
      if (!isRecurring && product.payment_split_count && product.payment_split_count > 1) {
        const splitAmount = amount / product.payment_split_count;
        const baseDate = new Date();
        
        // Create multiple payment records for splits
        for (let i = 0; i < product.payment_split_count; i++) {
          const dueDate = new Date(baseDate);
          dueDate.setMonth(dueDate.getMonth() + i); // Space payments monthly
          
          allPayments.push({
            contract_id: contractId,
            amount: splitAmount,
            frequency: null,
            is_recurring: false,
            due_date: dueDate.toISOString(),
            payment_url: (paymentOrder === 1 && i === 0) ? paymentUrl : null, // Only first payment gets URL
            title: `${product.title} - Payment ${i + 1} of ${product.payment_split_count}`,
            order_index: paymentOrder++,
            created_at: new Date().toISOString()
          });
        }
      } else {
        // Single payment record
        const dueDate = new Date();
        if (frequency === 'yearly') {
          dueDate.setFullYear(dueDate.getFullYear() + 1);
        } else if (frequency === 'monthly') {
          dueDate.setMonth(dueDate.getMonth() + 1);
        }
        // For one-time, due date is immediate (now)

        allPayments.push({
          contract_id: contractId,
          amount: amount,
          frequency: frequency,
          is_recurring: isRecurring,
          due_date: dueDate.toISOString(),
          payment_url: paymentOrder === 1 ? paymentUrl : null, // Only first payment gets URL
          title: `${product.title}${frequency ? ` (${frequency})` : ''}`,
          order_index: paymentOrder++,
          created_at: new Date().toISOString()
        });
      }
    }

    if (allPayments.length === 0) {
      throw new Error('No valid payments could be generated');
    }

    console.log('[generatePayments] Generated payments:', allPayments.length);

    // Insert payments into database
    const { data: insertedPayments, error: insertError } = await supabase
      .from('payment')
      .insert(allPayments)
      .select();

    if (insertError) {
      throw new Error(`Failed to insert payments: ${insertError.message}`);
    }

    console.log('[generatePayments] Successfully created payments:', insertedPayments.length);

    // Calculate totals for return data
    const totalAmount = allPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const recurringTotal = allPayments
      .filter(p => p.is_recurring)
      .reduce((sum, payment) => sum + payment.amount, 0);
    const oneTimeTotal = allPayments
      .filter(p => !p.is_recurring)
      .reduce((sum, payment) => sum + payment.amount, 0);

    return {
      success: true,
      payments: insertedPayments,
      summary: {
        totalAmount,
        recurringTotal,
        oneTimeTotal,
        paymentCount: insertedPayments.length,
        billingMode
      }
    };

  } catch (error) {
    console.error('[generatePayments] Error:', error);
    return {
      success: false,
      error: error.message,
      payments: []
    };
  }
};

/**
 * Updates payment URL for the first payment of a contract
 * Used after Stripe checkout session is created
 * 
 * @param {number} contractId - Contract ID
 * @param {string} paymentUrl - Stripe checkout or invoice URL
 * @returns {Promise<boolean>} - Success status
 */
export const updateFirstPaymentUrl = async (contractId, paymentUrl) => {
  const supabase = createClient();
  
  try {
    // Get the first payment for this contract (lowest order_index)
    const { data: firstPayment, error: fetchError } = await supabase
      .from('payment')
      .select('id')
      .eq('contract_id', contractId)
      .order('order_index', { ascending: true })
      .limit(1)
      .single();

    if (fetchError || !firstPayment) {
      console.error('[updateFirstPaymentUrl] No payment found for contract:', contractId);
      return false;
    }

    // Update the payment URL
    const { error: updateError } = await supabase
      .from('payment')
      .update({ payment_url: paymentUrl })
      .eq('id', firstPayment.id);

    if (updateError) {
      console.error('[updateFirstPaymentUrl] Update failed:', updateError);
      return false;
    }

    console.log('[updateFirstPaymentUrl] Successfully updated payment URL');
    return true;

  } catch (error) {
    console.error('[updateFirstPaymentUrl] Error:', error);
    return false;
  }
};

/**
 * Calculates pricing totals for a proposal without creating payments
 * Useful for proposal preview and pricing estimates
 * 
 * @param {number} proposalId - The proposal ID
 * @param {string} billingMode - 'monthly', 'yearly', or 'one-time'
 * @returns {Promise<Object>} - Pricing breakdown
 */
export const calculateProposalPricing = async (proposalId, billingMode) => {
  const supabase = createClient();
  
  try {
    // Get proposal with products (same query as payment generation)
    const { data: proposalData, error } = await supabase
      .from('proposal')
      .select(`
        id,
        tier,
        product_proposal!inner(
          custom_price,
          product(
            title,
            price,
            yearly_price,
            payment_split_count
          )
        )
      `)
      .eq('id', proposalId)
      .single();

    if (error || !proposalData) {
      throw new Error('Failed to fetch proposal for pricing calculation');
    }

    const productProposals = proposalData.product_proposal || [];
    let totalAmount = 0;
    const breakdown = [];

    for (const productProposal of productProposals) {
      const { product, custom_price } = productProposal;
      
      if (!product) continue;

      let amount;
      if (custom_price && custom_price > 0) {
        amount = custom_price;
      } else if (billingMode === 'yearly' && product.yearly_price) {
        amount = product.yearly_price;
      } else {
        amount = product.price || 0;
      }

      totalAmount += amount;
      breakdown.push({
        product: product.title,
        amount,
        billingMode,
        isCustomPrice: !!(custom_price && custom_price > 0)
      });
    }

    return {
      success: true,
      totalAmount,
      breakdown,
      billingMode,
      proposalId
    };

  } catch (error) {
    console.error('[calculateProposalPricing] Error:', error);
    return {
      success: false,
      error: error.message,
      totalAmount: 0,
      breakdown: []
    };
  }
};