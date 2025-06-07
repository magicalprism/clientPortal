import { createClient } from '@/lib/supabase/browser';

export async function fetchData(sectionId) {
  const supabase = createClient();

  // Base section fields - fetching ALL fields for maximum template flexibility
  const { data: section, error: sectionError } = await supabase
    .from('section')
    .select(`
      headline, 
      subheadline, 
      body_text,
      eyebrow,
      button_text, 
      button_url, 
      background_image,
      layout_variant,
      contact_info, 
      form_fields, 
      stats, 
      faqs,
      pricing_plans,
      team_members,
      services,
      steps
    `)
    .eq('id', sectionId)
    .single();

  // Pull any associated images from media_section (for hero splits, image blocks, etc.)
  const { data: media, error: mediaError } = await supabase
    .from('media_section')
    .select('media:media_id (url), type, order_index')
    .eq('section_id', sectionId)
    .eq('type', 'image')
    .order('order_index', { ascending: true });

  if (sectionError || mediaError) {
    console.error('[comprehensive] Supabase fetch error:', sectionError || mediaError);
    return section || {};
  }

  return {
    ...section,
    image_url: media?.[0]?.media?.url || null,
    media_items: media || []
  };
}