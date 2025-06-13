// lib/supabase/queries/pivot/contract_contractpart.js

import { createClient } from '@/lib/supabase/browser';
import { getPostgresTimestamp } from '@/lib/utils/getPostgresTimestamp';

const supabase = createClient();

/**
 * Fetch contract parts for a contract (with order from pivot table)
 * @param {number} contractId - The contract ID
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export const fetchContractPartsForContract = async (contractId) => {
  try {
    const { data: contractPartsData, error } = await supabase
      .from('contract_contractpart')
      .select(`
        order_index,
        is_included,
        custom_content,
        contractpart (
          id,
          title,
          content,
          is_required,
          order_index,
          created_at,
          updated_at
        )
      `)
      .eq('contract_id', contractId)
      .order('order_index');

    if (error) {
      console.error('❌ Error fetching contract parts:', error);
      return { success: false, error: error.message };
    }

    if (!contractPartsData || contractPartsData.length === 0) {
      console.log('📋 No contract parts found for contract:', contractId);
      return { success: true, data: [] };
    }

    // Transform the data - use order_index from pivot table
    const parts = contractPartsData.map(cp => ({
      ...cp.contractpart,
      order_index: cp.order_index,
      is_included: cp.is_included,
      custom_content: cp.custom_content
    }));

    console.log(`✅ Fetched ${parts.length} contract parts for contract ${contractId}`);
    return { success: true, data: parts };

  } catch (err) {
    console.error('❌ Unexpected error fetching contract parts:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Save contract parts for a contract (replaces all existing relationships)
 * @param {number} contractId - The contract ID
 * @param {Array} contractParts - Array of contract parts with order_index
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const saveContractPartsForContract = async (contractId, contractParts) => {
  try {
    console.log(`[saveContractPartsForContract] Saving ${contractParts.length} parts for contract ${contractId}`);
    
    // Step 1: Delete existing relationships
    console.log('[saveContractPartsForContract] Deleting existing relationships...');
    const { error: deleteError } = await supabase
      .from('contract_contractpart')
      .delete()
      .eq('contract_id', contractId);

    if (deleteError) {
      console.error('❌ Error deleting existing contract parts:', deleteError);
      // Don't return here - try to continue with insert
    } else {
      console.log('✅ Existing relationships deleted');
    }

    // Step 2: Insert new relationships (only if we have parts)
    if (contractParts.length === 0) {
      console.log('📋 No contract parts to insert');
      return { success: true };
    }

    const pivotData = contractParts.map(part => ({
      contract_id: contractId,
      contractpart_id: part.id,
      order_index: part.order_index,
      is_included: part.is_included !== undefined ? part.is_included : true,
      custom_content: part.custom_content || null,
      created_at: getPostgresTimestamp(),
      updated_at: getPostgresTimestamp(),
      author_id: 1 // TODO: Get from auth context
    }));

    console.log('[saveContractPartsForContract] Inserting pivot data:', pivotData);

    const { error: pivotError, data: pivotResult } = await supabase
      .from('contract_contractpart')
      .insert(pivotData)
      .select();

    if (pivotError) {
      console.error('❌ Error saving contract parts:', pivotError);
      return { success: false, error: pivotError.message };
    }

    console.log(`✅ Successfully saved ${pivotResult.length} contract parts`);
    return { success: true };

  } catch (err) {
    console.error('❌ Unexpected error saving contract parts:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Update contract part order in pivot table
 * @param {number} contractId - The contract ID
 * @param {number} contractpartId - The contract part ID
 * @param {number} newOrderIndex - The new order index
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateContractPartOrder = async (contractId, contractpartId, newOrderIndex) => {
  try {
    const { error } = await supabase
      .from('contract_contractpart')
      .update({ 
        order_index: newOrderIndex,
        updated_at: getPostgresTimestamp()
      })
      .match({
        contract_id: contractId,
        contractpart_id: contractpartId
      });

    if (error) {
      console.error('❌ Error updating contract part order:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Updated contract part ${contractpartId} order to ${newOrderIndex}`);
    return { success: true };

  } catch (err) {
    console.error('❌ Unexpected error updating contract part order:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Add a contract part to a contract
 * @param {number} contractId - The contract ID
 * @param {number} contractpartId - The contract part ID to add
 * @param {number} orderIndex - The order index for the part
 * @param {Object} options - Additional options (is_included, custom_content)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const addContractPartToContract = async (contractId, contractpartId, orderIndex, options = {}) => {
  try {
    const pivotRecord = {
      contract_id: contractId,
      contractpart_id: contractpartId,
      order_index: orderIndex,
      is_included: options.is_included !== undefined ? options.is_included : true,
      custom_content: options.custom_content || null,
      created_at: getPostgresTimestamp(),
      updated_at: getPostgresTimestamp(),
      author_id: options.author_id || 1 // TODO: Get from auth context
    };

    const { error, data } = await supabase
      .from('contract_contractpart')
      .insert(pivotRecord)
      .select()
      .single();

    if (error) {
      console.error('❌ Error adding contract part to contract:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Added contract part ${contractpartId} to contract ${contractId}`);
    return { success: true, data };

  } catch (err) {
    console.error('❌ Unexpected error adding contract part:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Remove a contract part from a contract
 * @param {number} contractId - The contract ID
 * @param {number} contractpartId - The contract part ID to remove
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const removeContractPartFromContract = async (contractId, contractpartId) => {
  try {
    const { error } = await supabase
      .from('contract_contractpart')
      .delete()
      .match({
        contract_id: contractId,
        contractpart_id: contractpartId
      });

    if (error) {
      console.error('❌ Error removing contract part from contract:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Removed contract part ${contractpartId} from contract ${contractId}`);
    return { success: true };

  } catch (err) {
    console.error('❌ Unexpected error removing contract part:', err);
    return { success: false, error: err.message };
  }
};