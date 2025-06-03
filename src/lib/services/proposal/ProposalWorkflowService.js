import { createClient } from '@/lib/supabase/browser';
import { generateContractFromProposal, getContractSigners } from '@/lib/utils/generateContractFromProposal';
import { generatePaymentsFromProposal, updateFirstPaymentUrl } from '@/lib/utils/generatePaymentsFromProposal';

/**
 * Complete workflow service for handling proposal-to-contract-to-payment flow
 * This service orchestrates the entire process from proposal acceptance to contract generation
 */
export class ProposalWorkflowService {
  constructor() {
    this.supabase = createClient();
  }

  /**
   * Complete workflow: Generate contract and payments from proposal
   * 
   * @param {Object} params - Workflow parameters
   * @param {number} params.proposalId - Proposal ID
   * @param {string} params.billingMode - 'monthly', 'yearly', or 'one-time'
   * @param {Object} params.contractOptions - Optional contract customization
   * @param {boolean} params.generatePayments - Whether to generate payments (default: true)
   * @returns {Promise<Object>} - Complete workflow result
   */
  async generateContractWorkflow({
    proposalId,
    billingMode = 'monthly',
    contractOptions = {},
    generatePayments = true
  }) {
    try {
      console.log('[ProposalWorkflow] Starting complete workflow:', { proposalId, billingMode });

      // Step 1: Validate proposal exists and is in correct state
      const proposalValidation = await this.validateProposal(proposalId);
      if (!proposalValidation.valid) {
        throw new Error(proposalValidation.error);
      }

      // Step 2: Generate contract from proposal
      console.log('[ProposalWorkflow] Generating contract...');
      const contractResult = await generateContractFromProposal(
        proposalId, 
        billingMode, 
        contractOptions
      );

      if (!contractResult.success) {
        throw new Error(`Contract generation failed: ${contractResult.error}`);
      }

      const contract = contractResult.contract;
      console.log('[ProposalWorkflow] Contract generated:', contract.id);

      let paymentsResult = null;
      if (generatePayments) {
        // Step 3: Generate payments from proposal
        console.log('[ProposalWorkflow] Generating payments...');
        paymentsResult = await generatePaymentsFromProposal(
          proposalId,
          billingMode,
          contract.id
        );

        if (!paymentsResult.success) {
          console.warn('[ProposalWorkflow] Payment generation failed:', paymentsResult.error);
          // Don't fail the entire workflow for payment issues
        } else {
          console.log('[ProposalWorkflow] Payments generated:', paymentsResult.payments.length);
        }
      }

      // Step 4: Update proposal status to accepted
      await this.updateProposalStatus(proposalId, 'accepted');

      // Step 5: Get contract signers for reference
      const signers = await getContractSigners(proposalValidation.proposal.company_id);

      const result = {
        success: true,
        contract,
        payments: paymentsResult?.payments || [],
        signers,
        summary: {
          proposalId,
          contractId: contract.id,
          billingMode,
          productCount: contractResult.relatedData?.products?.length || 0,
          paymentCount: paymentsResult?.payments?.length || 0,
          totalValue: paymentsResult?.summary?.totalAmount || 0,
          companyId: contract.company_id
        }
      };

      console.log('[ProposalWorkflow] Workflow completed successfully');
      return result;

    } catch (error) {
      console.error('[ProposalWorkflow] Workflow failed:', error);
      return {
        success: false,
        error: error.message,
        contract: null,
        payments: []
      };
    }
  }

  /**
   * Send contract for e-signature
   * 
   * @param {number} contractId - Contract ID
   * @param {Array} signers - Array of signer objects with name and email
   * @param {Object} options - E-signature options
   * @returns {Promise<Object>} - E-signature result
   */
  async sendContractForSignature(contractId, signers, options = {}) {
    try {
      console.log('[ProposalWorkflow] Sending contract for signature:', contractId);

      // Validate contract exists and has content
      const { data: contract, error } = await this.supabase
        .from('contract')
        .select('*')
        .eq('id', contractId)
        .single();

      if (error || !contract) {
        throw new Error('Contract not found');
      }

      if (!contract.content) {
        throw new Error('Contract has no content to sign');
      }

      if (!signers || signers.length === 0) {
        throw new Error('No signers provided');
      }

      // Call the e-signature API
      const response = await fetch('/api/signature', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractId,
          platform: options.platform || 'esignatures',
          signers,
          forceResend: options.forceResend || false
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send contract for signature');
      }

      console.log('[ProposalWorkflow] Contract sent for signature successfully');
      return result;

    } catch (error) {
      console.error('[ProposalWorkflow] E-signature failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create Stripe checkout for contract payments
   * 
   * @param {number} contractId - Contract ID
   * @param {Object} options - Stripe options
   * @returns {Promise<Object>} - Stripe checkout result
   */
  async createStripeCheckout(contractId, options = {}) {
    try {
      console.log('[ProposalWorkflow] Creating Stripe checkout for contract:', contractId);

      // Get contract with payments
      const { data: payments, error } = await this.supabase
        .from('payment')
        .select('*')
        .eq('contract_id', contractId)
        .order('order_index', { ascending: true });

      if (error || !payments || payments.length === 0) {
        throw new Error('No payments found for this contract');
      }

      // TODO: Implement Stripe checkout creation
      // This would typically:
      // 1. Create Stripe checkout session or invoices
      // 2. Handle recurring vs one-time payments
      // 3. Return checkout URL
      // 4. Update first payment with payment_url

      console.log('[ProposalWorkflow] Stripe integration not yet implemented');
      return {
        success: false,
        error: 'Stripe integration not yet implemented'
      };

    } catch (error) {
      console.error('[ProposalWorkflow] Stripe checkout failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get complete workflow status for a proposal
   * 
   * @param {number} proposalId - Proposal ID
   * @returns {Promise<Object>} - Workflow status
   */
  async getWorkflowStatus(proposalId) {
    try {
      // Get proposal with related contracts and payments
      const { data: proposal, error } = await this.supabase
        .from('proposal')
        .select(`
          *,
          company:company_id(id, title),
          contracts:contract!proposal_id(
            id,
            title,
            status,
            signature_status,
            created_at,
            payments:payment!contract_id(
              id,
              amount,
              status,
              frequency,
              due_date
            )
          )
        `)
        .eq('id', proposalId)
        .single();

      if (error || !proposal) {
        throw new Error('Proposal not found');
      }

      const contracts = proposal.contracts || [];
      const allPayments = contracts.flatMap(c => c.payments || []);

      // Calculate status
      const hasContracts = contracts.length > 0;
      const hasSignedContract = contracts.some(c => c.signature_status === 'signed');
      const hasPayments = allPayments.length > 0;
      const paidPayments = allPayments.filter(p => p.status === 'paid');
      
      const totalAmount = allPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const paidAmount = paidPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

      return {
        success: true,
        proposal,
        status: {
          proposalStatus: proposal.status,
          hasContracts,
          contractCount: contracts.length,
          hasSignedContract,
          hasPayments,
          paymentCount: allPayments.length,
          paidPaymentCount: paidPayments.length,
          totalAmount,
          paidAmount,
          remainingAmount: totalAmount - paidAmount,
          percentPaid: totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0
        },
        contracts,
        payments: allPayments
      };

    } catch (error) {
      console.error('[ProposalWorkflow] Status check failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Cancel/void a contract and its payments
   * 
   * @param {number} contractId - Contract ID
   * @param {string} reason - Cancellation reason
   * @returns {Promise<Object>} - Cancellation result
   */
  async cancelContract(contractId, reason = '') {
    try {
      console.log('[ProposalWorkflow] Cancelling contract:', contractId);

      // Update contract status
      const { error: contractError } = await this.supabase
        .from('contract')
        .update({
          status: 'cancelled',
          signature_status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', contractId);

      if (contractError) {
        throw new Error(`Failed to cancel contract: ${contractError.message}`);
      }

      // Cancel pending payments
      const { error: paymentsError } = await this.supabase
        .from('payment')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('contract_id', contractId)
        .in('status', ['pending', 'sent']);

      if (paymentsError) {
        console.warn('[ProposalWorkflow] Failed to cancel payments:', paymentsError);
      }

      console.log('[ProposalWorkflow] Contract cancelled successfully');
      return {
        success: true,
        message: 'Contract cancelled successfully'
      };

    } catch (error) {
      console.error('[ProposalWorkflow] Contract cancellation failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Private helper methods

  async validateProposal(proposalId) {
    try {
      const { data: proposal, error } = await this.supabase
        .from('proposal')
        .select('*')
        .eq('id', proposalId)
        .single();

      if (error || !proposal) {
        return { valid: false, error: 'Proposal not found' };
      }

      if (!proposal.company_id) {
        return { valid: false, error: 'Proposal has no associated company' };
      }

      return { valid: true, proposal };

    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  async updateProposalStatus(proposalId, status) {
    try {
      const { error } = await this.supabase
        .from('proposal')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', proposalId);

      if (error) {
        console.warn('[ProposalWorkflow] Failed to update proposal status:', error);
      }
    } catch (error) {
      console.warn('[ProposalWorkflow] Failed to update proposal status:', error);
    }
  }
}

// Export singleton instance for convenience
export const proposalWorkflow = new ProposalWorkflowService();

// Export individual workflow functions for direct use
export {
  generateContractFromProposal,
  generatePaymentsFromProposal,
  updateFirstPaymentUrl,
  getContractSigners
};