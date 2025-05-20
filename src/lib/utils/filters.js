export function resolveDynamicFilter(filter = {}, record = {}) {
  const resolved = {};

  for (const [key, val] of Object.entries(filter)) {
    if (typeof val === 'string') {
      const actualValue = val.replace(/{{\s*record\.([\w]+)\s*}}/g, (_, fieldName) => {
        return record?.[fieldName] ?? '';
      });
      resolved[key] = actualValue;
    } else {
      resolved[key] = val;
    }
  }

  return resolved;
}

export async function fetchResolvedFilter({ supabase, field, parentId }) {
  const {
    filterFrom,
    filter: rawFilter,
    filterReferenceKey,
    junctionTable,
    targetKey,
    sourceKey
  } = field.relation || {};

  console.log('[fetchResolvedFilter] Check config:', {
    filterFrom,
    rawFilter,
    parentId
  });

  if (!filterFrom || !rawFilter || !parentId) {
    console.warn('[fetchResolvedFilter] Missing required inputs. Aborting.');
    return {};
  }

  // 👇🏽 use parentId directly — don’t lookup from junction
  let lookupId = parentId;

  // 👇🏽 only use junction table when filterFrom is NOT same as current parent
  const shouldUseJunction =
    filterReferenceKey &&
    junctionTable &&
    sourceKey &&
    targetKey &&
    filterFrom !== 'task'; // <- customize if needed

  if (shouldUseJunction) {
    const { data: junctionRows, error } = await supabase
      .from(junctionTable)
      .select(targetKey)
      .eq(sourceKey, parentId);

    if (error) {
      console.error('[fetchResolvedFilter] Failed to fetch junction rows:', error);
      return {};
    }

    if (!junctionRows || junctionRows.length === 0) {
      console.warn('[fetchResolvedFilter] No matching junction rows found');
      return {};
    }

    // Pick first match – adjust if needed
    lookupId = junctionRows[0]?.[targetKey];
  }

  const { data, error } = await supabase
    .from(filterFrom)
    .select('*')
    .eq('id', lookupId)
    .maybeSingle();

  console.log('[fetchResolvedFilter] fetched record from filterFrom', data);

  if (error || !data) {
    console.warn('[fetchResolvedFilter] Failed to fetch record from filterFrom:', error);
    return {};
  }

  const resolved = resolveDynamicFilter(rawFilter, data);
const hasUnresolved = Object.values(resolved).some(val =>
  typeof val === 'string' && val.includes('{{')
);

if (hasUnresolved) {
  console.warn('[fetchResolvedFilter] Skipping fetch: unresolved template in filter');
  return {};
}
}


  






  export function applyDynamicRelationFilters(value, record, filter) {
    if (!filter || !value) return value;
  
    for (const [key, template] of Object.entries(filter)) {
      // Replace all {{record.field}} with record[field] dynamically
      const resolved = template.replace(/{{record\.([\w]+)}}/g, (_, fieldName) => {
        return record[fieldName] ?? '';
      });
  
      // If filter doesn't match the related value, skip it
      if (value[key]?.toString() !== resolved.toString()) {
        return null;
      }
    }
  
    return value;
  }
  