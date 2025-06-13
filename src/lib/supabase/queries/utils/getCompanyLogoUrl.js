import { createClient } from '@/lib/supabase/browser';

/**
 * Fetches the company logo URL from joined details or Supabase media.
 */
export async function getCompanyLogoUrl(record) {
  const supabase = createClient();

  let companyId = null;
  let companyData = null;

  if (record?.company_id) {
    companyId = record.company_id;
    companyData = record.company_id_details;
  }

  if (!companyId && record?.companies_details?.length > 0) {
    companyData = record.companies_details[0];
    companyId = companyData?.id;
  }

  if (!companyId && record?.companies?.length > 0) {
    companyId = record.companies[0];
  }

  if (!companyId) return null;

  if (companyData?.thumbnail_id_details?.url) {
    return companyData.thumbnail_id_details.url;
  }

  if (companyData?.thumbnail_id) {
    const { data: media, error } = await supabase
      .from('media')
      .select('url')
      .eq('id', companyData.thumbnail_id)
      .single();

    if (!error && media?.url) {
      return media.url;
    }
  }

  return null;
}
