'use client';

import { useState, useEffect } from 'react';
import { TextField, Typography, Box } from '@mui/material';
import CascadeRefreshButton from '@/components/views/timeline/CascadeRefreshButton';

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

const normalizeDate = (val) => {
  if (!val) return '';
  const date = new Date(val);
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().split('T')[0];
};

  const [localValue, setLocalValue] = useState(normalizeDate(value));
  const [isDirty, setIsDirty] = useState(false);

useEffect(() => {
  const normalized = normalizeDate(value);

  if (!isDirty) {
    setLocalValue(normalized);
  } else if (normalized !== localValue && normalized === normalizeDate(record?.[field.name])) {
    // Reset dirty state if new value matches source record
    setIsDirty(false);
    setLocalValue(normalized);
  }
}, [value, record?.[field.name]]);


  if (!isEditMode) {
    return (
      <Typography variant="body2">
        {value ? new Date(value).toLocaleDateString() : '—'}
      </Typography>
    );
  }

  return (
    <Box display="flex" alignItems="center" gap={1}>
      <TextField
        fullWidth
        type="date"
        size="small"
        value={localValue}
        onChange={(e) => {
                const next = e.target.value;
                setIsDirty(true);
                setLocalValue(next);

                // ✅ Safely construct a timestamp from the local date string
                const timestamp = new Date(`${next}T00:00:00`);
                onChange(timestamp);
            }}
            InputLabelProps={{ shrink: true }}
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
