// /app/api/signature/route.js - Enhanced version with resend capability
import { createClient } from '@/lib/supabase/server';
import { ESignatureService } from '@/lib/services/eSignatureService';
import { NextResponse } from 'next/server';

export async function POST(request) {
  console.log('[Signature API] ======== NEW REQUEST ========');
  console.log('[Signature API] Starting request processing...');
  
  try {
    // Step 1: Parse request body
    console.log('[Signature API] Step 1: Parsing request body...');
    const body = await request.json();
    const { contractId, platform = 'esignatures', signers = [], forceResend = false } = body;
    
    console.log('[Signature API] Request data:', { 
      contractId, 
      platform, 
      signersCount: signers.length,
      forceResend,
      signers: signers.map(s => ({ name: s.name, email: s.email }))
    });
    
    // Step 2: Validate input
    console.log('[Signature API] Step 2: Validating input...');
    if (!contractId) {
      console.error('[Signature API] Missing contract ID');
      return NextResponse.json({ error: 'Contract ID is required' }, { status: 400 });
    }

    if (!signers || signers.length === 0) {
      console.error('[Signature API] No signers provided');
      return NextResponse.json({ error: 'At least one signer is required' }, { status: 400 });
    }

    // Validate signers
    const invalidSigners = signers.filter(s => !s.name || !s.email);
    if (invalidSigners.length > 0) {
      console.error('[Signature API] Invalid signers:', invalidSigners);
      return NextResponse.json({ error: 'All signers must have name and email' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = signers.filter(s => !emailRegex.test(s.email));
    if (invalidEmails.length > 0) {
      console.error('[Signature API] Invalid email formats:', invalidEmails.map(s => s.email));
      return NextResponse.json({ error: 'All signers must have valid email addresses' }, { status: 400 });
    }

    // Step 3: Check environment variables
    console.log('[Signature API] Step 3: Checking environment variables...');
    if (!process.env.ESIGNATURES_API_KEY) {
      console.error('[Signature API] Missing ESIGNATURES_API_KEY');
      return NextResponse.json({ 
        error: 'E-signature service not configured properly',
        details: 'Missing API key'
      }, { status: 500 });
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.error('[Signature API] Missing NEXT_PUBLIC_SUPABASE_URL');
      return NextResponse.json({ 
        error: 'E-signature service not configured properly',
        details: 'Missing Supabase URL'
      }, { status: 500 });
    }

    // Step 4: Create Supabase client
    console.log('[Signature API] Step 4: Creating Supabase client...');
    const supabase = await createClient();
    
    // Step 5: Fetch contract record
    console.log('[Signature API] Step 5: Fetching contract:', contractId);
    const { data: contract, error: contractError } = await supabase
      .from('contract')
      .select('*')
      .eq('id', contractId)
      .single();

    if (contractError) {
      console.error('[Signature API] Contract fetch error:', contractError);
      return NextResponse.json({ 
        error: 'Failed to fetch contract',
        details: contractError.message 
      }, { status: 500 });
    }

    if (!contract) {
      console.error('[Signature API] Contract not found:', contractId);
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    console.log('[Signature API] Contract found:', {
      id: contract.id,
      title: contract.title,
      currentStatus: contract.signature_status,
      hasContent: !!contract.content,
      contentLength: contract.content?.length || 0
    });

    // Step 6: Get contract configuration
    console.log('[Signature API] Step 6: Preparing contract configuration...');
    const config = {
      fields: [
        { name: 'title', type: 'text' },
        { name: 'content', type: 'richText' },
        { name: 'products', type: 'multiRelationship', relation: { table: 'product' } },
        { name: 'selectedMilestones', type: 'multiRelationship', relation: { table: 'milestone' } },
        { name: 'projected_length', type: 'text' },
        { name: 'platform', type: 'text' },
        { name: 'total_cost', type: 'number' },
        { name: 'start_date', type: 'date' },
        { name: 'due_date', type: 'date' }
      ]
    };

    // Step 7: Store signer information in contract metadata
    console.log('[Signature API] Step 7: Updating contract metadata...');
    const { error: metadataError } = await supabase
      .from('contract')
      .update({
        signature_metadata: {
          signers: signers,
          platform: platform,
          sent_by: 'system',
          sent_at: new Date().toISOString(),
          resend: forceResend
        }
      })
      .eq('id', contractId);

    if (metadataError) {
      console.error('[Signature API] Failed to update metadata:', metadataError);
      return NextResponse.json({ 
        error: 'Failed to update contract metadata',
        details: metadataError.message 
      }, { status: 500 });
    }

    // Step 8: Create ESignatureService and send contract
    console.log('[Signature API] Step 8: Creating ESignatureService...');
    const signatureService = new ESignatureService(platform, supabase);
    
    console.log('[Signature API] Step 9: *** SENDING CONTRACT TO ESIGNATURES API ***');
    const result = await signatureService.sendContract(contract, config, signers, forceResend);
    
    console.log('[Signature API] *** ESIGNATURES API RESPONSE ***');
    console.log('[Signature API] Success:', result.success);
    console.log('[Signature API] Document ID:', result.documentId);
    console.log('[Signature API] Sign URL:', result.signUrl);
    console.log('[Signature API] Message:', result.message);
    console.log('[Signature API] Can Resend:', result.canResend);

    return NextResponse.json(result);

  } catch (error) {
    console.error('[Signature API] ======== ERROR ========');
    console.error('[Signature API] Error message:', error.message);
    console.error('[Signature API] Error stack:', error.stack);
    
    return NextResponse.json({ 
      error: 'Failed to process signature request',
      details: error.message,
      errorType: error.name
    }, { status: 500 });
  }
}

// Add a new endpoint for checking signature status
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const contractId = searchParams.get('contractId');
    
    if (!contractId) {
      return NextResponse.json({ error: 'Contract ID is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const signatureService = new ESignatureService('esignatures', supabase);
    
    const status = await signatureService.getStatus(contractId);
    
    return NextResponse.json(status);
    
  } catch (error) {
    console.error('[Signature Status API] Error:', error);
    return NextResponse.json({ 
      error: 'Failed to get signature status',
      details: error.message 
    }, { status: 500 });
  }
}