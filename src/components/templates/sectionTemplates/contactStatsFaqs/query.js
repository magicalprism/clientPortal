import { createClient } from '@/lib/supabase/browser';

export async function fetchData(sectionId) {
  const supabase = createClient();

  // Base section fields - fetching all fields needed for contact, stats, and FAQs
  const { data: section, error: sectionError } = await supabase
    .from('section')
    .select('headline, subheadline, contact_info, form_fields, stats, faqs')
    .eq('id', sectionId)
    .single();

  if (sectionError) {
    console.error('[contactStatsFaqs] Supabase fetch error:', sectionError);
    return section || {};
  }

  return {
    ...section
  };
}