'use client';

import { useEffect, useState } from 'react';
import { Typography } from '@mui/material';
import { MultiRelationshipField } from '@/components/fields/relationships/multi/MultiRelationshipField';
import normalizeMultiRelationshipValue from '@/lib/utils/normalizeMultiRelationshipValue';

export const MultiRelationshipFieldRenderer = ({
  value,
  field,
  record,
  config,
  editable = false,
  isEditing = false,
  onChange = () => {},
}) => {
  const labelField = field.relation?.labelField || 'title';
  const details = record?.[`${field.name}_details`] || [];

  const [localValue, setLocalValue] = useState(normalizeMultiRelationshipValue(value));
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    const normalized = normalizeMultiRelationshipValue(value);
    if (!isDirty && JSON.stringify(localValue) !== JSON.stringify(normalized)) {
      setLocalValue(normalized);
    }
  }, [value, isDirty, localValue]);

  if (!editable) {
    if (!Array.isArray(details) || details.length === 0) {
      return <Typography variant="body2">—</Typography>;
    }

    const labels = details.map((item) => item[labelField] || `ID: ${item.id}`);
    return (
      <Typography variant="body2">
        {labels.join(', ')}
      </Typography>
    );
  }

  return (
    <MultiRelationshipField
      field={{ ...field, parentId: record?.id, parentTable: config?.name }}
      value={localValue}
      onChange={(val) => {
        setIsDirty(true);
        setLocalValue(val.ids || []);
        onChange(val); // should be { ids, details }
      }}
    />
  );
};

export default MultiRelationshipFieldRenderer;

// 🧩 For inclusion in main FieldRenderer switch map
export const MultiRelationshipFieldCase = {
  type: 'multiRelationship',
  Component: MultiRelationshipFieldRenderer
};
