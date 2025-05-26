
export const hydrateRecord = async (record, config, supabase) => {
  if (!record || !config?.fields) return record;

  const hydrated = { ...record };

  for (const field of config.fields) {
    const { name, type } = field;

    // Handle tag-style parsing
    if (name === 'tags' && typeof record[name] === 'string') {
      try {
        hydrated[name] = JSON.parse(record[name]);
      } catch {
        hydrated[name] = record[name]
          .split(',')
          .map(tag => tag.trim())
          .filter(Boolean);
      }
    }

    // Handle select/status fields
    if ((type === 'select' || type === 'status') && record[name]) {
      const value = record[name];
      const label = field.options?.find(opt => opt.value === value)?.label || value;
      hydrated[name] = { value, label };
    }

    // Handle media fields - THIS IS THE NEW ADDITION
    if (type === 'media' && field.relation?.table && record[name]) {
      const { data: mediaRecord } = await supabase
        .from('media')
        .select('*')
        .eq('id', record[name])
        .single();

      if (mediaRecord) {
        hydrated[`${name}_details`] = mediaRecord;
      }
    }

    // Handle relationship fields
    if (type === 'relationship' && field.relation?.table && record[name]) {
      const { labelField = 'title', table } = field.relation;
      const { data: related } = await supabase
        .from(table)
        .select(`id, ${labelField}`)
        .eq('id', record[name])
        .single();

      hydrated[`${name}_details`] = related || null;
    }

    // Handle multiRelationship
    if (type === 'multiRelationship' && field.relation?.junctionTable) {
      const {
        junctionTable,
        sourceKey = `${config.name}_id`,
        targetKey,
        table,
        labelField = 'title',
      } = field.relation;

      const { data: junctionData } = await supabase
        .from(junctionTable)
        .select(targetKey)
        .eq(sourceKey, record.id);

      const ids = junctionData?.map(row => row[targetKey]) || [];

      hydrated[name] = ids;

      if (ids.length > 0) {
        const { data: details } = await supabase
          .from(table)
          .select(`id, ${labelField}`)
          .in('id', ids);

        hydrated[`${name}_details`] = details || [];
      } else {
        hydrated[`${name}_details`] = [];
      }
    }
  }

  return hydrated;
};