import { createClient } from '@/lib/supabase/browser';
const supabase = createClient();

export const fetchContactById = async (id) => {
  return await supabase
    .from('contact')
    .select('*')
    .eq('id', id)
    .single();
};