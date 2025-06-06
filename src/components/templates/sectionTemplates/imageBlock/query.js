import { createClient } from '@/lib/supabase/browser';

export async function fetchData(sectionId) {
  const supabase = createClient();

  // Base section fields
  const { data: section, error: sectionError } = await supabase
    .from('section')
    .select('headline, body_text, button_text, button_url, layout_variant')
    .eq('id', sectionId)
    .single();

  // Pull the primary image from media_section (type = 'image')
  const { data: media, error: mediaError } = await supabase
    .from('media_section')
    .select('media:media_id (url)')
    .eq('section_id', sectionId)
    .eq('type', 'image')
    .order('order_index', { ascending: true })
    .limit(1);

  if (sectionError || mediaError) {
    console.error('[imageBlock] Supabase fetch error:', sectionError || mediaError);
    return section || {};
  }

  return {
    ...section,
    image_url: media?.[0]?.media?.url || null
  };
}
