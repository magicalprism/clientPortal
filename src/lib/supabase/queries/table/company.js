import { createClient } from '@/lib/supabase/browser';
const supabase = createClient();

/**
 * Fetch a single company by ID
 */
export const fetchCompanyById = async (id) => {
  return await supabase
    .from('company')
    .select('*')
    .eq('id', id)
    .single();
};
