'use client';

import { useState, useEffect } from 'react';
import { TextField, Typography, Box } from '@mui/material';
import CascadeRefreshButton from '@/components/fields/custom/timeline/CascadeRefreshButton';

export const DateFieldRenderer = ({
  value,
  field,
  record,
  editable = false,
  mode = 'view',
  onChange = () => {}
}) => {
  const isEditMode = editable || mode === 'create';
  const isDueDate = field.name === 'due_date';
  
  // Check if this field should include time - configurable via field.config
  const includeTime = field.config?.includeTime || field.config?.datetime || false;
  const inputType = includeTime ? 'datetime-local' : 'date';

  const normalizeValue = (val) => {
    if (!val) return '';
    
    const date = new Date(val);
    if (isNaN(date.getTime())) return '';
    
    if (includeTime) {
      // For datetime-local input, we need YYYY-MM-DDTHH:mm format
      const tzOffset = date.getTimezoneOffset() * 60000;
      const localDate = new Date(date.getTime() - tzOffset);
      return localDate.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm
    } else {
      // For date input, we need YYYY-MM-DD format
      const tzOffset = date.getTimezoneOffset() * 60000;
      return new Date(date.getTime() - tzOffset).toISOString().split('T')[0];
    }
  };

  const [localValue, setLocalValue] = useState(normalizeValue(value));
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    const normalized = normalizeValue(value);

    if (!isDirty) {
      setLocalValue(normalized);
    } else if (normalized !== localValue && normalized === normalizeValue(record?.[field.name])) {
      // Reset dirty state if new value matches source record
      setIsDirty(false);
      setLocalValue(normalized);
    }
  }, [value, record?.[field.name], includeTime]);

  const formatDisplayValue = (val) => {
    if (!val) return '—';
    
    const date = new Date(val);
    if (isNaN(date.getTime())) return '—';
    
    if (includeTime) {
      return date.toLocaleString(); // Shows both date and time
    } else {
      return date.toLocaleDateString(); // Shows only date
    }
  };

  if (!isEditMode) {
    return (
      <Typography variant="body2">
        {formatDisplayValue(value)}
      </Typography>
    );
  }

  const handleChange = (e) => {
    const inputValue = e.target.value;
    setIsDirty(true);
    setLocalValue(inputValue);

    if (!inputValue) {
      onChange(null);
      return;
    }

    // Construct appropriate timestamp based on field type
    let timestamp;
    if (includeTime) {
      // For datetime-local, the value is already in YYYY-MM-DDTHH:mm format
      timestamp = new Date(inputValue);
    } else {
      // For date-only, append midnight time
      timestamp = new Date(`${inputValue}T00:00:00`);
    }

    onChange(timestamp);
  };

  return (
    <Box display="flex" alignItems="center" gap={1}>
      <TextField
        fullWidth
        type={inputType}
        size="small"
        value={localValue}
        onChange={handleChange}
        InputLabelProps={{ shrink: true }}
        inputProps={{
          // Add step for seconds if needed (optional)
          ...(includeTime && { step: 60 }) // 1 minute steps
        }}
      />
      {isDueDate && record?.milestone_id && record?.project_id && (
        <CascadeRefreshButton
          taskId={record.id}
          milestoneId={record.milestone_id}
          projectId={record.project_id}
        />
      )}
    </Box>
  );
};

export default DateFieldRenderer;

// 🧩 For inclusion in the FieldRenderer switch map
export const DateFieldCase = {
  type: 'date',
  Component: DateFieldRenderer
};

// 🧩 Alternative case for datetime fields (if you want separate types)
export const DateTimeFieldCase = {
  type: 'datetime',
  Component: DateFieldRenderer
};