// /app/api/signature/route.js - Debug version
import { createClient } from '@/lib/supabase/server';
import { ESignatureService } from '@/lib/services/eSignatureService';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { contractId, platform = 'esignatures', signers = [] } = body;
    
    console.log('[Signature API] POST request:', { contractId, platform, signers });
    
    if (!contractId) {
      return NextResponse.json({ error: 'Contract ID is required' }, { status: 400 });
    }

    if (!signers || signers.length === 0) {
      return NextResponse.json({ error: 'At least one signer is required' }, { status: 400 });
    }

    // Validate signers
    const invalidSigners = signers.filter(s => !s.name || !s.email);
    if (invalidSigners.length > 0) {
      return NextResponse.json({ error: 'All signers must have name and email' }, { status: 400 });
    }

    // DEBUG: Create and test Supabase client
    const supabase = await createClient(); // ← ADD AWAIT HERE
    console.log('[Debug] Supabase client created:', typeof supabase);
    console.log('[Debug] Supabase from method:', typeof supabase.from);
    
    // Test the supabase client with a simple query
    try {
      const { data: testData, error: testError } = await supabase
        .from('contract')
        .select('id')
        .limit(1);
      console.log('[Debug] Test query result:', { testData, testError });
    } catch (testErr) {
      console.error('[Debug] Test query failed:', testErr);
      return NextResponse.json({ 
        error: 'Supabase client test failed',
        details: testErr.message 
      }, { status: 500 });
    }
    
    // Fetch contract record
    const { data: contract, error: contractError } = await supabase
      .from('contract')
      .select('*')
      .eq('id', contractId)
      .single();

    if (contractError || !contract) {
      console.error('[Signature API] Contract not found:', contractError);
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    // Check if contract is already sent for signature
    if (contract.signature_status === 'sent') {
      return NextResponse.json({ 
        error: 'Contract is already sent for signature',
        status: contract.signature_status,
        documentId: contract.signature_document_id
      }, { status: 400 });
    }

    if (contract.signature_status === 'signed') {
      return NextResponse.json({ 
        error: 'Contract is already signed',
        status: contract.signature_status
      }, { status: 400 });
    }

    // Get contract configuration
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

    // Store signer information in contract metadata
    await supabase
      .from('contract')
      .update({
        signature_metadata: {
          signers: signers,
          platform: platform,
          sent_by: 'system',
          sent_at: new Date().toISOString()
        }
      })
      .eq('id', contractId);

    // DEBUG: Test ESignatureService creation
    console.log('[Debug] Creating ESignatureService...');
    const signatureService = new ESignatureService(platform, supabase);
    console.log('[Debug] ESignatureService created:', typeof signatureService);
    
    // For now, let's just return success without calling the service
    // to isolate where the issue is
    return NextResponse.json({
      success: true,
      message: 'Debug: Contract processing reached this point',
      contractId: contract.id,
      platform: platform
    });

    // COMMENTED OUT FOR DEBUG:
    // const result = await signatureService.sendContract(contract, config, signers);
    // return NextResponse.json(result);

  } catch (error) {
    console.error('[Signature API] Error:', error);
    console.error('[Signature API] Error stack:', error.stack);
    return NextResponse.json({ 
      error: 'Failed to process signature request',
      details: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}