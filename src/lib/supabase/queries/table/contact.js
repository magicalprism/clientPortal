import { createClient } from '@/lib/supabase/browser';
const supabase = createClient();

export const fetchContactById = async (id) => {
  return await supabase
    .from('contact')
    .select('*')
    .eq('id', id)
    .single();
};

export const getCurrentContactId = async () => {
  const supabase = createClient();

  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) return null;

  const { data: contact, error: contactError } = await supabase
    .from('contact')
    .select('id')
    .eq('email', user.email)
    .single();

  if (contactError || !contact) return null;

  return contact.id;
};