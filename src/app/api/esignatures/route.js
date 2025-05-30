// /pages/api/esignatures/index.js or /app/api/esignatures/route.js
import { createClient } from '@/lib/supabase/server';
import { ESignatureExportService } from '@/lib/services/eSignatureExportService';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    return handleCreateESignature(req, res);
  } else if (req.method === 'GET') {
    return handleGetESignatureStatus(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

// Create and send contract to eSignatures.com
async function handleCreateESignature(req, res) {
  try {
    const { contractId } = req.body;
    
    if (!contractId) {
      return res.status(400).json({ error: 'Contract ID is required' });
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

    // Fetch contract config (you might need to adjust this based on your setup)
    const config = {
      fields: [
        // Add your contract field configuration here
        // This should match your contract collection config
      ]
    };

    // Generate the contract content
    const exportService = new ESignatureExportService();
    const result = await exportService.exportContract(contract, config);

    // Send to eSignatures.com API
    const eSignatureResponse = await sendToESignaturesAPI({
      title: contract.title,
      content: result.htmlContent,
      contractId: contract.id,
      webhookUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/api/esignatures/webhook`
    });

    if (eSignatureResponse.success) {
      // Update contract with eSignature document ID
      await supabase
        .from('contract')
        .update({
          esignature_document_id: eSignatureResponse.documentId,
          esignature_status: 'sent',
          esignature_sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', contractId);

      return res.status(200).json({
        success: true,
        documentId: eSignatureResponse.documentId,
        signUrl: eSignatureResponse.signUrl,
        message: 'Contract sent to eSignatures successfully'
      });
    } else {
      throw new Error(eSignatureResponse.error || 'Failed to send to eSignatures');
    }

  } catch (error) {
    console.error('eSignatures API error:', error);
    return res.status(500).json({ 
      error: 'Failed to process eSignature request',
      details: error.message
    });
  }
}

// Get eSignature status
async function handleGetESignatureStatus(req, res) {
  try {
    const { contractId } = req.query;
    
    if (!contractId) {
      return res.status(400).json({ error: 'Contract ID is required' });
    }

    const supabase = createClient();
    
    const { data: contract, error } = await supabase
      .from('contract')
      .select('esignature_document_id, esignature_status, esignature_signed_at, esignature_sent_at')
      .eq('id', contractId)
      .single();

    if (error || !contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    // Optionally, check status with eSignatures.com API
    let currentStatus = contract.esignature_status;
    if (contract.esignature_document_id && currentStatus === 'sent') {
      const statusFromAPI = await checkESignatureStatus(contract.esignature_document_id);
      if (statusFromAPI && statusFromAPI !== currentStatus) {
        // Update our database if status changed
        await supabase
          .from('contract')
          .update({
            esignature_status: statusFromAPI,
            ...(statusFromAPI === 'signed' && { esignature_signed_at: new Date().toISOString() })
          })
          .eq('id', contractId);
        
        currentStatus = statusFromAPI;
      }
    }

    return res.status(200).json({
      contractId,
      documentId: contract.esignature_document_id,
      status: currentStatus,
      sentAt: contract.esignature_sent_at,
      signedAt: contract.esignature_signed_at
    });

  } catch (error) {
    console.error('Status check error:', error);
    return res.status(500).json({ error: 'Failed to check status' });
  }
}

// Send contract to eSignatures.com API
async function sendToESignaturesAPI({ title, content, contractId, webhookUrl }) {
  try {
    // TODO: Replace with actual eSignatures.com API endpoint and authentication
    const response = await fetch('https://api.esignatures.com/documents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.ESIGNATURES_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: title,
        content: content,
        metadata: {
          contractId: contractId
        },
        webhook: {
          url: webhookUrl,
          events: ['document.signed', 'document.declined', 'document.expired']
        },
        // Add other eSignatures.com specific parameters
        signers: [
          // You'll need to add signer information here
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`eSignatures API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      success: true,
      documentId: data.id, // Adjust based on eSignatures.com response format
      signUrl: data.signUrl // Adjust based on eSignatures.com response format
    };

  } catch (error) {
    console.error('eSignatures API call failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Check document status with eSignatures.com
async function checkESignatureStatus(documentId) {
  try {
    const response = await fetch(`https://api.esignatures.com/documents/${documentId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.ESIGNATURES_API_KEY}`
      }
    });

    if (!response.ok) {
      throw new Error(`Status check failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Map eSignatures.com status to your status values
    const statusMap = {
      'pending': 'sent',
      'completed': 'signed',
      'declined': 'declined',
      'expired': 'expired'
    };

    return statusMap[data.status] || data.status;

  } catch (error) {
    console.error('Status check error:', error);
    return null;
  }
}