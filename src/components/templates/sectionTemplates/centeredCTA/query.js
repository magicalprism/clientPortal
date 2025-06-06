import { createClient } from '@/lib/supabase/browser';

export async function fetchCenteredCTA(sectionId) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('section')
    .select('headline, body_text, button_text, button_url')
    .eq('id', sectionId)
    .single();

  if (error) {
    console.error('[centeredCTA] Supabase fetch error:', error);
    return {};
  }

  return data;
}
