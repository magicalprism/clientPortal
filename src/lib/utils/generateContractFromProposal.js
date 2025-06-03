import { createClient } from '@/lib/supabase/browser';
import { compileContractContent } from '@/lib/utils/contractContentCompiler';

/**
 * Generates a complete contract from a proposal
 * 
 * @param {number} proposalId - The proposal ID
 * @param {string} billingMode - 'monthly', 'yearly', or 'one-time'
 * @param {Object} options - Additional options for contract generation
 * @returns {Promise<Object>} - { success: boolean, contract: Object, error?: string }
 */
export const generateContractFromProposal = async (proposalId, billingMode = 'monthly', options = {}) => {
  const supabase = createClient();
  
  try {
    console.log('[generateContract] Starting contract generation:', { proposalId, billingMode });

    // Fetch proposal with all related data
    const { data: proposal, error: proposalError } = await supabase
      .from('proposal')
      .select(`
        *,
        company:company_id(
          id,
          title
        ),
        product_proposal!inner(
          id,
          product_id,
          tier,
          type,
          custom_price,
          "order",
          product(
            id,
            title,
            price,
            yearly_price,
            payment_split_count,
            description
          )
        )
      `)
      .eq('id', proposalId)
      .single();

    if (proposalError || !proposal) {
      throw new Error(`Failed to fetch proposal: ${proposalError?.message || 'Proposal not found'}`);
    }

    console.log('[generateContract] Proposal loaded:', proposal.title);

    // Prepare contract data structure
    const contractData = {
      title: `${proposal.company?.title || 'Client'} - ${proposal.title || 'Service Contract'}`,
      proposal_id: proposalId,
      company_id: proposal.company_id,
      status: 'draft',
      start_date: options.startDate || new Date().toISOString().split('T')[0],
      due_date: options.dueDate || null,
      projected_length: options.projectedLength || '3-6 months',
      platform: options.platform || 'wordpress',
    };

    // Transform product_proposal data for contract compilation
    const products = proposal.product_proposal.map(pp => ({
      id: pp.product.id,
      title: pp.product.title,
      description: pp.product.description || '',
      price: pp.custom_price || (billingMode === 'yearly' ? pp.product.yearly_price : pp.product.price) || 0,
      billingMode,
      type: pp.type || 'core',
      order: pp.order || 0,
      // Add deliverables if they exist (would need separate query if this relationship exists)
      deliverables: []
    }));

    // Sort products by order and type (core products first)
    products.sort((a, b) => {
      if (a.type === 'core' && b.type !== 'core') return -1;
      if (a.type !== 'core' && b.type === 'core') return 1;
      return (a.order || 0) - (b.order || 0);
    });

    // Prepare related data for contract compilation
    const relatedData = {
      products: products,
      selectedMilestones: [], // Would need to fetch if milestones are linked to proposals
      payments: [], // Will be generated separately
      billingMode,
      proposal: proposal
    };

    // Use existing contract content compiler
    console.log('[generateContract] Compiling contract content...');
    const compiledContent = await compileContractContent(contractData, relatedData);

    // Add proposal-specific content sections
    const proposalSection = generateProposalSection(proposal, products, billingMode);
    const finalContent = `
      ${compiledContent}
      ${proposalSection}
    `;

    // Create the contract record
    const contractRecord = {
      ...contractData,
      content: finalContent,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Get current user for author_id
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (!userError && userData?.user?.email) {
      const { data: contact } = await supabase
        .from('contact')
        .select('id')
        .eq('email', userData.user.email)
        .single();
      
      if (contact) {
        contractRecord.author_id = contact.id;
      }
    }

    console.log('[generateContract] Creating contract record...');
    const { data: createdContract, error: contractError } = await supabase
      .from('contract')
      .insert(contractRecord)
      .select()
      .single();

    if (contractError) {
      throw new Error(`Failed to create contract: ${contractError.message}`);
    }

    console.log('[generateContract] Contract created successfully:', createdContract.id);

    return {
      success: true,
      contract: createdContract,
      relatedData,
      summary: {
        contractId: createdContract.id,
        proposalId,
        productCount: products.length,
        totalValue: products.reduce((sum, p) => sum + p.price, 0),
        billingMode
      }
    };

  } catch (error) {
    console.error('[generateContract] Error:', error);
    return {
      success: false,
      error: error.message,
      contract: null
    };
  }
};

/**
 * Generates proposal-specific content section for contracts
 * 
 * @param {Object} proposal - Proposal data
 * @param {Array} products - Products array
 * @param {string} billingMode - Billing mode
 * @returns {string} - HTML content section
 */
const generateProposalSection = (proposal, products, billingMode) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const totalAmount = products.reduce((sum, product) => sum + product.price, 0);
  
  const billingFrequency = billingMode === 'yearly' ? 'annually' : 
                          billingMode === 'monthly' ? 'monthly' : 
                          'one-time';

  const productRows = products.map(product => `
    <tr>
      <td style="border: 1px solid #e5e7eb; padding: 12px; font-weight: 500;">${product.title}</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px;">${product.description || 'Service as described'}</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px; text-align: right; font-weight: 600; color: #059669;">${formatCurrency(product.price)}</td>
    </tr>
  `).join('');

  return `
    <div class="contract-section" style="margin-bottom: 2rem;">
      <h3 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 1rem; color: #1f2937;">Proposal of Services</h3>
      <div class="section-content" style="color: #374151; line-height: 1.6;">
        <p>This contract is based on <strong>${proposal.title}</strong> (Tier: ${proposal.tier || 'Standard'}) as accepted by ${proposal.company?.title || 'the Client'}.</p>
        
        <h4 style="font-size: 1.1rem; font-weight: 600; margin: 1.5rem 0 1rem 0; color: #374151;">Service Breakdown</h4>
        <table style="border-collapse: collapse; margin: 1rem 0; width: 100%; border: 2px solid #d1d5db;">
          <thead>
            <tr style="background-color: #f9fafb;">
              <th style="border: 1px solid #e5e7eb; padding: 12px; font-weight: 600; text-align: left;">Service</th>
              <th style="border: 1px solid #e5e7eb; padding: 12px; font-weight: 600; text-align: left;">Description</th>
              <th style="border: 1px solid #e5e7eb; padding: 12px; font-weight: 600; text-align: left;">Price (${billingFrequency})</th>
            </tr>
          </thead>
          <tbody>
            ${productRows}
            <tr style="background-color: #f0f9ff; border-top: 2px solid #0ea5e9;">
              <td style="border: 1px solid #e5e7eb; padding: 12px; font-weight: bold; color: #0c4a6e;" colspan="2">Total Project Cost (${billingFrequency})</td>
              <td style="border: 1px solid #e5e7eb; padding: 12px; text-align: right; font-weight: bold; color: #0ea5e9; font-size: 1.125rem;">${formatCurrency(totalAmount)}</td>
            </tr>
          </tbody>
        </table>
        
        <p><strong>Billing Mode:</strong> ${billingMode === 'yearly' ? 'Annual billing' : billingMode === 'monthly' ? 'Monthly recurring billing' : 'One-time payment'}</p>
        ${proposal.proposal_content ? `
          <h4 style="font-size: 1.1rem; font-weight: 600; margin: 1.5rem 0 1rem 0; color: #374151;">Additional Terms</h4>
          <div>${proposal.proposal_content}</div>
        ` : ''}
      </div>
    </div>
  `;
};

/**
 * Updates an existing contract with new proposal data
 * Useful for when proposals change after contract creation
 * 
 * @param {number} contractId - Existing contract ID  
 * @param {string} billingMode - New billing mode
 * @returns {Promise<Object>} - Update result
 */
export const updateContractFromProposal = async (contractId, billingMode) => {
  const supabase = createClient();
  
  try {
    // Get existing contract with proposal
    const { data: contract, error: contractError } = await supabase
      .from('contract')
      .select(`
        *,
        proposal:proposal_id(*)
      `)
      .eq('id', contractId)
      .single();

    if (contractError || !contract) {
      throw new Error('Contract not found');
    }

    if (!contract.proposal_id) {
      throw new Error('Contract is not linked to a proposal');
    }

    // Regenerate contract content
    const { success, contract: updatedContract, error } = await generateContractFromProposal(
      contract.proposal_id, 
      billingMode, 
      {
        startDate: contract.start_date,
        dueDate: contract.due_date,
        projectedLength: contract.projected_length,
        platform: contract.platform
      }
    );

    if (!success) {
      throw new Error(error);
    }

    // Update existing contract with new content
    const { error: updateError } = await supabase
      .from('contract')
      .update({
        content: updatedContract.content,
        updated_at: new Date().toISOString()
      })
      .eq('id', contractId);

    if (updateError) {
      throw new Error(`Failed to update contract: ${updateError.message}`);
    }

    return {
      success: true,
      contractId,
      message: 'Contract updated successfully'
    };

  } catch (error) {
    console.error('[updateContractFromProposal] Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Gets contract signing contacts for a company
 * Uses the company_contact and category_contact pivot tables
 * 
 * @param {number} companyId - Company ID
 * @param {string} categoryName - Category name to filter by (default: 'contract-signer')
 * @returns {Promise<Array>} - Array of contact objects
 */
export const getContractSigners = async (companyId, categoryName = 'contract-signer') => {
  const supabase = createClient();
  
  try {
    const { data: signers, error } = await supabase
      .from('company_contact')
      .select(`
        contact:contact_id(
          id,
          title,
          email,
          first_name,
          last_name
        )
      `)
      .eq('company_id', companyId);

    if (error) {
      console.error('[getContractSigners] Error fetching signers:', error);
      return [];
    }

    // TODO: Add category filtering when category_contact relationship is set up
    // For now, return all company contacts
    return signers.map(s => s.contact).filter(Boolean);

  } catch (error) {
    console.error('[getContractSigners] Error:', error);
    return [];
  }
};