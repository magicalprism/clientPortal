export const generateSupabaseSelect = (fields = []) => {
  const baseFields = [];
  const nestedMap = {};

  for (const field of fields) {
    if (field.includes('.')) {
      const [alias, subfield] = field.split('.');
      const fk = alias.replace('_details', '');

      if (!nestedMap[alias]) {
        nestedMap[alias] = { fk, fields: new Set() };
      }

      nestedMap[alias].fields.add(subfield);
    } else {
      baseFields.push(field);
    }
  }

  const nestedSelects = Object.entries(nestedMap).map(([alias, { fk, fields }]) => {
    return `${alias}:${fk} (${[...fields].join(', ')})`;
  });

  return [...baseFields, ...nestedSelects].join(', ');
};
