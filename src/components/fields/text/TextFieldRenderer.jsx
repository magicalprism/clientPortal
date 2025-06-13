'use client';

import { useState, useEffect } from 'react';
import { TextField, Typography } from '@mui/material';

export const TextFieldRenderer = ({
  value,
  field,
  config = {},
  editable = false,
  isEditing = false,
  onChange = () => {}
}) => {
  const [localValue, setLocalValue] = useState(value || '');
  const [isDirty, setIsDirty] = useState(false);
  const isEditMode = editable;
  
  // Extract lines from field or config, default to 1
  const lines = field.lines || config.lines || 1;
  const isMultiline = lines > 1;

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
      <Typography 
        variant="body2"
        sx={{ 
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word'
        }}
      >
        {localValue?.toString().trim() || '—'}
      </Typography>
    );
  }

  return (
    <TextField
      fullWidth
      size="small"
      multiline={isMultiline}
      rows={isMultiline ? lines : undefined}
      maxRows={isMultiline ? Math.max(lines, 10) : undefined}
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
        if (e.key === 'Enter' && !isMultiline) {
          e.preventDefault();
          onChange(localValue);
          setIsDirty(false);
        }
      }}
      placeholder={field.label || ''}
      sx={{
        '& .MuiInputBase-input': {
          resize: isMultiline ? 'vertical' : 'none'
        }
      }}
    />
  );
};

export default TextFieldRenderer;

// 🧩 Field case for dynamic renderer registration
export const TextFieldCase = {
  type: 'text',
  Component: TextFieldRenderer
};