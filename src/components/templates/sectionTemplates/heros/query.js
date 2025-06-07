import { createClient } from '@/lib/supabase/browser';

export async function fetchData(sectionId) {
  const supabase = createClient();

  // Base section fields - fetching all fields needed for banner, split, and minimal heroes
  const { data: section, error: sectionError } = await supabase
    .from('section')
    .select('eyebrow, headline, subheadline, button_text, button_url, background_image, layout_variant')
    .eq('id', sectionId)
    .single();

  // Pull the hero image from media_section for split hero (type = 'image')
  const { data: media, error: mediaError } = await supabase
    .from('media_section')
    .select('media:media_id (url)')
    .eq('section_id', sectionId)
    .eq('type', 'image')
    .order('order_index', { ascending: true })
    .limit(1);

  if (sectionError || mediaError) {
    console.error('[heroCombined] Supabase fetch error:', sectionError || mediaError);
    return section || {};
  }

  return {
    ...section,
    image_url: media?.[0]?.media?.url || null
  };
}