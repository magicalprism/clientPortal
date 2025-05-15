'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/browser';

export function useCurrentContact() {
  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchContact = async () => {
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError || !userData?.user?.id) {
        console.error('❌ Failed to get Supabase user:', userError);
        setLoading(false);
        return;
      }

      const supabaseUserId = userData.user.id;

      const { data, error } = await supabase
        .from('contact')
        .select('*')
        .eq('supabase_user_id', supabaseUserId)
        .single();

      if (error) {
        console.error('❌ Failed to fetch contact by supabase_user_id:', error);
      } else {
        setContact(data);
      }

      setLoading(false);
    };

    fetchContact();
  }, []);

  return { contact, loading };
}
