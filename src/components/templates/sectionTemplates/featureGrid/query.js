import { createClient } from '@/lib/supabase/browser';

export async function fetchData(sectionId) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('feature_section')
    .select(`
      feature:feature_id (
        id,
        title,
        description
      )
    `)
    .eq('section_id', sectionId)
    .order('order_index', { ascending: true });

  if (error) {
    console.error('[featureGrid] Supabase fetch error:', error);
    return [];
  }

  return data;
}
