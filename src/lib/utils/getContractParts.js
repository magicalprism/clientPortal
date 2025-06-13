import { createClient } from '@/lib/supabase/browser';

/**
 * Utilities for managing contract parts and assembling contract content
 * This module handles the dynamic assembly of contracts from reusable parts
 */

/**
 * Get all contract parts for a specific contract
 * 
 * @param {number} contractId - Contract ID
 * @returns {Promise<Object>} - Contract parts with details
 */
export const getContractParts = async (contractId) => {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .from('contract_contractpart')
      .select(`
        *,
        contractpart:contractpart_id(
          id,
          title,
          content,
          order_index
        )
      `)
      .eq('contract_id', contractId)
      .order('order_index', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch contract parts: ${error.message}`);
    }

    return {
      success: true,
      parts: data || []
    };

  } catch (error) {
    console.error('[ContractParts] Error fetching parts:', error);
    return {
      success: false,
      error: error.message,
      parts: []
    };
  }
};

/**
 * Add contract parts to a contract
 * 
 * @param {number} contractId - Contract ID
 * @param {Array} contractPartIds - Array of contract part IDs
 * @returns {Promise<Object>} - Operation result
 */
export const addPartsToContract = async (contractId, contractPartIds) => {
  const supabase = createClient();
  
  try {
    console.log('[ContractParts] Adding parts to contract:', { contractId, partCount: contractPartIds.length });

    // Prepare contract_contractpart records
    const contractPartRecords = contractPartIds.map((partId, index) => ({
      contract_id: contractId,
      contractpart_id: partId,
      order_index: index + 1,
      created_at: new Date().toISOString()
    }));

    const { data, error } = await supabase
      .from('contract_contractpart')
      .insert(contractPartRecords)
      .select(`
        *,
        contractpart:contractpart_id(
          id,
          title,
          content
        )
      `);

    if (error) {
      throw new Error(`Failed to add parts to contract: ${error.message}`);
    }

    console.log('[ContractParts] Successfully added parts:', data.length);
    
    return {
      success: true,
      records: data,
      count: data.length
    };

  } catch (error) {
    console.error('[ContractParts] Error adding parts:', error);
    return {
      success: false,
      error: error.message,
      records: []
    };
  }
};

/**
 * Remove contract parts from a contract
 * 
 * @param {number} contractId - Contract ID
 * @param {Array} contractPartIds - Array of contract part IDs to remove
 * @returns {Promise<Object>} - Operation result
 */
export const removePartsFromContract = async (contractId, contractPartIds) => {
  const supabase = createClient();
  
  try {
    console.log('[ContractParts] Removing parts from contract:', { contractId, partIds: contractPartIds });

    const { error } = await supabase
      .from('contract_contractpart')
      .delete()
      .eq('contract_id', contractId)
      .in('contractpart_id', contractPartIds);

    if (error) {
      throw new Error(`Failed to remove parts from contract: ${error.message}`);
    }

    console.log('[ContractParts] Successfully removed parts');
    
    return {
      success: true,
      removedCount: contractPartIds.length
    };

  } catch (error) {
    console.error('[ContractParts] Error removing parts:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Reorder contract parts within a contract
 * 
 * @param {number} contractId - Contract ID
 * @param {Array} partOrders - Array of {contractPartId, order} objects
 * @returns {Promise<Object>} - Operation result
 */
export const reorderContractParts = async (contractId, partOrders) => {
  const supabase = createClient();
  
  try {
    console.log('[ContractParts] Reordering contract parts:', { contractId, orders: partOrders });

    // Update each part's order
    const updatePromises = partOrders.map(({ contractPartId, order }) =>
      supabase
        .from('contract_contractpart')
        .update({ 
          order_index: order,
          updated_at: new Date().toISOString()
        })
        .eq('contract_id', contractId)
        .eq('contractpart_id', contractPartId)
    );

    const results = await Promise.all(updatePromises);
    
    // Check for any errors
    const errors = results.filter(result => result.error);
    if (errors.length > 0) {
      throw new Error(`Failed to reorder some parts: ${errors[0].error.message}`);
    }

    console.log('[ContractParts] Successfully reordered parts');
    
    return {
      success: true,
      updatedCount: partOrders.length
    };

  } catch (error) {
    console.error('[ContractParts] Error reordering parts:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Assemble contract content from its parts
 * 
 * @param {number} contractId - Contract ID
 * @param {Object} templateVariables - Variables for template replacement
 * @returns {Promise<Object>} - Assembled content
 */
export const assembleContractContent = async (contractId, templateVariables = {}) => {
  const supabase = createClient();
  
  try {
    console.log('[ContractParts] Assembling contract content:', contractId);

    // Get contract with its parts
    const { data: contract, error: contractError } = await supabase
      .from('contract')
      .select(`
        *,
        company:company_id(
          id,
          title
        ),
        contract_contractpart(
          order_index,
          contractpart:contractpart_id(
            id,
            title,
            content,
            order_index
          )
        )
      `)
      .eq('id', contractId)
      .single();

    if (contractError || !contract) {
      throw new Error('Contract not found');
    }

    // Sort parts by order_index
    const sortedParts = (contract.contract_contractpart || [])
      .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
      .map(cp => cp.contractpart)
      .filter(Boolean);

    console.log('[ContractParts] Found contract parts:', sortedParts.length);

    if (sortedParts.length === 0) {
      return {
        success: true,
        content: '<p>No contract parts have been added to this contract.</p>',
        partsCount: 0
      };
    }

    // Prepare template variables
    const variables = {
      // Contract variables
      contract_title: contract.title || 'Service Contract',
      contract_start_date: contract.start_date || new Date().toISOString().split('T')[0],
      contract_due_date: contract.due_date || '',
      
      // Company variables
      company_name: contract.company?.title || 'Client',
      company_id: contract.company_id || '',
      
      // Date variables
      today: new Date().toLocaleDateString(),
      current_year: new Date().getFullYear(),
      
      // Custom variables
      ...templateVariables
    };

    // Assemble content from parts
    let assembledContent = '';
    
    for (const part of sortedParts) {
      if (!part.content) continue;
      
      let partContent = part.content;
      
      // Replace template variables in format {{variable_name}}
      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
        partContent = partContent.replace(regex, String(value || ''));
      });
      
      // Wrap each part in a section
      assembledContent += `
        <div class="contract-section" data-part-id="${part.id}" style="margin-bottom: 2rem;">
          <h3 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 1rem; color: #1f2937;">${part.title}</h3>
          <div class="section-content" style="color: #374151; line-height: 1.6;">
            ${partContent}
          </div>
        </div>
      `;
    }

    // Add contract header
    const contractHeader = `
      <div class="contract-header" style="margin-bottom: 3rem; text-align: center; border-bottom: 2px solid #e5e7eb; padding-bottom: 2rem;">
        <h1 style="font-size: 2rem; font-weight: bold; color: #1f2937; margin-bottom: 1rem;">${contract.title || 'Service Contract'}</h1>
        <p style="color: #6b7280; font-size: 1.1rem;">Between: <strong>Your Company</strong> and <strong>${contract.company?.title || 'Client'}</strong></p>
        <p style="color: #6b7280;">Date: ${new Date().toLocaleDateString()}</p>
      </div>
    `;

    const finalContent = contractHeader + assembledContent;

    console.log('[ContractParts] Content assembled successfully');
    
    return {
      success: true,
      content: finalContent,
      partsCount: sortedParts.length,
      variables: variables
    };

  } catch (error) {
    console.error('[ContractParts] Error assembling content:', error);
    return {
      success: false,
      error: error.message,
      content: '',
      partsCount: 0
    };
  }
};

/**
 * Get available contract parts for adding to contracts
 * 
 * @param {Object} filters - Optional filters
 * @returns {Promise<Object>} - Available contract parts
 */
export const getAvailableContractParts = async (filters = {}) => {
  const supabase = createClient();
  
  try {
    let query = supabase
      .from('contractpart')
      .select('*')
      .order('order_index', { ascending: true });

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        query = query.eq(key, value);
      }
    });

    const { data: parts, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch available contract parts: ${error.message}`);
    }

    return {
      success: true,
      parts: parts || []
    };

  } catch (error) {
    console.error('[ContractParts] Error fetching available parts:', error);
    return {
      success: false,
      error: error.message,
      parts: []
    };
  }
};

/**
 * Clone contract parts from one contract to another
 * 
 * @param {number} sourceContractId - Source contract ID
 * @param {number} targetContractId - Target contract ID
 * @returns {Promise<Object>} - Operation result
 */
export const cloneContractParts = async (sourceContractId, targetContractId) => {
  const supabase = createClient();
  
  try {
    console.log('[ContractParts] Cloning parts between contracts:', { sourceContractId, targetContractId });

    // Get source contract parts
    const { data: sourceParts, error: fetchError } = await supabase
      .from('contract_contractpart')
      .select('*')
      .eq('contract_id', sourceContractId)
      .order('order_index', { ascending: true });

    if (fetchError) {
      throw new Error(`Failed to fetch source contract parts: ${fetchError.message}`);
    }

    if (!sourceParts || sourceParts.length === 0) {
      return {
        success: true,
        message: 'No contract parts to clone',
        clonedCount: 0
      };
    }

    // Prepare cloned records
    const clonedRecords = sourceParts.map(part => ({
      contract_id: targetContractId,
      contractpart_id: part.contractpart_id,
      order_index: part.order_index,
      created_at: new Date().toISOString()
    }));

    // Insert cloned records
    const { data: insertedRecords, error: insertError } = await supabase
      .from('contract_contractpart')
      .insert(clonedRecords)
      .select();

    if (insertError) {
      throw new Error(`Failed to clone contract parts: ${insertError.message}`);
    }

    console.log('[ContractParts] Successfully cloned parts:', insertedRecords.length);
    
    return {
      success: true,
      clonedCount: insertedRecords.length,
      records: insertedRecords
    };

  } catch (error) {
    console.error('[ContractParts] Error cloning parts:', error);
    return {
      success: false,
      error: error.message,
      clonedCount: 0
    };
  }
};

/**
 * Update contract content by reassembling from parts
 * 
 * @param {number} contractId - Contract ID
 * @param {Object} templateVariables - Variables for template replacement
 * @returns {Promise<Object>} - Update result
 */
export const updateContractContentFromParts = async (contractId, templateVariables = {}) => {
  const supabase = createClient();
  
  try {
    console.log('[ContractParts] Updating contract content from parts:', contractId);

    // Assemble new content
    const assembleResult = await assembleContractContent(contractId, templateVariables);
    
    if (!assembleResult.success) {
      throw new Error(assembleResult.error);
    }

    // Update contract with new content
    const { error } = await supabase
      .from('contract')
      .update({
        content: assembleResult.content,
        updated_at: new Date().toISOString()
      })
      .eq('id', contractId);

    if (error) {
      throw new Error(`Failed to update contract content: ${error.message}`);
    }

    console.log('[ContractParts] Contract content updated successfully');
    
    return {
      success: true,
      contractId,
      partsCount: assembleResult.partsCount,
      contentLength: assembleResult.content.length
    };

  } catch (error) {
    console.error('[ContractParts] Error updating contract content:', error);
    return {
      success: false,
      error: error.message
    };
  }
};