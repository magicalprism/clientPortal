'use client';

import React, { useState, useEffect } from 'react';
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
  const [localValue, setLocalValue] = useState(value);

  // Sync with incoming value changes
  useEffect(() => {
    if (JSON.stringify(localValue) !== JSON.stringify(value)) {
      setLocalValue(value);
    }
  }, [value, localValue]);

  const handleChange = (newValue) => {
    // Update local state immediately
    setLocalValue(newValue);
    
    // Propagate changes up to parent
    if (onChange) {
      onChange(newValue);
    }
  };

  const isEditable = editable || mode === 'create';

  return (
    <UnifiedMediaField
      field={{ 
        ...field, 
        parentId: record?.id, 
        parentTable: config?.name 
      }}
      value={localValue}
      onChange={handleChange}
      record={record}
      config={config}
      parentId={record?.id}
      readOnly={!isEditable}
    />
  );
};

export default MediaFieldRenderer;