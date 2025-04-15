export function hydrateRelationshipLabels(record, config) {
    if (!record || !config?.fields) return record;
  
    config.fields.forEach(field => {
      if (
        field.type === 'relationship' &&
        field.relation?.table &&
        field.relation?.labelField
      ) {
        const related = record[field.relation.table];
        const label = related?.[field.relation.labelField];
        if (label) {
          record[`${field.name}_label`] = label;
        }
      }
    });
  
    return record;
  }
  