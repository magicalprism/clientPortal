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



    // ✅ FIXED: Correct value is now passed
    onChange(name, newValue);


    // ✅ Save to Supabase
    if (parentId && parentTable) {
      try {
        const { data, error } = await supabase
          .from(parentTable)
          .update({ [name]: newValue })
          .eq('id', parentId)
          .select(); // Forces revalidation



        if (error) {

        } else {

        }
      } catch (err) {

      }
    } else {

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
