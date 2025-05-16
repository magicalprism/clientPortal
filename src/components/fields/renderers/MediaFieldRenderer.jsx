'use client';

import { useEffect, useState } from 'react';
import { MediaField } from '@/components/fields/MediaField';

export const MediaFieldRenderer = ({
  value,
  field,
  record,
  config,
  editable = false,
  mode = 'view',
  onChange = () => {}
}) => {
  const isEditable = editable || mode === 'create';
  const [localValue, setLocalValue] = useState(value ?? null);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (!isDirty && value !== localValue) {
      setLocalValue(value ?? null);
    }
  }, [value, localValue, isDirty]);

  const handleChange = (newId) => {
    setIsDirty(true);
    setLocalValue(newId);
    onChange(newId);
  };

  return (
    <MediaField
      field={field}
      record={record}
      config={config}
      value={localValue}
      onChange={handleChange}
    />
  );
};

export default MediaFieldRenderer;

// 🧩 For inclusion in main FieldRenderer switch map
export const MediaFieldCase = {
  type: 'media',
  Component: MediaFieldRenderer
};
