'use client';

import { useEffect, useState } from 'react';
import { isIncludedInView } from '@/lib/utils/isIncludedInView';
import { getRendererForField } from '@/components/fields/index';

export const FieldRenderer = ({
  value,
  field,
  record,
  config,
  view = 'default',
  mode = 'view',
  editable = false,
  isEditing = false,
  onChange = () => {},
}) => {
  const [localValue, setLocalValue] = useState(value);
  const isEditMode = editable || mode === 'create';

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  if (!isIncludedInView(field, view)) return null;
  if (field.format) return field.format(localValue, field, record);

  const handleUpdate = (newValue) => {
    setLocalValue(newValue);
    onChange(newValue);
  };

  const RendererComponent = getRendererForField(field.type);
  

  if (!RendererComponent) return null;

  return (
    <RendererComponent
      value={localValue}
      field={field}
      record={record}
      config={config}
      editable={editable}
      isEditing={isEditing}
      mode={mode}
      onChange={handleUpdate}
    />
  );
};
