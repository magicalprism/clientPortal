'use client';

import { useEffect, useState } from 'react';
import { GalleryRelationshipField } from '@/components/fields/media/GalleryRelationshipField';

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
  }, [value, isDirty]);

  const handleChange = (newValue) => {
    setIsDirty(true);
    setLocalValue(newValue);
    
    if (onChange && typeof onChange === 'function') {
      try {
        // Call onChange in next tick to ensure proper React batching
        setTimeout(() => {
          onChange(newValue);
        }, 0);
      } catch (error) {
        console.error(`[GalleryRelationshipFieldRenderer] ${field?.name} onChange error:`, error);
      }
    }
  };

  return (
    <GalleryRelationshipField
      field={field}
      record={record}
      config={config}
      value={localValue}
      onChange={handleChange}
      editable={isEditable}
    />
  );
};

export default GalleryRelationshipFieldRenderer;

// For dynamic switch maps
export const GalleryRelationshipFieldCase = {
  type: 'galleryRelationship',
  Component: GalleryRelationshipFieldRenderer
};