'use client';

import { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import { ColorField } from '@/components/fields/ColorField';

/**
 * Renders a color field for both view and edit modes with prop sync guard
 */
export const ColorFieldRenderer = ({
  value,
  field,
  record,
  editable = false,
  mode = 'view',
  onChange = () => {}
}) => {
  const isEditMode = editable || mode === 'create';
  const [localValue, setLocalValue] = useState(value ?? '#000000');
  const [isDirty, setIsDirty] = useState(false);

  // Keep in sync unless dirty
  useEffect(() => {
    const normalized = value ?? '#000000';
    if (!isDirty && normalized !== localValue) {
      setLocalValue(normalized);
    }
  }, [value, localValue, isDirty]);

  // Reset dirty if value matches
  useEffect(() => {
    const normalized = value ?? '#000000';
    if (isDirty && normalized === localValue) {
      setIsDirty(false);
    }
  }, [value, localValue, isDirty]);

  if (!isEditMode) {
    return (
      <Box
        sx={{
          width: 24,
          height: 24,
          borderRadius: '50%',
          backgroundColor: localValue,
          border: '1px solid #ccc',
          display: 'inline-block'
        }}
        title={localValue || 'No color'}
      />
    );
  }

  return (
    <ColorField
      value={localValue}
      onChange={(newColor) => {
        setIsDirty(true);
        setLocalValue(newColor);
        onChange(newColor);
      }}
    />
  );
};

export default ColorFieldRenderer;

// 🧩 For inclusion in main FieldRenderer switch map
export const ColorFieldCase = {
  type: 'color',
  Component: ColorFieldRenderer
};
