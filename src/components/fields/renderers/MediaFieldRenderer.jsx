'use client';

import { useEffect, useState } from 'react';
import { MediaField } from '@/components/fields/media/MediaField';

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
  
  // Debug logs
  useEffect(() => {
    console.log('MediaFieldRenderer rendered with:', {
      value,
      localValue,
      fieldName: field?.name,
      editable: isEditable,
      mode
    });
  }, [value, localValue, field, isEditable, mode]);

  // Sync from external value unless we have local changes
  useEffect(() => {
    if (!isDirty && value !== localValue) {
      console.log('MediaFieldRenderer syncing value:', value);
      setLocalValue(value ?? null);
    }
  }, [value, localValue, isDirty]);

  const handleChange = (newId) => {
    console.log('MediaFieldRenderer handleChange:', newId);
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

// For inclusion in main FieldRenderer switch map
export const MediaFieldCase = {
  type: 'media',
  Component: MediaFieldRenderer
};