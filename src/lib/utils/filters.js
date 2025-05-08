export function resolveDynamicFilter(filter = {}, record = {}) {
    const resolved = {};
  
    for (const [key, val] of Object.entries(filter)) {
      if (typeof val === 'string') {
        // Replace {{record.field}} in strings
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
  