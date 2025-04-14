// src/components/FieldRenderer.js
export const FieldRenderer = ({ value, field }) => {
    if (field.format) {
      return field.format(value);
    }
  
    switch (field.type) {
      case 'date':
        return new Date(value).toLocaleDateString();
      case 'currency':
        return `$${Number(value).toFixed(2)}`;
      case 'status':
        return value;
      default:
        return value ?? '—';
    }
  };
  