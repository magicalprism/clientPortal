'use client';

import { useEffect, useState } from 'react';
import { GalleryRelationshipField } from '@/components/fields/relationships/multi/GalleryRelationshipField';

export const GalleryRelationshipFieldRenderer = ({
  value,
  field,
  record,
  config,
  editable = false,
  mode = 'view',
  onChange = () => {}
}) => {
  const isEditable = editable || mode === 'create';
  const [localValue, setLocalValue] = useState(value ?? []);
  const [isDirty, setIsDirty] = useState(false);

useEffect(() => {
  if (!isDirty) {
    setLocalValue(value ?? []);
  }
}, [value]);

  const handleChange = (newValue) => {
    setIsDirty(true);
    setLocalValue(newValue);
    onChange(newValue);
  };

  return (
    <GalleryRelationshipField
      field={field}
      record={record}
      config={config}
      value={localValue}
      onChange={handleChange}
    />
  );
};

export default GalleryRelationshipFieldRenderer;

// 🧩 For dynamic switch maps
export const GalleryRelationshipFieldCase = {
  type: 'galleryRelationship',
  Component: GalleryRelationshipFieldRenderer
};
