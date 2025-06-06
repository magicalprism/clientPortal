import { createClient } from '@/lib/supabase/browser';

export async function fetchData(sectionId) {
  const supabase = createClient();

  // Fetch basic section content
  const { data: section, error: sectionError } = await supabase
    .from('section')
    .select('headline, subheadline, body_text')
    .eq('id', sectionId)
    .single();

  if (sectionError) {
    console.error('[imageTop] Error fetching section:', sectionError);
    return {};
  }

  // Pull top image from media_section pivot
  const { data: media, error: mediaError } = await supabase
    .from('media_section')
    .select('media:media_id (url)')
    .eq('section_id', sectionId)
    .eq('type', 'image')
    .order('order_index', { ascending: true })
    .limit(1);

  if (mediaError) {
    console.error('[imageTop] Error fetching media:', mediaError);
  }

  const image_url = media?.[0]?.media?.url || null;

  return {
    ...section,
    image_url
  };
}
