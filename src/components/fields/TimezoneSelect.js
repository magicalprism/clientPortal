'use client';

import React from 'react';
import { TextField, MenuItem } from '@mui/material';
import { TIMEZONES } from '@/data/lists';
import { createClient } from '@/lib/supabase/browser';

const supabase = createClient();

export const TimezoneSelect = ({
  value,
  onChange,
  name,
  parentId,
  parentTable
}) => {
  const handleChange = async (e) => {
    const newValue = e.target.value;

    console.log('[TimezoneSelect] FINAL DEBUG - name:', name, '| newValue:', newValue);
    console.log('[TimezoneSelect] Parent ID:', parentId);
    console.log('[TimezoneSelect] Parent table:', parentTable);

    // ✅ FIXED: Correct value is now passed
    onChange(name, newValue);
    console.log('[TimezoneSelect] Dispatched onChange with:', name, newValue);

    // ✅ Save to Supabase
    if (parentId && parentTable) {
      try {
        const { data, error } = await supabase
          .from(parentTable)
          .update({ [name]: newValue })
          .eq('id', parentId)
          .select(); // Forces revalidation

        console.log('[TimezoneSelect] Supabase update response:', { data, error });

        if (error) {
          console.error('[TimezoneSelect] ❌ Supabase error:', JSON.stringify(error, null, 2));
        } else {
          console.log('[TimezoneSelect] ✅ Successfully updated timezone in Supabase');
        }
      } catch (err) {
        console.error('[TimezoneSelect] ❌ Exception during Supabase update:', err);
      }
    } else {
      console.warn('[TimezoneSelect] ⚠️ Missing parentId or parentTable');
    }
  };

  return (
    <TextField
      select
      fullWidth
      name={name}
      value={typeof value === 'string' ? value : ''}
      onChange={handleChange}
      SelectProps={{
        renderValue: (selected) => {
          const match = TIMEZONES.find((tz) => tz.value === selected);
          console.log('[TimezoneSelect] Rendering label for:', selected, '→', match?.label);
          return match?.label || selected || 'Select Time Zone';
        }
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
    </TextField>
  );
};
