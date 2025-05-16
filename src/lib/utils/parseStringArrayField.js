export const parseStringArrayField = (record, field = 'tags') => {
  if (!record) return record;
  const result = { ...record };
  const value = result[field];

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        result[field] = parsed.map(String);
        return result;
      }
    } catch {
      if (value.includes(',')) {
        result[field] = value.split(',').map(tag => tag.trim()).filter(Boolean);
        return result;
      }
    }
    result[field] = value ? [String(value)] : [];
  } else if (!Array.isArray(value)) {
    result[field] = value ? [String(value)] : [];
  }

  return result;
};
