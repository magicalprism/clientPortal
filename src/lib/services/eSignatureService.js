// /lib/services/eSignatureService.js - Enhanced with Sign URL Saving
import { createClient } from '@/lib/supabase/server';
import { ContentProcessor } from './signature/ContentProcessor.js';
import { PlatformHandlerFactory } from './signature/PlatformHandlerFactory.js';

export class ESignatureService {
  constructor(platform = 'esignatures', supabaseClient = null) {
    this.platform = platform;
    this.supabaseClient = supabaseClient;
    
    // Validate platform on construction
    if (!PlatformHandlerFactory.isPlatformImplemented(platform)) {
      const available = PlatformHandlerFactory.getImplementedPlatforms().join(', ');
      throw new Error(`Platform "${platform}" is not implemented. Available platforms: ${available}`);
    }
  }

  // Helper method to get Supabase client
  async getSupabase() {
    if (this.supabaseClient) {
      return this.supabaseClient;
    }
    return await createClient();
  }

  // Fetch payment URL from the first payment associated with the contract
  async getContractPaymentUrl(contractId) {
    try {
      console.log('[ESignatureService] Fetching payment URL for contract:', contractId);
      const supabase = await this.getSupabase();
      
      // Query to get the payment_url from the first payment associated with this contract
      const { data, error } = await supabase
        .from('contract_payment')
        .select(`
          payment_id,
          payment:payment_id (
            id,
            payment_url
          )
        `)
        .eq('contract_id', contractId)
        .order('id', { ascending: true }) // Get the first payment chronologically
        .limit(1)
        .single();

      if (error) {
        console.log('[ESignatureService] No payment found for contract (this is ok):', error.message);
        return null;
      }

      if (data?.payment?.payment_url) {
        console.log('[ESignatureService] Found payment URL:', data.payment.payment_url);
        return data.payment.payment_url;
      }

      console.log('[ESignatureService] No payment URL found in payment record');
      return null;
    } catch (error) {
      console.error('[ESignatureService] Error fetching payment URL:', error);
      return null; // Don't fail the entire signature process if payment URL fetch fails
    }
  }

  // Main method to send contract for signature
  async sendContract(contractRecord, config, signers = [], forceResend = false) {
    try {
      console.log('[ESignatureService] Starting sendContract process');
      console.log('[ESignatureService] Contract ID:', contractRecord.id);
      console.log('[ESignatureService] Platform:', this.platform);
      console.log('[ESignatureService] Signers count:', signers.length);
      console.log('[ESignatureService] Force resend:', forceResend);
      
      // Validate inputs
      this.validateSendContractInputs(contractRecord, signers);
      
      const supabase = await this.getSupabase();
      
      // Check current signature status
      const statusCheck = this.checkCurrentStatus(contractRecord, forceResend);
      if (!statusCheck.canProceed) {
        return statusCheck.result;
      }

      // Reset status if force resending
      if (forceResend && contractRecord.signature_status === 'sent') {
        await this.resetSignatureStatus(supabase, contractRecord.id);
      }
      
      // Fetch payment URL for redirect after signing
      const paymentUrl = await this.getContractPaymentUrl(contractRecord.id);
      console.log('[ESignatureService] Payment URL for redirect:', paymentUrl || 'None');
      
      // Process content for signature platform
      console.log('[ESignatureService] Processing content for signature...');
      const processedContent = ContentProcessor.processContentForSignature(contractRecord, signers);
      console.log('[ESignatureService] Content processed, length:', processedContent.length);
      
      // Send to platform
      console.log('[ESignatureService] Sending to platform:', this.platform);
      const platformResult = await this.sendToPlatform({
        title: contractRecord.title || "Project Contract",
        contractId: contractRecord.id,
        signers: signers,
        content: processedContent,
        webhookUrl: this.getWebhookUrl(),
        redirectUrl: paymentUrl
      });

      console.log('[ESignatureService] Platform result:', {
        success: platformResult.success,
        documentId: platformResult.documentId,
        signUrl: platformResult.signUrl, // Log the sign URL
        error: platformResult.error
      });

      if (platformResult.success) {
        // Update contract with signature info
        await this.updateContractWithSignatureInfo(supabase, contractRecord.id, platformResult);
        
        return {
          success: true,
          documentId: platformResult.documentId,
          signUrl: platformResult.signUrl,
          platform: this.platform,
          redirectUrl: paymentUrl,
          message: 'Contract sent for signature successfully'
        };
      } else {
        throw new Error(platformResult.error || 'Failed to send to signature platform');
      }

    } catch (error) {
      console.error('[ESignatureService] Error in sendContract:', error);
      throw error;
    }
  }

  // Get contract signature status
  async getStatus(contractId) {
    try {
      const supabase = await this.getSupabase();
      
      const { data: contract, error } = await supabase
        .from('contract')
        .select('signature_document_id, signature_platform, signature_status, signature_signed_at, signature_sent_at, signature_metadata, signed_document_url')
        .eq('id', contractId)
        .single();

      if (error || !contract) {
        throw new Error('Contract not found');
      }

      // Check with platform for real-time status if contract is sent
      let currentStatus = contract.signature_status;
      if (contract.signature_document_id && contract.signature_platform && currentStatus === 'sent') {
        const platformStatus = await this.checkPlatformStatus(
          contract.signature_document_id, 
          contract.signature_platform
        );
        
        if (platformStatus && platformStatus !== currentStatus) {
          // Update database with new status
          currentStatus = await this.updateContractStatus(supabase, contractId, platformStatus);
        }
      }

      return {
        contractId,
        documentId: contract.signature_document_id,
        platform: contract.signature_platform,
        status: currentStatus,
        sentAt: contract.signature_sent_at,
        signedAt: contract.signature_signed_at,
        signUrl: contract.signed_document_url, // Include the sign URL
        metadata: contract.signature_metadata
      };

    } catch (error) {
      console.error('[ESignatureService] Status check error:', error);
      throw error;
    }
  }

  // Cancel a sent contract
  async cancelContract(contractId) {
    try {
      const supabase = await this.getSupabase();
      
      const { data: contract } = await supabase
        .from('contract')
        .select('signature_document_id, signature_platform, signature_status')
        .eq('id', contractId)
        .single();

      if (!contract || !contract.signature_document_id) {
        throw new Error('Contract not found or not sent for signature');
      }

      if (contract.signature_status === 'signed') {
        throw new Error('Cannot cancel a signed contract');
      }

      // Cancel with platform
      const handler = PlatformHandlerFactory.createHandler(contract.signature_platform);
      if (handler.cancelContract) {
        const result = await handler.cancelContract(contract.signature_document_id);
        
        if (result.success) {
          // Update database
          await supabase
            .from('contract')
            .update({
              signature_status: 'cancelled',
              updated_at: new Date().toISOString()
            })
            .eq('id', contractId);
        }
        
        return result;
      }

      throw new Error(`Cancel operation not supported for platform: ${contract.signature_platform}`);
    } catch (error) {
      console.error('[ESignatureService] Cancel contract error:', error);
      throw error;
    }
  }

  // Private helper methods

  validateSendContractInputs(contractRecord, signers) {
    if (!contractRecord?.id) {
      throw new Error('Contract record with ID is required');
    }

    if (!contractRecord.content) {
      throw new Error('Contract content is required. Please regenerate the contract content.');
    }

    if (!signers || signers.length === 0) {
      throw new Error('At least one signer is required');
    }

    // Validate signers
    const invalidSigners = signers.filter(s => !s.name || !s.email);
    if (invalidSigners.length > 0) {
      throw new Error('All signers must have name and email');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = signers.filter(s => !emailRegex.test(s.email));
    if (invalidEmails.length > 0) {
      throw new Error('All signers must have valid email addresses');
    }
  }

  checkCurrentStatus(contractRecord, forceResend) {
    if (contractRecord.signature_status === 'sent' && !forceResend) {
      console.log('[ESignatureService] Contract already sent, returning existing info');
      return {
        canProceed: false,
        result: {
          success: false,
          error: 'Contract is already sent for signature',
          documentId: contractRecord.signature_document_id,
          canResend: true
        }
      };
    }

    if (contractRecord.signature_status === 'signed') {
      console.log('[ESignatureService] Contract already signed');
      return {
        canProceed: false,
        result: {
          success: false,
          error: 'Contract is already signed and cannot be resent',
          documentId: contractRecord.signature_document_id,
          canResend: false
        }
      };
    }

    return { canProceed: true };
  }

  async resetSignatureStatus(supabase, contractId) {
    console.log('[ESignatureService] Force resending - resetting signature status');
    const { error } = await supabase
      .from('contract')
      .update({
        signature_status: null,
        signature_document_id: null,
        signature_sent_at: null,
        signature_metadata: null,
        signed_document_url: null, // Also reset the document URL
        updated_at: new Date().toISOString()
      })
      .eq('id', contractId);

    if (error) {
      console.error('[ESignatureService] ❌ Error resetting signature status:', error);
      throw new Error(`Failed to reset signature status: ${error.message}`);
    }
    console.log('[ESignatureService] ✅ Signature status reset successfully');
  }

  // ENHANCED: Save the sign URL to signed_document_url field
  async updateContractWithSignatureInfo(supabase, contractId, platformResult) {
    console.log('[ESignatureService] Updating contract with signature info...');
    console.log('[ESignatureService] Contract ID:', contractId);
    console.log('[ESignatureService] Platform result:', {
      documentId: platformResult.documentId,
      signUrl: platformResult.signUrl, // Log the sign URL being saved
      platform: this.platform,
      metadata: platformResult.metadata ? 'present' : 'missing'
    });

    const updateData = {
      signature_document_id: platformResult.documentId,
      signature_platform: this.platform,
      signature_status: 'sent',
      signature_sent_at: new Date().toISOString(),
      signature_metadata: platformResult.metadata || {},
      updated_at: new Date().toISOString()
    };

    // FIXED: Save the signing URL to signed_document_url
    // This field will initially contain the signing URL, and later be updated
    // with the final signed document URL when the contract is completed
    if (platformResult.signUrl) {
      updateData.signed_document_url = platformResult.signUrl;
      console.log('[ESignatureService] ✅ Saving sign URL to signed_document_url:', platformResult.signUrl);
    } else {
      console.log('[ESignatureService] ⚠️ No sign URL provided in platform result');
    }

    console.log('[ESignatureService] Update payload:', updateData);

    try {
      const { data, error } = await supabase
        .from('contract')
        .update(updateData)
        .eq('id', contractId)
        .select(); // Add select to see what was actually updated

      if (error) {
        console.error('[ESignatureService] ❌ Database update error:', error);
        console.error('[ESignatureService] Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw new Error(`Failed to update contract: ${error.message}`);
      }

      if (!data || data.length === 0) {
        console.error('[ESignatureService] ❌ No rows were updated. Contract ID may not exist:', contractId);
        throw new Error(`No contract found with ID ${contractId} to update`);
      }

      console.log('[ESignatureService] ✅ Contract updated successfully');
      console.log('[ESignatureService] Updated contract data:', data[0]);
      
      // Verify the update worked by checking the specific fields
      const updatedContract = data[0];
      if (updatedContract.signature_document_id !== platformResult.documentId) {
        console.error('[ESignatureService] ⚠️ Document ID mismatch after update!');
      }
      if (updatedContract.signature_status !== 'sent') {
        console.error('[ESignatureService] ⚠️ Status not set to "sent" after update!');
      }
      if (platformResult.signUrl && updatedContract.signed_document_url !== platformResult.signUrl) {
        console.error('[ESignatureService] ⚠️ Sign URL not saved correctly!');
      } else if (platformResult.signUrl) {
        console.log('[ESignatureService] ✅ Sign URL confirmed saved:', updatedContract.signed_document_url);
      }
      
    } catch (err) {
      console.error('[ESignatureService] ❌ Unexpected error during database update:', err);
      throw err;
    }
  }

  async updateContractStatus(supabase, contractId, newStatus, additionalData = {}) {
    const updateData = {
      signature_status: newStatus,
      updated_at: new Date().toISOString()
    };

    if (newStatus === 'signed') {
      updateData.signature_signed_at = new Date().toISOString();
      updateData.status = 'signed';
      
      // ENHANCED: When contract is signed, update signed_document_url with final signed document URL
      // This overwrites the initial signing URL with the final signed document URL
      if (additionalData.signed_document_url) {
        updateData.signed_document_url = additionalData.signed_document_url;
        console.log('[ESignatureService] ✅ Updating signed_document_url with final signed document:', additionalData.signed_document_url);
      } else {
        console.log('[ESignatureService] ℹ️ No final signed document URL provided, keeping existing URL');
      }
    }

    // Include any other additional data
    Object.assign(updateData, additionalData);

    const { error } = await supabase
      .from('contract')
      .update(updateData)
      .eq('id', contractId);

    if (error) {
      console.error('[ESignatureService] Error updating contract status:', error);
      throw error;
    }

    console.log('[ESignatureService] Contract status updated successfully:', newStatus);
    return newStatus;
  }

  getWebhookUrl() {
    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VERCEL_URL;
    return `${baseUrl}/functions/v1/esignature-webhook`;
  }

  async sendToPlatform({ title, contractId, signers, content, webhookUrl, redirectUrl }) {
    console.log('[ESignatureService] Delegating to platform handler:', this.platform);
    console.log('[ESignatureService] Redirect URL:', redirectUrl || 'None provided');
    
    const handler = PlatformHandlerFactory.createHandler(this.platform);
    return await handler.sendContract({ 
      title, 
      contractId, 
      signers, 
      content, 
      webhookUrl, 
      redirectUrl
    });
  }

  async checkPlatformStatus(documentId, platform) {
    try {
      const handler = PlatformHandlerFactory.createHandler(platform);
      return await handler.checkStatus(documentId);
    } catch (error) {
      console.error('[ESignatureService] Platform status check error:', error);
      return null;
    }
  }

  // Static utility methods

  static getSupportedPlatforms() {
    return PlatformHandlerFactory.getImplementedPlatforms();
  }

  static validatePlatformConfig(platform) {
    return PlatformHandlerFactory.validatePlatformConfig(platform);
  }

  static getPlatformStatus(platform = null) {
    return PlatformHandlerFactory.getPlatformStatus(platform);
  }

  static getRecommendedPlatform() {
    return PlatformHandlerFactory.getRecommendedPlatform();
  }
}