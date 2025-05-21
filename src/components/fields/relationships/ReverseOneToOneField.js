'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/browser';
import { CircularProgress, Typography, Box, Autocomplete, TextField } from '@mui/material';

const supabase = createClient();

const ReverseOneToOneField = ({
  record,
  field,
  value,
  onChange,
  editable = false,
  mode = 'view'
}) => {
  const {
    table,
    foreignKey,
    labelField = 'title',
    linkBase = null,
    allowClear = true
  } = field.props || {};

  const [options, setOptions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchOptions = async () => {
    const { data, error } = await supabase
      .from(table)
      .select(`id, ${labelField}`)
      .eq(foreignKey, record.id)
      .limit(1);

    if (!error) {
      setOptions(data);
      setSelected(data[0] || null);
    }

    setLoading(false);
  };

  const handleChange = async (_, newValue) => {
    setSelected(newValue);
    if (onChange) {
      // return full structure or just ID depending on your data model
      onChange(newValue?.id || null);
    }

    // Optional: also update reverse field automatically
    if (newValue) {
      await supabase
        .from(table)
        .update({ [foreignKey]: record.id })
        .eq('id', newValue.id);
    }
  };

  useEffect(() => {
    fetchOptions();
  }, [record.id]);

  if (mode === 'view' || !editable) {
    if (loading) return <CircularProgress size={18} />;
    if (!selected)
      return <Typography variant="body2" color="text.secondary">No linked record</Typography>;

    const label = selected[labelField] || `ID: ${selected.id}`;
    const href = linkBase ? `${linkBase}/${selected.id}` : null;

    return (
      <Typography variant="body2">
        {href ? <a href={href}>{label}</a> : label}
      </Typography>
    );
  }

  return (
    <Box>
      <Autocomplete
        options={options}
        getOptionLabel={(option) => option[labelField] || `ID: ${option.id}`}
        value={selected}
        isOptionEqualToValue={(opt, val) => opt?.id === val?.id}
        onChange={handleChange}
        loading={loading}
        renderInput={(params) => (
          <TextField {...params} label={field.label || 'Select record'} />
        )}
      />
    </Box>
  );
};

export default ReverseOneToOneField;
