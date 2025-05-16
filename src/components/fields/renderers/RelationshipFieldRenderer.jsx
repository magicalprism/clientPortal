'use client';

import { useEffect, useState } from 'react';
import { Typography } from '@mui/material';
import { RelationshipField } from '@/components/fields/RelationshipField';

export const RelationshipFieldRenderer = ({
  value,
  field,
  record,
  config,
  editable = false,
  isEditing = false,
  onChange = () => {}
}) => {
  const labelField = field.relation?.labelField || 'title';
  const relatedKey = field.name.replace('_id', ''); // e.g., company_id -> company
  const relatedLabel = record?.[relatedKey]?.[labelField];

  const [localValue, setLocalValue] = useState(value ?? null);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (!isDirty && value !== localValue) {
      setLocalValue(value ?? null);
    }
  }, [value, isDirty, localValue]);

  if (editable || isEditing) {
    return (
      <RelationshipField
        field={{ ...field, parentId: record?.id, parentTable: config?.name }}
        value={localValue}
        editable
        onChange={(val) => {
          setIsDirty(true);
          setLocalValue(val);
          onChange(val);
        }}
        record={record}
      />
    );
  }

  return (
    <Typography variant="body2">
      {relatedLabel || '—'}
    </Typography>
  );
};

export default RelationshipFieldRenderer;

// 🧩 For inclusion in main FieldRenderer switch map
export const RelationshipFieldCase = {
  type: 'relationship',
  Component: RelationshipFieldRenderer
};
