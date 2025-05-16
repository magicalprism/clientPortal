'use client';

import { useState, useEffect } from 'react';
import { Typography } from '@mui/material';
import { TimestampField } from '@/components/fields/TimestampField';

export const TimestampFieldRenderer = ({
  value,
  field,
  editable = false,
  mode = 'view',
  onChange = () => {}
}) => {
  const isEditable = editable || mode === 'create';
  const [localValue, setLocalValue] = useState(value || null);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    const newValue = value || null;
    if (!isDirty && newValue !== localValue) {
      setLocalValue(newValue);
    }
  }, [value, isDirty, localValue]);

  useEffect(() => {
    const newValue = value || null;
    if (isDirty && newValue === localValue) {
      setIsDirty(false);
    }
  }, [value, isDirty, localValue]);

  if (!isEditable) {
    return (
      <Typography variant="body2">
        {localValue ? new Date(localValue).toLocaleString() : '—'}
      </Typography>
    );
  }

  return (
    <TimestampField
      field={field}
      value={localValue}
      editable={isEditable}
      mode={mode}
      onChange={(f, newValue) => {
        setIsDirty(false);
        setLocalValue(newValue);
        onChange(newValue);
      }}
    />
  );
};

export default  TimestampFieldRenderer;

// 🧩 Field case for dynamic renderer registration
export const TimestampFieldCase = {
  type: 'timestamp',
  Component: TimestampFieldRenderer
};
