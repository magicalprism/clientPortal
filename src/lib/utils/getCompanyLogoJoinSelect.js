/**
 * Builds a dynamic Supabase `select()` string that includes the company logo
 * via `company.thumbnail.url`, **only if** `company_id` is defined as a relationship field.
 *
 * This is used in calendar views and other components that display the company logo
 * alongside records (e.g. tasks, projects) that are associated with a company.
 *
 * If `company_id` is not a relationship field in the config, returns just '*'.
 *
 * @param {Object} config - The collection config object (should contain `fields`)
 * @returns {string} Supabase-compatible `select()` string
 */
export function getCompanyLogoJoinSelect(config) {
  const hasCompanyRelation = config?.fields?.some(
    (field) => field.name === 'company_id' && field.type === 'relationship'
  );

  if (!hasCompanyRelation) {
    return '*'; // No join needed
  }

  return `
    *,
    company:company_id (
  id,
  media:thumbnail_id (
    id,
    url
  )
)
  `;
}


export default getCompanyLogoJoinSelect;