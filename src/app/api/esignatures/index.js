// /pages/api/signature/index.js - Enhanced with signer support
import { createClient } from '@/lib/supabase/server';
import { ESignatureService } from '@/lib/services/eSignatureService';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    return handleSendForSignature(req, res);
  } else if (req.method === 'GET') {
    return handleGetSignatureStatus(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleSendForSignature(req, res) {
  try {
    const { contractId, platform = 'esignatures', signers = [] } = req.body;
    
    if (!contractId) {
      return res.status(400).json({ error: 'Contract ID is required' });
    }

    if (!signers || signers.length === 0) {
      return res.status(400).json({ error: 'At least one signer is required' });
    }

    // Validate signers
    const invalidSigners = signers.filter(s => !s.name || !s.email);
    if (invalidSigners.length > 0) {
      return res.status(400).json({ error: 'All signers must have name and email' });
    }

    const supabase = createClient();
    
    // Fetch contract record
    const { data: contract, error: contractError } = await supabase
      .from('contract')
      .select('*')
      .eq('id', contractId)
      .single();

    if (contractError || !contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    // Check if contract is already sent for signature
    if (contract.signature_status === 'sent') {
      return res.status(400).json({ 
        error: 'Contract is already sent for signature',
        status: contract.signature_status,
        documentId: contract.signature_document_id
      });
    }

    if (contract.signature_status === 'signed') {
      return res.status(400).json({ 
        error: 'Contract is already signed',
        status: contract.signature_status
      });
    }

    // Get contract configuration
    const config = getContractConfig();

    // Store signer information in contract metadata
    await supabase
      .from('contract')
      .update({
        signature_metadata: {
          signers: signers,
          platform: platform,
          sent_by: req.user?.id || 'system', // Add user context if available
          sent_at: new Date().toISOString()
        }
      })
      .eq('id', contractId);

    // Use the generic service
    const signatureService = new ESignatureService(platform);
    const result = await signatureService.sendContract(contract, config, signers);

    // Log the signature request for audit purposes
    await logSignatureRequest(supabase, {
      contractId,
      platform,
      signers,
      result
    });

    return res.status(200).json(result);

  } catch (error) {
    console.error('Signature API error:', error);
    return res.status(500).json({ 
      error: 'Failed to process signature request',
      details: error.message
    });
  }
}

async function handleGetSignatureStatus(req, res) {
  try {
    const { contractId } = req.query;
    
    if (!contractId) {
      return res.status(400).json({ error: 'Contract ID is required' });
    }

    const signatureService = new ESignatureService();
    const status = await signatureService.getStatus(contractId);

    return res.status(200).json(status);

  } catch (error) {
    console.error('Status check error:', error);
    return res.status(500).json({ error: 'Failed to check status' });
  }
}

function getContractConfig() {
  // Return your contract field configuration
  return {
    fields: [
      { name: 'title', type: 'text' },
      { name: 'content', type: 'richText' },
      { name: 'products', type: 'multiRelationship', relation: { table: 'product' } },
      { name: 'selectedMilestones', type: 'multiRelationship', relation: { table: 'milestone' } },
      { name: 'projected_length', type: 'text' },
      { name: 'platform', type: 'text' },
      { name: 'total_cost', type: 'number' },
      { name: 'start_date', type: 'date' },
      { name: 'due_date', type: 'date' },
      // Add other fields as needed
    ]
  };
}

// Log signature requests for audit trail
async function logSignatureRequest(supabase, { contractId, platform, signers, result }) {
  try {
    await supabase
      .from('signature_log') // You might want to create this table
      .insert({
        contract_id: contractId,
        platform: platform,
        signers_count: signers.length,
        signers_data: signers,
        success: result.success,
        document_id: result.documentId,
        error_message: result.error || null,
        created_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Failed to log signature request:', error);
    // Don't fail the main request if logging fails
  }
}