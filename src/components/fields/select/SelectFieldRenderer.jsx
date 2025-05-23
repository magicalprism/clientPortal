'use client';

import { useEffect, useState } from 'react';
import {
  Typography,
  Select,
  MenuItem,
  ListSubheader
} from '@mui/material';

import {
  normalizeSelectValue,
  extractSelectValue
} from '@/components/fields/select/SelectField';
import { useAutoUpdateTasks } from '@/hooks/useAutoUpdateTasks';

export const SelectFieldRenderer = ({
  value,
  field,
  record,
  editable = false,
  isEditing = false,
  onChange = () => {}
}) => {
  // Automatically update tasks if this is a 'status' field
  if (field.name === 'status') {
    useAutoUpdateTasks(record);
  }

  const [localValue, setLocalValue] = useState(() =>
    extractSelectValue(normalizeSelectValue(value, field.options))
  );
  const [isDirty, setIsDirty] = useState(false);

  // Update local value from props unless user is editing
  useEffect(() => {
    const newValue = extractSelectValue(normalizeSelectValue(value, field.options));
    if (!isDirty && newValue !== localValue) {
      setLocalValue(newValue);
    }
  }, [value, field.options, isDirty, localValue]);

  // Reset dirty if value gets synced externally
  useEffect(() => {
    const newValue = extractSelectValue(normalizeSelectValue(value, field.options));
    if (isDirty && newValue === localValue) {
      setIsDirty(false);
    }
  }, [value, field.options, isDirty, localValue]);

  if (!editable) {
    const label = normalizeSelectValue(value, field.options).label || '—';
    return <Typography variant="body2">{label}</Typography>;
  }

  return (
    <Select
      fullWidth
      size="small"
      value={localValue || ''}
      onChange={(e) => {
        const selectedValue = e.target.value;
        const selectedLabel =
          (field.options || []).find(opt => opt.value === selectedValue)?.label || selectedValue;

        setLocalValue(selectedValue);
        setIsDirty(true);
        onChange({ value: selectedValue, label: selectedLabel });
      }}
      displayEmpty
      renderValue={(selected) => {
        if (!selected) return 'Select an option';
        const matched = (field.options || []).find(opt => opt.value === selected);
        return matched?.label || selected;
      }}
    >
      <MenuItem value="">
        <em>None</em>
      </MenuItem>
      {(field.options || []).map((option, idx) => {
          if (option.heading) {
            return (
              <ListSubheader key={`heading-${idx}`}>
                {option.label}
              </ListSubheader>
            );
          }

          return (
            <MenuItem key={option.value || option.label} value={option.value}>
              {option.label}
            </MenuItem>
          );
        })}
    </Select>
  );
};

export default SelectFieldRenderer;
// 🧩 For inclusion in main FieldRenderer switch map
export const SelectFieldCase = {
  type: 'select',
  Component: SelectFieldRenderer
};

// Optional: If you support 'status' as a separate field type
export const StatusFieldCase = {
  type: 'status',
  Component: SelectFieldRenderer
};
