import { createClient } from '@/lib/supabase/browser';

export async function fetchData(sectionId) {
  const supabase = createClient();

  // Base section fields
  const { data: section, error: sectionError } = await supabase
    .from('section')
    .select('headline, subheadline, button_text, button_url, layout_variant')
    .eq('id', sectionId)
    .single();

  if (sectionError) {
    console.error('[centeredCTA] Supabase fetch error:', sectionError);
    return section || {};
  }

  return {
    ...section
  };
}