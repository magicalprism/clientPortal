import { createClient } from '@/lib/supabase/browser';

export async function fetchData(sectionId) {
  const supabase = createClient();

  // Fetch the headline from the section
  const { data: section, error: sectionError } = await supabase
    .from('section')
    .select('headline')
    .eq('id', sectionId)
    .single();

  if (sectionError) {
    console.error('[logoBar] Error fetching section:', sectionError);
    return {};
  }

  // Get all related logos or image links from pivot
  const { data: media, error: mediaError } = await supabase
    .from('media_section')
    .select('media:media_id (url, alt_text, external_url)')
    .eq('section_id', sectionId)
    .in('type', ['logo', 'image'])
    .order('order_index', { ascending: true });

  if (mediaError) {
    console.error('[logoBar] Error fetching media:', mediaError);
  }

  const images = (media || []).map(item => ({
    url: item.media?.url,
    alt: item.media?.alt_text,
    link: item.media?.external_url
  }));

  return {
    ...section,
    images
  };
}
