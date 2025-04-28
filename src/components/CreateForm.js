'use client';

import { useState, useEffect } from 'react';
import { Box, Button, Grid, Typography } from '@mui/material';
import { createClient } from '@/lib/supabase/browser';
import { FieldRenderer } from '@/components/FieldRenderer';
import { useRouter, usePathname } from 'next/navigation';

const CreateForm = ({ config, onSuccess }) => {
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();
  const { name: table, fields } = config;

  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field.name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.from(table).insert([formData]).select().single();
    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setFormData({});
      if (onSuccess) onSuccess();
      if (data?.id && config.editPathPrefix) {
        router.push(`${config.editPathPrefix}/${data.id}`);
      }
    }
  };

  if (!Array.isArray(fields)) {
    return <Typography color="error">Invalid config: missing fields</Typography>;
  }

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Grid container spacing={3}>
        {fields.map((field) => (
          <Grid item xs={12} md={field.type === 'boolean' ? 12 : 6} key={field.name}>
            <Box display="flex" flexDirection="column" gap={1}>
              <Typography variant="body2" fontWeight={500}>{field.label}</Typography>
              {field.description && (
                <Typography variant="caption" color="text.secondary">{field.description}</Typography>
              )}

              <FieldRenderer
                field={field}
                value={formData[field.name] || ''}
                record={{}}
                config={config}
                mode="create"
                editable
                onChange={handleChange}
              />
            </Box>
          </Grid>
        ))}
      </Grid>

      {error && (
        <Typography color="error" mt={2}>
          {error}
        </Typography>
      )}

      <Box mt={4}>
        <Button type="submit" variant="contained" disabled={loading}>
          {loading ? 'Saving...' : 'Create'}
        </Button>
      </Box>
    </Box>
  );
};

export default CreateForm;