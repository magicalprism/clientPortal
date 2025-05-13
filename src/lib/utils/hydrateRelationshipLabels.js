export function hydrateRelationshipLabels(record, config) {
  if (!record || !config?.fields) return record;

  const hydrated = { ...record };

  config.fields.forEach(field => {
    // 🔗 1. Handle single relationship
    if (field.type === 'relationship' && field.relation?.table && field.relation?.labelField) {
      const related = hydrated[field.relation.table];
      const label = related?.[field.relation.labelField];
      if (label) {
        hydrated[`${field.name}_label`] = label;
      }
    }

    // 🔗 2. Handle multi-relationship
    if (field.type === 'multiRelationship' && Array.isArray(hydrated[field.name])) {
      const items = hydrated[field.name];
      const labelField = field.relation?.labelField || 'title';

      // 💬 Create label array (basic fallback)
      hydrated[`${field.name}_labels`] = items.map(rel =>
        rel?.[labelField] || `ID: ${rel?.id}`
      );

      // 📦 Also create `_details` if record objects exist
      const detailedRecords = items.filter(rel => typeof rel === 'object' && rel !== null);
      if (detailedRecords.length > 0) {
        hydrated[`${field.name}_details`] = detailedRecords.map(rel => ({
          id: rel.id,
          [labelField]: rel[labelField],
          ...rel
        }));
      }
    }

  if (field.type === 'repeater' && Array.isArray(hydrated[field.name])) {
    const labelField = field.relation?.labelField || 'title';
    hydrated[`${field.name}_details`] = hydrated[field.name].map((item) => ({
      id: item.id,
      [labelField]: item[labelField],
      ...item,
    }));
  }
});

  return hydrated;
}
