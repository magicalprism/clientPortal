import { createClient } from '@/lib/supabase/browser';

export async function fetchTestimonialsForSection(sectionId) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('section_testimonial')
    .select(`
      testimonial: testimonial_id (
        title,
        role,
        company,
        quote,
        avatar_url,
        video_url,
        rating
      )
    `)
    .eq('section_id', sectionId)
    .order('order_index', { ascending: true });

  if (error) {
    console.error(error);
    return [];
  }

  return data.map(({ testimonial }) => testimonial);
}
