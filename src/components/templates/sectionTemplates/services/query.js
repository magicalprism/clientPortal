import { createClient } from '@/lib/supabase/browser';

export async function fetchData(sectionId) {
  const supabase = createClient();

  // Base section fields - fetching all fields needed for services grid and process steps
  const { data: section, error: sectionError } = await supabase
    .from('section')
    .select('headline, subheadline, services, steps')
    .eq('id', sectionId)
    .single();

  if (sectionError) {
    console.error('[servicesCombined] Supabase fetch error:', sectionError);
    return section || {};
  }

  return {
    ...section
  };
}