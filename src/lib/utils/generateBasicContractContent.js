// src/lib/utils/generateContractFromProposal.js
import { compileContractContent } from '@/lib/utils/contractContentCompiler';
import { getCurrentContactId } from '@/lib/utils/getCurrentContactId';

/**
 * Generates a contract from a proposal with all related data
 * @param {Object} proposal - The proposal object with related data
 * @param {Object} options - Generation options
 * @returns {Object} The created contract
 */
export const generateContractFromProposal = async (proposal, options = {}) => {
  const { billingPeriod = 'monthly', selectedProducts = [], supabase } = options;
  
  console.log('[generateContractFromProposal] Starting contract generation for proposal:', proposal.id);
  
  if (!supabase) {
    throw new Error('Supabase client is required');
  }

  try {
    // Get current contact for authorship
    const contactId = await getCurrentContactId();
    if (!contactId) {
      throw new Error('Unable to identify current user');
    }

    // Calculate total amount from selected products
    const totalAmount = proposal.proposal_products
      ?.filter(pp => selectedProducts.length === 0 || selectedProducts.includes(pp.product_id))
      .reduce((sum, pp) => sum + (parseFloat(pp.price) || 0), 0) || 0;

    // Get the main product for contract details
    const mainProduct = proposal.proposal_products?.find(pp => !pp.is_addon);
    const platform = mainProduct?.product?.platform || 'wordpress';

    // Create the contract record
    const contractData = {
      title: `${proposal.title} - Contract`,
      company_id: proposal.company_id,
      proposal_id: proposal.id,
      author_id: contactId,
      status: 'draft',
      signature_status: null,
      billing_period: billingPeriod,
      total_amount: totalAmount,
      platform: platform,
      start_date: new Date().toISOString().split('T')[0], // Today
      due_date: calculateDueDate(billingPeriod), // Calculate based on billing period
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('[generateContractFromProposal] Creating contract with data:', contractData);

    // Insert contract
    const { data: contract, error: contractError } = await supabase
      .from('contract')
      .insert(contractData)
      .select()
      .single();

    if (contractError) {
      throw contractError;
    }

    console.log('[generateContractFromProposal] Contract created:', contract.id);

    // Link products to contract
    if (proposal.proposal_products?.length > 0) {
      const contractProducts = proposal.proposal_products
        .filter(pp => selectedProducts.length === 0 || selectedProducts.includes(pp.product_id))
        .map(pp => ({
          contract_id: contract.id,
          product_id: pp.product_id
        }));

      const { error: productsError } = await supabase
        .from('contract_product')
        .insert(contractProducts);

      if (productsError) {
        console.error('[generateContractFromProposal] Error linking products:', productsError);
      } else {
        console.log('[generateContractFromProposal] Linked products:', contractProducts.length);
      }
    }

    // Generate contract content
    try {
      const contractContent = await generateContractContent(contract, proposal, supabase);
      
      // Update contract with generated content
      const { error: contentError } = await supabase
        .from('contract')
        .update({ 
          content: contractContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', contract.id);

      if (contentError) {
        console.error('[generateContractFromProposal] Error updating content:', contentError);
      } else {
        console.log('[generateContractFromProposal] Contract content generated and saved');
        contract.content = contractContent;
      }
    } catch (contentError) {
      console.error('[generateContractFromProposal] Content generation failed (non-fatal):', contentError);
    }

    return contract;

  } catch (error) {
    console.error('[generateContractFromProposal] Error:', error);
    throw error;
  }
};

/**
 * Calculate due date based on billing period
 * @param {string} billingPeriod - 'monthly', 'yearly', or 'one_time'
 * @returns {string} ISO date string
 */
function calculateDueDate(billingPeriod) {
  const now = new Date();
  
  switch (billingPeriod) {
    case 'yearly':
      now.setFullYear(now.getFullYear() + 1);
      break;
    case 'monthly':
      now.setMonth(now.getMonth() + 1);
      break;
    case 'one_time':
    default:
      now.setDate(now.getDate() + 30); // 30 days for one-time
      break;
  }
  
  return now.toISOString().split('T')[0];
}

/**
 * Generate contract content from proposal and related data
 * @param {Object} contract - The contract record
 * @param {Object} proposal - The proposal with related data
 * @param {Object} supabase - Supabase client
 * @returns {string} Generated HTML content
 */
async function generateContractContent(contract, proposal, supabase) {
  console.log('[generateContractContent] Generating content for contract:', contract.id);
  
  try {
    // Fetch related data for content generation
    const relatedData = await fetchContractRelatedData(contract, proposal, supabase);
    
    // Use the existing contract content compiler
    const content = await compileContractContent(contract, relatedData);
    
    console.log('[generateContractContent] Content generated, length:', content.length);
    return content;
    
  } catch (error) {
    console.error('[generateContractContent] Error:', error);
    // Return a basic template if content generation fails
    return generateBasicContractContent(contract, proposal);
  }
}

/**
 * Fetch related data needed for contract content generation
 * @param {Object} contract - The contract record
 * @param {Object} proposal - The proposal with related data
 * @param {Object} supabase - Supabase client
 * @returns {Object} Related data
 */
async function fetchContractRelatedData(contract, proposal, supabase) {
  const relatedData = {
    products: [],
    selectedMilestones: [],
    payments: []
  };

  try {
    // Get products from proposal
    if (proposal.proposal_products?.length > 0) {
      relatedData.products = proposal.proposal_products.map(pp => ({
        id: pp.product_id,
        title: pp.product?.title || 'Product',
        description: pp.product?.description || '',
        price: pp.price,
        deliverables: pp.product?.deliverables || []
      }));
    }

    // Get milestones if any are associated
    const { data: milestones } = await supabase
      .from('milestone')
      .select('*')
      .eq('company_id', contract.company_id)
      .order('order_index');

    if (milestones?.length > 0) {
      relatedData.selectedMilestones = milestones.slice(0, 5); // Limit to first 5
    }

    console.log('[fetchContractRelatedData] Related data fetched:', {
      products: relatedData.products.length,
      milestones: relatedData.selectedMilestones.length
    });

  } catch (error) {
    console.error('[fetchContractRelatedData] Error fetching related data:', error);
  }

  return relatedData;
}

/**
 * Generate basic contract content as fallback
 * @param {Object} contract - The contract record
 * @param {Object} proposal - The proposal with related data
 * @returns {string} Basic HTML content
 */
function generateBasicContractContent(contract, proposal) {
  const companyName = proposal.company?.title || 'Client';
  const totalAmount = contract.total_amount || proposal.total_amount || 0;
  
  return `
    <div class="contract-content">
      <h1>Project Contract</h1>
      
      <h2>Agreement Details</h2>
      <p>This contract outlines the agreement between our company and <strong>${companyName}</strong> for the proposed project services.</p>
      
      <h2>Project Scope</h2>
      <p>Based on the approved proposal "${proposal.title}", this contract covers the delivery of the agreed services and deliverables.</p>
      
      <h2>Investment</h2>
      <p>Total project investment: <strong>$${totalAmount}</strong></p>
      <p>Billing frequency: <strong>${contract.billing_period || 'monthly'}</strong></p>
      
      <h2>Terms and Conditions</h2>
      <p>Payment terms and project timeline will be finalized upon contract execution.</p>
      
      <h2>Client Information</h2>
      <p><strong>Client Name:</strong> {{client_name}}</p>
      <p><strong>Date:</strong> {{today}}</p>
      
      <h2>Signatures</h2>
      <p><strong>Client Signature:</strong> {{initials}}</p>
      <p><strong>Date:</strong> {{today}}</p>
    </div>
  `;
}

export default generateContractFromProposal;