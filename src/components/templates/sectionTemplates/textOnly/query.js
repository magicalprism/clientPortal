import { createClient } from '@/lib/supabase/browser';

export async function fetchData(sectionId) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('section')
    .select('eyebrow, headline, body_text')
    .eq('id', sectionId)
    .single();

  if (error) {
    console.error('[textOnly] Error fetching section:', error);
    return {};
  }

  return data;
}
