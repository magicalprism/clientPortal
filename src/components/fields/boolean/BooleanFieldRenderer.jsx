'use client';

import { useEffect, useState } from 'react';
import { Typography, Switch, FormControlLabel } from '@mui/material';

/**
 * BooleanFieldRenderer handles rendering and editing for boolean (switch) fields
 */
export default function BooleanFieldRenderer({
  value,
  field,
  editable = false,
  isEditing = false,
  mode = 'view',
  onChange = () => {},
}) {
  const [localValue, setLocalValue] = useState(Boolean(value));
  const isEditMode = editable || mode === 'create';

  useEffect(() => {
    setLocalValue(Boolean(value));
  }, [value]);

  const handleToggle = (e) => {
    const newVal = e.target.checked;
    setLocalValue(newVal);
    onChange(newVal);
  };

  return isEditMode ? (
    <FormControlLabel
      control={<Switch checked={localValue} onChange={handleToggle} />}
      label=""
    />
  ) : (
    <Typography variant="body2">{localValue ? 'Yes' : 'No'}</Typography>
  );
}

// 🧩 Export the case for centralized use
export const BooleanFieldCase = {
  type: 'boolean',
  Component: BooleanFieldRenderer,
};
