// src/app/api/proposal/route.js
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { generateContractFromProposal } from '@/lib/utils/generateContractFromProposal';
import { generatePaymentsFromProposal } from '@/lib/utils/generatePaymentsFromProposal';

export async function POST(request) {
  console.log('[Proposal API] Starting request processing...');
  
  try {
    const body = await request.json();
    const { action, proposalId, billingPeriod, selectedProducts } = body;
    
    console.log('[Proposal API] Request:', { action, proposalId, billingPeriod, selectedProducts });
    
    if (!action || !proposalId) {
      return NextResponse.json(
        { error: 'Missing required fields: action and proposalId' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Handle different actions
    switch (action) {
      case 'generate_contract':
        return await handleGenerateContract(supabase, proposalId, billingPeriod, selectedProducts);
      
      case 'send_for_signature':
        return await handleSendForSignature(supabase, proposalId, body);
      
      case 'generate_payments':
        return await handleGeneratePayments(supabase, proposalId, billingPeriod);
      
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('[Proposal API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle contract generation from proposal
async function handleGenerateContract(supabase, proposalId, billingPeriod, selectedProducts) {
  console.log('[Proposal API] Generating contract from proposal:', proposalId);
  
  try {
    // Fetch the proposal with all related data
    const { data: proposal, error: proposalError } = await supabase
      .from('proposal')
      .select(`
        *,
        company:company_id(*),
        author:author_id(*),
        proposal_products:proposal_product(
          *,
          product:product_id(*)
        )
      `)
      .eq('id', proposalId)
      .single();

    if (proposalError || !proposal) {
      throw new Error('Proposal not found');
    }

    console.log('[Proposal API] Fetched proposal:', proposal.title);
    console.log('[Proposal API] Found products:', proposal.proposal_products?.length || 0);

    // Update proposal to track selected products and billing
    const { error: updateError } = await supabase
      .from('proposal')
      .update({
        billing_period: billingPeriod || proposal.billing_period,
        status: 'approved',
        updated_at: new Date().toISOString()
      })
      .eq('id', proposalId);

    if (updateError) {
      console.error('[Proposal API] Error updating proposal:', updateError);
    }

    // Generate the contract
    const contract = await generateContractFromProposal(proposal, {
      billingPeriod: billingPeriod || proposal.billing_period,
      selectedProducts: selectedProducts || proposal.proposal_products.map(pp => pp.product_id),
      supabase
    });

    console.log('[Proposal API] Contract generated:', contract.id);

    // Optionally generate payments automatically
    if (contract.id) {
      try {
        await generatePaymentsFromProposal(proposal, contract.id, {
          billingPeriod: billingPeriod || proposal.billing_period,
          supabase
        });
        console.log('[Proposal API] Payments generated for contract:', contract.id);
      } catch (paymentError) {
        console.error('[Proposal API] Payment generation failed (non-fatal):', paymentError);
      }
    }

    return NextResponse.json({
      success: true,
      contract,
      message: 'Contract generated successfully'
    });

  } catch (error) {
    console.error('[Proposal API] Contract generation error:', error);
    throw error;
  }
}

// Handle sending contract for signature
async function handleSendForSignature(supabase, proposalId, body) {
  console.log('[Proposal API] Sending proposal contract for signature:', proposalId);
  
  const { signers = [], platform = 'esignatures' } = body;
  
  try {
    // Get the associated contract
    const { data: contract, error: contractError } = await supabase
      .from('contract')
      .select('*')
      .eq('proposal_id', proposalId)
      .single();

    if (contractError || !contract) {
      throw new Error('No contract found for this proposal. Generate a contract first.');
    }

    // Use the signature service
    const signatureResponse = await fetch('/api/signature', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contractId: contract.id,
        platform,
        signers
      }),
    });

    const signatureResult = await signatureResponse.json();

    if (!signatureResponse.ok) {
      throw new Error(signatureResult.error || 'Failed to send for signature');
    }

    return NextResponse.json({
      success: true,
      contract,
      signature: signatureResult,
      message: 'Contract sent for signature successfully'
    });

  } catch (error) {
    console.error('[Proposal API] Signature sending error:', error);
    throw error;
  }
}

// Handle payment generation
async function handleGeneratePayments(supabase, proposalId, billingPeriod) {
  console.log('[Proposal API] Generating payments for proposal:', proposalId);
  
  try {
    // Fetch the proposal
    const { data: proposal, error: proposalError } = await supabase
      .from('proposal')
      .select(`
        *,
        proposal_products:proposal_product(
          *,
          product:product_id(*)
        )
      `)
      .eq('id', proposalId)
      .single();

    if (proposalError || !proposal) {
      throw new Error('Proposal not found');
    }

    // Get associated contract
    const { data: contract, error: contractError } = await supabase
      .from('contract')
      .select('id')
      .eq('proposal_id', proposalId)
      .single();

    if (contractError || !contract) {
      throw new Error('No contract found for this proposal. Generate a contract first.');
    }

    // Generate payments
    const payments = await generatePaymentsFromProposal(proposal, contract.id, {
      billingPeriod: billingPeriod || proposal.billing_period,
      supabase
    });

    console.log('[Proposal API] Generated payments:', payments.length);

    return NextResponse.json({
      success: true,
      payments,
      message: 'Payments generated successfully'
    });

  } catch (error) {
    console.error('[Proposal API] Payment generation error:', error);
    throw error;
  }
}

// GET method for fetching proposal data
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const proposalId = searchParams.get('id');
    
    if (!proposalId) {
      return NextResponse.json(
        { error: 'Proposal ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: proposal, error } = await supabase
      .from('proposal')
      .select(`
        *,
        company:company_id(*),
        author:author_id(*),
        proposal_products:proposal_product(
          *,
          product:product_id(*)
        ),
        contracts:contract(*)
      `)
      .eq('id', proposalId)
      .single();

    if (error || !proposal) {
      return NextResponse.json(
        { error: 'Proposal not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      proposal
    });

  } catch (error) {
    console.error('[Proposal API] GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}