'use client';

import { useState, useEffect } from 'react';
import { TextField, Typography } from '@mui/material';

export const TextFieldRenderer = ({
  value,
  field,
  editable = false,
  isEditing = false,
  onChange = () => {}
}) => {
  const [localValue, setLocalValue] = useState(value || '');
  const [isDirty, setIsDirty] = useState(false);
  const isEditMode = editable;

  // Guard against stale updates
  useEffect(() => {
    const newValue = value || '';
    if (!isDirty && newValue !== localValue) {
      setLocalValue(newValue);
    }
  }, [value, isDirty, localValue]);

  // Reset dirty state if synced externally
  useEffect(() => {
    const newValue = value || '';
    if (isDirty && newValue === localValue) {
      setIsDirty(false);
    }
  }, [value, isDirty, localValue]);

  if (!isEditMode) {
    return (
      <Typography variant="body2">
        {localValue?.toString().trim() || '—'}
      </Typography>
    );
  }

  return (
    <TextField
      fullWidth
      size="small"
      value={localValue}
      onChange={(e) => {
        setLocalValue(e.target.value);
        setIsDirty(true);
      }}
      onBlur={() => {
        onChange(localValue);
        setIsDirty(false);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          onChange(localValue);
          setIsDirty(false);
        }
      }}
      placeholder={field.label || ''}
    />
  );
};

export default TextFieldRenderer;

// 🧩 Field case for dynamic renderer registration
export const TextFieldCase = {
  type: 'text',
  Component: TextFieldRenderer
};
