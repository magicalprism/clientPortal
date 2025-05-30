// /app/api/signature/route.js - Debug version with better error handling
import { NextResponse } from 'next/server';

export async function POST(request) {
  console.log('[Signature API] ======== NEW REQUEST ========');
  console.log('[Signature API] Starting request processing...');
  
  try {
    // Step 1: Parse request body
    console.log('[Signature API] Step 1: Parsing request body...');
    let body;
    try {
      body = await request.json();
      console.log('[Signature API] Request body parsed successfully');
    } catch (parseError) {
      console.error('[Signature API] Failed to parse request body:', parseError);
      return NextResponse.json({ 
        error: 'Invalid JSON in request body',
        details: parseError.message 
      }, { status: 400 });
    }

    const { contractId, platform = 'esignatures', signers = [] } = body;
    console.log('[Signature API] Request data:', { 
      contractId, 
      platform, 
      signersCount: signers.length 
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

    // Step 3: Check environment variables
    console.log('[Signature API] Step 3: Checking environment variables...');
    if (!process.env.ESIGNATURES_API_KEY) {
      console.error('[Signature API] Missing ESIGNATURES_API_KEY');
      return NextResponse.json({ 
        error: 'E-signature service not configured properly',
        details: 'Missing API key'
      }, { status: 500 });
    }
    console.log('[Signature API] Environment variables OK');

    // Step 4: Import Supabase
    console.log('[Signature API] Step 4: Importing Supabase...');
    let createClient;
    try {
      const supabaseModule = await import('@/lib/supabase/server');
      createClient = supabaseModule.createClient;
      console.log('[Signature API] Supabase imported successfully');
    } catch (supabaseImportError) {
      console.error('[Signature API] Failed to import Supabase:', supabaseImportError);
      return NextResponse.json({ 
        error: 'Failed to import Supabase client',
        details: supabaseImportError.message 
      }, { status: 500 });
    }

    // Step 5: Create Supabase client
    console.log('[Signature API] Step 5: Creating Supabase client...');
    let supabase;
    try {
      supabase = await createClient();
      console.log('[Signature API] Supabase client created');
    } catch (supabaseCreateError) {
      console.error('[Signature API] Failed to create Supabase client:', supabaseCreateError);
      return NextResponse.json({ 
        error: 'Failed to create Supabase client',
        details: supabaseCreateError.message 
      }, { status: 500 });
    }

    // Step 6: Test Supabase connection
    console.log('[Signature API] Step 6: Testing Supabase connection...');
    try {
      const { data: testData, error: testError } = await supabase
        .from('contract')
        .select('id')
        .limit(1);
      
      if (testError) {
        console.error('[Signature API] Supabase test query failed:', testError);
        return NextResponse.json({ 
          error: 'Database connection failed',
          details: testError.message 
        }, { status: 500 });
      }
      console.log('[Signature API] Supabase connection test passed');
    } catch (testErr) {
      console.error('[Signature API] Supabase test exception:', testErr);
      return NextResponse.json({ 
        error: 'Database connection test failed',
        details: testErr.message 
      }, { status: 500 });
    }

    // Step 7: Import ESignatureService
    console.log('[Signature API] Step 7: Importing ESignatureService...');
    let ESignatureService;
    try {
      const serviceModule = await import('@/lib/services/eSignatureService');
      ESignatureService = serviceModule.ESignatureService;
      console.log('[Signature API] ESignatureService imported successfully');
      console.log('[Signature API] ESignatureService type:', typeof ESignatureService);
    } catch (serviceImportError) {
      console.error('[Signature API] Failed to import ESignatureService:', serviceImportError);
      console.error('[Signature API] Import error stack:', serviceImportError.stack);
      return NextResponse.json({ 
        error: 'Failed to import signature service',
        details: serviceImportError.message,
        stack: serviceImportError.stack
      }, { status: 500 });
    }

    // Step 8: Create service instance
    console.log('[Signature API] Step 8: Creating ESignatureService instance...');
    let signatureService;
    try {
      signatureService = new ESignatureService(platform, supabase);
      console.log('[Signature API] ESignatureService instance created');
      console.log('[Signature API] Service methods available:', Object.getOwnPropertyNames(Object.getPrototypeOf(signatureService)));
    } catch (serviceCreateError) {
      console.error('[Signature API] Failed to create service instance:', serviceCreateError);
      return NextResponse.json({ 
        error: 'Failed to create signature service instance',
        details: serviceCreateError.message 
      }, { status: 500 });
    }

    // Step 9: Fetch contract
    console.log('[Signature API] Step 9: Fetching contract...');
    let contract;
    try {
      const { data: contractData, error: contractError } = await supabase
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

      if (!contractData) {
        console.error('[Signature API] Contract not found:', contractId);
        return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
      }

      contract = contractData;
      console.log('[Signature API] Contract fetched successfully:', {
        id: contract.id,
        title: contract.title,
        hasContent: !!contract.content
      });
    } catch (fetchError) {
      console.error('[Signature API] Contract fetch exception:', fetchError);
      return NextResponse.json({ 
        error: 'Contract fetch failed',
        details: fetchError.message 
      }, { status: 500 });
    }

    // For now, just return success to test up to this point
    console.log('[Signature API] All steps completed successfully!');
    return NextResponse.json({
      success: true,
      message: 'Debug: All validation steps passed',
      contractId: contract.id,
      platform: platform,
      stepsCompleted: [
        'Request parsing',
        'Input validation', 
        'Environment check',
        'Supabase import',
        'Supabase client creation',
        'Supabase connection test',
        'Service import',
        'Service instance creation',
        'Contract fetch'
      ]
    });

  } catch (error) {
    console.error('[Signature API] ======== UNEXPECTED ERROR ========');
    console.error('[Signature API] Error name:', error.name);
    console.error('[Signature API] Error message:', error.message);
    console.error('[Signature API] Error stack:', error.stack);
    console.error('[Signature API] Error cause:', error.cause);
    
    return NextResponse.json({ 
      error: 'Unexpected server error',
      details: error.message,
      errorType: error.name,
      stack: error.stack
    }, { status: 500 });
  }
}