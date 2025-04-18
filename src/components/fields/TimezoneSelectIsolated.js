'use client';

import React, { useEffect, useState } from 'react';
import { TextField, MenuItem, CircularProgress } from '@mui/material';
import { TIMEZONES } from '@/data/lists';
import { createClient } from '@/lib/supabase/browser';

const supabase = createClient();

export const TimezoneSelectIsolated = ({ recordId, tableName, initialValue }) => {
  const [value, setValue] = useState(initialValue || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setValue(initialValue || '');
  }, [initialValue]);

  const handleChange = async (e) => {
    const newValue = e.target.value;
    setValue(newValue);
    setLoading(true);

    try {
      const { error } = await supabase
        .from(tableName)
        .update({ site_timezone: newValue })
        .eq('id', recordId);

      if (error) {
        console.error('[TimezoneSelectIsolated] ❌ Failed to update:', error);
      } else {
        console.log('[TimezoneSelectIsolated] ✅ Saved:', newValue);
      }
    } catch (err) {
      console.error('[TimezoneSelectIsolated] ❌ Exception:', err);
    }

    setLoading(false);
  };

  return (
    <TextField
      select
      fullWidth
      label="Time Zone"
      value={value}
      onChange={handleChange}
      disabled={loading}
      SelectProps={{
        renderValue: (selected) =>
          TIMEZONES.find((tz) => tz.value === selected)?.label || 'Select time zone',
      }}
    >
      {TIMEZONES.map((tz) => (
        <MenuItem key={tz.value} value={tz.value}>
          {tz.label}
        </MenuItem>
      ))}
    </TextField>
  );
};
