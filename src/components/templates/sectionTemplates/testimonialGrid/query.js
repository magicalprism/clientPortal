import { createClient } from '@/lib/supabase/browser';

export async function fetchData(sectionId) {
  const supabase = createClient();

  // Base section fields
  const { data: section, error: sectionError } = await supabase
    .from('section')
    .select('headline, subheadline, content, layout_variant')
    .eq('id', sectionId)
    .single();

  // Get testimonial media items
  const { data: media, error: mediaError } = await supabase
    .from('media_section')
    .select('media:media_id (id, title, url)')
    .eq('section_id', sectionId)
    .eq('type', 'testimonial')
    .order('order_index', { ascending: true });

  if (sectionError || mediaError) {
    console.error('[testimonialGrid] Supabase fetch error:', sectionError || mediaError);
    return section || {};
  }

  return {
    ...section,
    testimonials: media || []
  };
}