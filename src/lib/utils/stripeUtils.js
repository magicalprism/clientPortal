import { createClient } from '@/lib/supabase/browser';
import { updateFirstPaymentUrl } from '@/lib/utils/generatePaymentsFromProposal';

/**
 * Stripe integration utilities for payment processing
 * This module handles creating Stripe checkout sessions and managing recurring subscriptions
 */

/**
 * Create Stripe checkout session for contract payments
 * 
 * @param {number} contractId - Contract ID
 * @param {Object} options - Checkout options
 * @returns {Promise<Object>} - Checkout session result
 */
export const createStripeCheckoutForContract = async (contractId, options = {}) => {
  try {
    console.log('[Stripe] Creating checkout session for contract:', contractId);

    // Get contract with payments and company info
    const supabase = createClient();
    const { data: contract, error: contractError } = await supabase
      .from('contract')
      .select(`
        *,
        company:company_id(
          id,
          title
        ),
        payments:payment(
          id,
          title,
          amount,
          frequency,
          is_recurring,
          due_date,
          order_index
        )
      `)
      .eq('id', contractId)
      .single();

    if (contractError || !contract) {
      throw new Error('Contract not found');
    }

    if (!contract.payments || contract.payments.length === 0) {
      throw new Error('No payments found for this contract');
    }

    // Separate recurring and one-time payments
    const recurringPayments = contract.payments.filter(p => p.is_recurring);
    const oneTimePayments = contract.payments.filter(p => !p.is_recurring);

    console.log('[Stripe] Payment breakdown:', {
      recurringCount: recurringPayments.length,
      oneTimeCount: oneTimePayments.length
    });

    // Prepare checkout session data
    const checkoutData = {
      contractId,
      companyName: contract.company?.title || 'Client',
      contractTitle: contract.title,
      recurringPayments: recurringPayments.map(p => ({
        id: p.id,
        title: p.title,
        amount: p.amount,
        frequency: p.frequency
      })),
      oneTimePayments: oneTimePayments.map(p => ({
        id: p.id,
        title: p.title,
        amount: p.amount
      })),
      successUrl: options.successUrl || `${window.location.origin}/dashboard/contract/${contractId}?status=success`,
      cancelUrl: options.cancelUrl || `${window.location.origin}/dashboard/contract/${contractId}?status=cancelled`,
      customerEmail: options.customerEmail,
      metadata: {
        contractId: contractId.toString(),
        companyId: contract.company_id?.toString(),
        source: 'contract_payment'
      }
    };

    // Call Stripe API
    const response = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(checkoutData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create Stripe checkout session');
    }

    const result = await response.json();

    // Update the first payment with the checkout URL
    if (result.success && result.checkoutUrl) {
      await updateFirstPaymentUrl(contractId, result.checkoutUrl);
    }

    console.log('[Stripe] Checkout session created successfully');
    return result;

  } catch (error) {
    console.error('[Stripe] Checkout creation failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Create Stripe invoice for a specific payment
 * 
 * @param {number} paymentId - Payment ID
 * @param {Object} options - Invoice options
 * @returns {Promise<Object>} - Invoice creation result
 */
export const createStripeInvoiceForPayment = async (paymentId, options = {}) => {
  try {
    console.log('[Stripe] Creating invoice for payment:', paymentId);

    const supabase = createClient();
    const { data: payment, error } = await supabase
      .from('payment')
      .select(`
        *,
        contract:contract_id(
          id,
          title,
          company:company_id(
            id,
            title
          )
        )
      `)
      .eq('id', paymentId)
      .single();

    if (error || !payment) {
      throw new Error('Payment not found');
    }

    const invoiceData = {
      paymentId,
      contractId: payment.contract_id,
      amount: payment.amount,
      title: payment.title,
      dueDate: payment.due_date,
      companyName: payment.contract?.company?.title || 'Client',
      contractTitle: payment.contract?.title || 'Service Contract',
      customerEmail: options.customerEmail,
      autoSend: options.autoSend !== false, // Default to true
      metadata: {
        paymentId: paymentId.toString(),
        contractId: payment.contract_id?.toString(),
        source: 'payment_invoice'
      }
    };

    const response = await fetch('/api/stripe/invoice', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invoiceData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create Stripe invoice');
    }

    const result = await response.json();

    // Update payment with Stripe invoice ID and URL
    if (result.success && result.invoiceId) {
      await supabase
        .from('payment')
        .update({
          stripe_invoice_id: result.invoiceId,
          payment_url: result.invoiceUrl,
          status: 'sent',
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentId);
    }

    console.log('[Stripe] Invoice created successfully');
    return result;

  } catch (error) {
    console.error('[Stripe] Invoice creation failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Create Stripe subscription for recurring payments
 * 
 * @param {Array} recurringPayments - Array of recurring payment objects
 * @param {Object} customerInfo - Customer information
 * @param {Object} options - Subscription options
 * @returns {Promise<Object>} - Subscription creation result
 */
export const createStripeSubscription = async (recurringPayments, customerInfo, options = {}) => {
  try {
    console.log('[Stripe] Creating subscription for recurring payments:', recurringPayments.length);

    if (!recurringPayments || recurringPayments.length === 0) {
      throw new Error('No recurring payments provided');
    }

    const subscriptionData = {
      recurringPayments: recurringPayments.map(p => ({
        id: p.id,
        title: p.title,
        amount: p.amount,
        frequency: p.frequency,
        contractId: p.contract_id
      })),
      customer: {
        email: customerInfo.email,
        name: customerInfo.name || customerInfo.company_name,
        metadata: customerInfo.metadata || {}
      },
      trialDays: options.trialDays || 0,
      startDate: options.startDate,
      metadata: {
        source: 'contract_subscription',
        ...options.metadata
      }
    };

    const response = await fetch('/api/stripe/subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscriptionData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create Stripe subscription');
    }

    const result = await response.json();

    // Update payments with subscription information
    if (result.success && result.subscriptionId) {
      const supabase = createClient();
      const paymentIds = recurringPayments.map(p => p.id);
      
      await supabase
        .from('payment')
        .update({
          stripe_subscription_id: result.subscriptionId,
          status: 'sent',
          updated_at: new Date().toISOString()
        })
        .in('id', paymentIds);
    }

    console.log('[Stripe] Subscription created successfully');
    return result;

  } catch (error) {
    console.error('[Stripe] Subscription creation failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Handle Stripe webhook events
 * 
 * @param {Object} event - Stripe webhook event
 * @returns {Promise<Object>} - Webhook handling result
 */
export const handleStripeWebhook = async (event) => {
  try {
    console.log('[Stripe] Processing webhook event:', event.type);

    const supabase = createClient();

    switch (event.type) {
      case 'invoice.payment_succeeded':
        return await handleInvoicePaymentSucceeded(supabase, event.data.object);
      
      case 'invoice.payment_failed':
        return await handleInvoicePaymentFailed(supabase, event.data.object);
      
      case 'subscription.created':
        return await handleSubscriptionCreated(supabase, event.data.object);
      
      case 'subscription.updated':
        return await handleSubscriptionUpdated(supabase, event.data.object);
      
      case 'subscription.deleted':
        return await handleSubscriptionDeleted(supabase, event.data.object);
      
      case 'customer.subscription.trial_will_end':
        return await handleTrialWillEnd(supabase, event.data.object);
      
      default:
        console.log('[Stripe] Unhandled webhook event type:', event.type);
        return { success: true, message: 'Event acknowledged' };
    }

  } catch (error) {
    console.error('[Stripe] Webhook handling failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Private helper functions for webhook handling

async function handleInvoicePaymentSucceeded(supabase, invoice) {
  const paymentId = invoice.metadata?.paymentId;
  
  if (paymentId) {
    await supabase
      .from('payment')
      .update({
        status: 'paid',
        paid_at: new Date(invoice.status_transitions.paid_at * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentId);
    
    console.log('[Stripe] Payment marked as paid:', paymentId);
  }

  return { success: true, message: 'Payment updated' };
}

async function handleInvoicePaymentFailed(supabase, invoice) {
  const paymentId = invoice.metadata?.paymentId;
  
  if (paymentId) {
    await supabase
      .from('payment')
      .update({
        status: 'overdue',
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentId);
    
    console.log('[Stripe] Payment marked as overdue:', paymentId);
  }

  return { success: true, message: 'Payment status updated' };
}

async function handleSubscriptionCreated(supabase, subscription) {
  // Log subscription creation
  console.log('[Stripe] Subscription created:', subscription.id);
  return { success: true, message: 'Subscription logged' };
}

async function handleSubscriptionUpdated(supabase, subscription) {
  // Handle subscription updates
  console.log('[Stripe] Subscription updated:', subscription.id);
  return { success: true, message: 'Subscription update logged' };
}

async function handleSubscriptionDeleted(supabase, subscription) {
  // Mark related payments as cancelled
  await supabase
    .from('payment')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id);
  
  console.log('[Stripe] Subscription cancelled, payments updated:', subscription.id);
  return { success: true, message: 'Subscription cancellation processed' };
}

async function handleTrialWillEnd(supabase, subscription) {
  // Handle trial ending notification
  console.log('[Stripe] Trial ending for subscription:', subscription.id);
  // Could send notifications here
  return { success: true, message: 'Trial ending notification processed' };
}

/**
 * Get payment status from Stripe
 * 
 * @param {string} stripeInvoiceId - Stripe invoice ID
 * @returns {Promise<Object>} - Payment status
 */
export const getStripePaymentStatus = async (stripeInvoiceId) => {
  try {
    const response = await fetch(`/api/stripe/invoice/${stripeInvoiceId}/status`);
    
    if (!response.ok) {
      throw new Error('Failed to get payment status from Stripe');
    }

    return await response.json();

  } catch (error) {
    console.error('[Stripe] Status check failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};