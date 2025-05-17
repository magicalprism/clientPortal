'use client';

import { useEffect, useState } from 'react';
import {
  Typography,
  Select,
  MenuItem
} from '@mui/material';

import { TIMEZONES } from '@/data/lists';

export const TimezoneFieldRenderer = ({
  value,
  field,
  record,
  editable = false,
  isEditing = false,
  onChange = () => {}
}) => {
  const [localValue, setLocalValue] = useState(value || '');
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (!isDirty && value !== localValue) {
      setLocalValue(value || '');
    }
  }, [value, isDirty, localValue]);

  if (!editable) {
    const label = TIMEZONES.find(tz => tz.value === value)?.label || '—';
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
          TIMEZONES.find(opt => opt.value === selectedValue)?.label || selectedValue;

        setLocalValue(selectedValue);
        setIsDirty(true);
        onChange({ value: selectedValue, label: selectedLabel });
      }}
      displayEmpty
      renderValue={(selected) => {
        if (!selected) return 'Select Time Zone';
        const matched = TIMEZONES.find(opt => opt.value === selected);
        return matched?.label || selected;
      }}
    >
      <MenuItem value="">
        <em>Select Time Zone</em>
      </MenuItem>
      {TIMEZONES.map((tz) => (
        <MenuItem key={tz.value} value={tz.value}>
          {tz.label}
        </MenuItem>
      ))}
    </Select>
  );
};

export default  TimezoneFieldRenderer;

export const TimezoneFieldCase = {
  type: 'timezone',
  Component: TimezoneFieldRenderer
};
