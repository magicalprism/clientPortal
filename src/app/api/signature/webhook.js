// /pages/api/esignatures/webhook.js or /app/api/esignatures/webhook/route.js
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify webhook signature (important for security)
    const signature = req.headers['x-esignatures-signature'] || req.headers['signature'];
    const payload = JSON.stringify(req.body);
    
    if (!verifyWebhookSignature(payload, signature)) {
      console.error('Invalid webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const { event, document, metadata } = req.body;
    
    console.log('eSignatures webhook received:', { event, documentId: document?.id });

    // Extract contract ID from metadata
    const contractId = metadata?.contractId || document?.metadata?.contractId;
    
    if (!contractId) {
      console.error('No contract ID found in webhook payload');
      return res.status(400).json({ error: 'Contract ID not found' });
    }

    const supabase = createClient();

    // Handle different webhook events
    switch (event) {
      case 'document.signed':
        await handleDocumentSigned(supabase, contractId, document);
        break;
        
      case 'document.declined':
        await handleDocumentDeclined(supabase, contractId, document);
        break;
        
      case 'document.expired':
        await handleDocumentExpired(supabase, contractId, document);
        break;
        
      case 'document.viewed':
        await handleDocumentViewed(supabase, contractId, document);
        break;
        
      default:
        console.log('Unhandled webhook event:', event);
    }

    return res.status(200).json({ success: true, message: 'Webhook processed' });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}

// Verify webhook signature for security
function verifyWebhookSignature(payload, signature) {
  if (!signature || !process.env.ESIGNATURES_WEBHOOK_SECRET) {
    return false;
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', process.env.ESIGNATURES_WEBHOOK_SECRET)
      .update(payload)
      .digest('hex');
    
    // Compare signatures securely
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

// Handle when document is fully signed
async function handleDocumentSigned(supabase, contractId, document) {
  try {
    const updateData = {
      esignature_status: 'signed',
      esignature_signed_at: new Date().toISOString(),
      status: 'signed', // Update main contract status
      updated_at: new Date().toISOString()
    };

    // If document has signed PDF URL, store it
    if (document.signed_pdf_url) {
      updateData.signed_document_url = document.signed_pdf_url;
    }

    const { error } = await supabase
      .from('contract')
      .update(updateData)
      .eq('id', contractId);

    if (error) {
      throw error;
    }

    console.log(`Contract ${contractId} marked as signed`);

    // Optional: Send notification emails, trigger other workflows, etc.
    await sendSignedNotification(contractId);

  } catch (error) {
    console.error('Error handling document signed:', error);
    throw error;
  }
}

// Handle when document is declined
async function handleDocumentDeclined(supabase, contractId, document) {
  try {
    const { error } = await supabase
      .from('contract')
      .update({
        esignature_status: 'declined',
        esignature_declined_at: new Date().toISOString(),
        decline_reason: document.decline_reason || 'Document declined by signer',
        updated_at: new Date().toISOString()
      })
      .eq('id', contractId);

    if (error) {
      throw error;
    }

    console.log(`Contract ${contractId} declined`);

    // Optional: Send notification about declined contract
    await sendDeclinedNotification(contractId, document.decline_reason);

  } catch (error) {
    console.error('Error handling document declined:', error);
    throw error;
  }
}

// Handle when document expires
async function handleDocumentExpired(supabase, contractId, document) {
  try {
    const { error } = await supabase
      .from('contract')
      .update({
        esignature_status: 'expired',
        esignature_expired_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', contractId);

    if (error) {
      throw error;
    }

    console.log(`Contract ${contractId} expired`);

  } catch (error) {
    console.error('Error handling document expired:', error);
    throw error;
  }
}

// Handle when document is viewed
async function handleDocumentViewed(supabase, contractId, document) {
  try {
    // Just log this or update a "last viewed" timestamp
    const { error } = await supabase
      .from('contract')
      .update({
        esignature_last_viewed_at: new Date().toISOString()
      })
      .eq('id', contractId);

    if (error) {
      console.error('Error updating last viewed:', error);
    }

  } catch (error) {
    console.error('Error handling document viewed:', error);
  }
}

// Send notification when contract is signed
async function sendSignedNotification(contractId) {
  try {
    // Implement your notification logic here
    // Could be email, Slack, in-app notification, etc.
    console.log(`Sending signed notification for contract ${contractId}`);
    
    // Example: Send email notification
    // await sendEmail({
    //   to: 'admin@yourcompany.com',
    //   subject: 'Contract Signed',
    //   message: `Contract ${contractId} has been signed and is ready for review.`
    // });
    
  } catch (error) {
    console.error('Error sending signed notification:', error);
  }
}

// Send notification when contract is declined
async function sendDeclinedNotification(contractId, reason) {
  try {
    console.log(`Sending declined notification for contract ${contractId}, reason: ${reason}`);
    
    // Implement notification logic
    
  } catch (error) {
    console.error('Error sending declined notification:', error);
  }
}