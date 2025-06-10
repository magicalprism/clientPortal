// lib/supabase/queries/table/contract.js

import { createClient } from '@/lib/supabase/browser';
const supabase = createClient();

/**
 * Updates a contract’s content
 */
export const updateContractContentById = async (id, content) => {
  return await supabase
    .from('contract')
    .update({
      content,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
};