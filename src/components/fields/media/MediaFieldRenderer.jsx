'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { UnifiedMediaField } from '@/components/fields/media/components/UnifiedMediaField';

export const MediaFieldRenderer = ({
  value,
  field,
  record,
  config,
  editable = false,
  mode = 'view',
  onChange,
  isEditing = false
}) => {
const normalizedValue = useMemo(() => {
  if (value === undefined) return null;
  return value;
}, [value]);

  const isModal = isEditing;
  const [localValue, setLocalValue] = useState(normalizedValue);

  // ✅ Fix: Sync localValue if normalizedValue changes
  useEffect(() => {
    if (JSON.stringify(localValue) !== JSON.stringify(normalizedValue)) {
      setLocalValue(normalizedValue);
    }
  }, [normalizedValue]);

  const handleChange = (newValue) => {
  setLocalValue(newValue);

  // Prevent upstream propagation if editing in modal
  if (!isModal && onChange) {
    onChange(newValue);
  }
};

  const isEditable = !isModal && (editable || mode === 'create');
  console.log(`[MediaFieldRenderer] Render for: ${field?.name}, value:`, value);

    return (
    <UnifiedMediaField
      field={{ ...field, parentId: record?.id, parentTable: config?.name }}
      value={isModal ? localValue : normalizedValue}
      onChange={handleChange}
      record={record}
      config={config}
      parentId={record?.id}
      readOnly={!isEditable}
    />
  );
};

export default MediaFieldRenderer;
