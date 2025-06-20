'use client';

import { useEffect, useState } from 'react';
import { Typography, Box } from '@mui/material';
import { ViewButtons } from '@/components/buttons/ViewButtons';
import { RelationshipField } from '@/components/fields/relationships/RelationshipField';
import * as collections from '@/collections';

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
  const relatedRecord = record?.[relatedKey];

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

  // If we have a value and related record, show the label with ViewButtons
  if (value && relatedRecord) {
    // Get the related collection config
    const relatedConfig = field.relation?.table ? collections[field.relation.table] : null;
    
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="body2">
          {relatedLabel || `ID: ${value}`}
        </Typography>
        
        {relatedConfig && (
          <ViewButtons
            config={relatedConfig}
            id={value}
            record={relatedRecord}
            size="small"
            showDelete={false}
          />
        )}
      </Box>
    );
  }

  // Otherwise, just show the text
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
