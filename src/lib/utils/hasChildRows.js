// lib/utils/hasChildRows.js

export function hasChildRows(config, row, allRows = []) {
    // Check for multiRelationship fields with _details
    const hasMultiRelChildren = config.fields.some(
      (f) =>
        f.type === 'multiRelationship' &&
        Array.isArray(row[`${f.name}_details`]) &&
        row[`${f.name}_details`].length > 0
    );
  
    // Check for flat child rows via parent_id
    const hasFlatChildren = allRows.some((r) => r.parent_id === row.id);
  
    return hasMultiRelChildren || hasFlatChildren;
  }
  