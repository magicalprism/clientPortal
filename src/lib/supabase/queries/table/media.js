import { createClient } from '@/lib/supabase/browser';
const supabase = createClient();

/**
 * Fetch a single media item by ID
 */
export const fetchMediaById = async (id) => {
  return await supabase
    .from('media')
    .select('*')
    .eq('id', id)
    .single();
};
