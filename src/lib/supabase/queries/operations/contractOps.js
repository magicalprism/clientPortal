// lib/supabase/queries/pivot/contract_contractpart.js

import { createClient } from '@/lib/supabase/browser';
import { getPostgresTimestamp } from '@/lib/utils/getPostgresTimestamp';

const supabase = createClient();

/**
 * Fetch all contract parts for a specific contract
 */
export const fetchContractPartsForContract = async (contractId) => {
  try {
    console.log(`[contractOps] Fetching contract parts for contract ${contractId}`);

    const { data, error } = await supabase
      .from('contract_contractpart')
      .select(`
        id,
        order_index,
        contract_id,
        contractpart_id,
        created_at,
        updated_at,
        contractpart:contractpart_id(
          id,
          title,
          content,
          type,
          required,
          category
        )
      `)
      .eq('contract_id', contractId)
      .order('order_index', { ascending: true });

    if (error) {
      console.error(`[contractOps] Error fetching contract parts:`, error);
      return { success: false, error: error.message, data: null };
    }

    // Transform the data to flatten the nested structure
    const contractParts = data?.map(item => ({
      id: item.contractpart?.id,
      title: item.contractpart?.title,
      content: item.contractpart?.content,
      type: item.contractpart?.type,
      required: item.contractpart?.required,
      category: item.contractpart?.category,
      order_index: item.order_index,
      pivot_id: item.id,
      contract_id: item.contract_id
    })) || [];

    console.log(`[contractOps] Successfully fetched ${contractParts.length} contract parts`);
    return { success: true, error: null, data: contractParts };

  } catch (err) {
    console.error(`[contractOps] Unexpected error fetching contract parts:`, err);
    return { success: false, error: err.message, data: null };
  }
};

/**
 * Save all contract parts for a contract (handles reordering and updates)
 */
export const saveContractPartsForContract = async (contractId, contractParts) => {
  try {
    console.log(`[contractOps] Saving ${contractParts.length} contract parts for contract ${contractId}`);

    if (!contractParts || contractParts.length === 0) {
      console.log(`[contractOps] No contract parts to save`);
      return { success: true, error: null };
    }

    const errors = [];
    const results = [];

    // Process each contract part
    for (let i = 0; i < contractParts.length; i++) {
      const part = contractParts[i];
      
      try {
        // Update the order_index in the pivot table
        const { error: updateError } = await supabase
          .from('contract_contractpart')
          .update({
            order_index: i,
            updated_at: getPostgresTimestamp()
          })
          .eq('contract_id', contractId)
          .eq('contractpart_id', part.id);

        if (updateError) {
          console.error(`[contractOps] Error updating part ${part.id}:`, updateError);
          errors.push({ partId: part.id, error: updateError.message });
        } else {
          results.push({ partId: part.id, orderIndex: i });
        }

        // If the part has content changes, update the contractpart table
        if (part.content !== undefined) {
          const { error: contentError } = await supabase
            .from('contractpart')
            .update({
              content: part.content,
              updated_at: getPostgresTimestamp()
            })
            .eq('id', part.id);

          if (contentError) {
            console.error(`[contractOps] Error updating part content ${part.id}:`, contentError);
            errors.push({ partId: part.id, error: contentError.message, type: 'content' });
          }
        }

        // If the part has title changes, update the contractpart table
        if (part.title !== undefined) {
          const { error: titleError } = await supabase
            .from('contractpart')
            .update({
              title: part.title,
              updated_at: getPostgresTimestamp()
            })
            .eq('id', part.id);

          if (titleError) {
            console.error(`[contractOps] Error updating part title ${part.id}:`, titleError);
            errors.push({ partId: part.id, error: titleError.message, type: 'title' });
          }
        }

      } catch (partErr) {
        console.error(`[contractOps] Unexpected error processing part ${part.id}:`, partErr);
        errors.push({ partId: part.id, error: partErr.message });
      }
    }

    const allSuccessful = errors.length === 0;
    
    console.log(`[contractOps] Contract parts save completed. ${results.length} successful, ${errors.length} errors`);
    
    return { 
      success: allSuccessful, 
      error: errors.length > 0 ? `${errors.length} parts failed to save` : null,
      results,
      errors 
    };

  } catch (err) {
    console.error(`[contractOps] Unexpected error saving contract parts:`, err);
    return { success: false, error: err.message };
  }
};

/**
 * Add an existing contract part to a contract
 */
export const addContractPartToContract = async (contractId, contractPartId, orderIndex = null) => {
  try {
    console.log(`[contractOps] Adding contract part ${contractPartId} to contract ${contractId}`);

    // If no order index provided, get the next available one
    if (orderIndex === null) {
      const { data: existingParts } = await supabase
        .from('contract_contractpart')
        .select('order_index')
        .eq('contract_id', contractId)
        .order('order_index', { ascending: false })
        .limit(1);

      orderIndex = (existingParts?.[0]?.order_index || -1) + 1;
    }

    const { data, error } = await supabase
      .from('contract_contractpart')
      .insert([{
        contract_id: contractId,
        contractpart_id: contractPartId,
        order_index: orderIndex,
        created_at: getPostgresTimestamp(),
        updated_at: getPostgresTimestamp()
      }])
      .select(`
        id,
        order_index,
        contractpart:contractpart_id(
          id,
          title,
          content,
          type,
          required,
          category
        )
      `)
      .single();

    if (error) {
      console.error(`[contractOps] Error adding contract part:`, error);
      return { success: false, error: error.message, data: null };
    }

    console.log(`[contractOps] Successfully added contract part`);
    return { success: true, error: null, data };

  } catch (err) {
    console.error(`[contractOps] Unexpected error adding contract part:`, err);
    return { success: false, error: err.message, data: null };
  }
};

/**
 * Remove a contract part from a contract
 */
export const removeContractPartFromContract = async (contractId, contractPartId) => {
  try {
    console.log(`[contractOps] Removing contract part ${contractPartId} from contract ${contractId}`);

    const { error } = await supabase
      .from('contract_contractpart')
      .delete()
      .eq('contract_id', contractId)
      .eq('contractpart_id', contractPartId);

    if (error) {
      console.error(`[contractOps] Error removing contract part:`, error);
      return { success: false, error: error.message };
    }

    console.log(`[contractOps] Successfully removed contract part`);
    return { success: true, error: null };

  } catch (err) {
    console.error(`[contractOps] Unexpected error removing contract part:`, err);
    return { success: false, error: err.message };
  }
};

/**
 * Create a new custom contract part and add it to a contract
 */
export const createCustomContractPart = async (contractId, title, content = '', type = 'custom') => {
  try {
    console.log(`[contractOps] Creating custom contract part for contract ${contractId}`);

    // First create the contract part
    const { data: newPart, error: createError } = await supabase
      .from('contractpart')
      .insert([{
        title,
        content,
        type,
        required: false,
        category: 'custom',
        created_at: getPostgresTimestamp(),
        updated_at: getPostgresTimestamp()
      }])
      .select()
      .single();

    if (createError) {
      console.error(`[contractOps] Error creating contract part:`, createError);
      return { success: false, error: createError.message, data: null };
    }

    // Then add it to the contract
    const addResult = await addContractPartToContract(contractId, newPart.id);
    
    if (!addResult.success) {
      // If adding to contract failed, clean up the created part
      await supabase.from('contractpart').delete().eq('id', newPart.id);
      return addResult;
    }

    console.log(`[contractOps] Successfully created and added custom contract part`);
    return { success: true, error: null, data: { ...newPart, pivot: addResult.data } };

  } catch (err) {
    console.error(`[contractOps] Unexpected error creating custom contract part:`, err);
    return { success: false, error: err.message, data: null };
  }
};

/**
 * Get all available contract parts that can be added to contracts
 */
export const fetchAvailableContractParts = async () => {
  try {
    console.log(`[contractOps] Fetching available contract parts`);

    const { data, error } = await supabase
      .from('contractpart')
      .select('*')
      .order('category', { ascending: true })
      .order('title', { ascending: true });

    if (error) {
      console.error(`[contractOps] Error fetching available contract parts:`, error);
      return { success: false, error: error.message, data: null };
    }

    console.log(`[contractOps] Successfully fetched ${data?.length || 0} available contract parts`);
    return { success: true, error: null, data: data || [] };

  } catch (err) {
    console.error(`[contractOps] Unexpected error fetching available contract parts:`, err);
    return { success: false, error: err.message, data: null };
  }
};