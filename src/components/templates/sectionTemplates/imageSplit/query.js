import { createClient } from '@/lib/supabase/browser';

export async function fetchData(sectionId) {
  const supabase = createClient();

  // Get the section fields
  const { data: section, error: sectionError } = await supabase
    .from('section')
    .select('headline, body_text, button_text, button_url, layout_variant')
    .eq('id', sectionId)
    .single();

  if (sectionError) {
    console.error('[imageSplit] Error fetching section:', sectionError);
    return {};
  }

  // Get the first associated image (order_index = 0)
  const { data: media, error: mediaError } = await supabase
    .from('media_section')
    .select('media:media_id (url)')
    .eq('section_id', sectionId)
    .eq('type', 'image')
    .order('order_index', { ascending: true })
    .limit(1);

  if (mediaError) {
    console.error('[imageSplit] Error fetching media:', mediaError);
  }

  const image_url = media?.[0]?.media?.url || null;

  return {
    ...section,
    image_url
  };
}
