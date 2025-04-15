'use client';

import React from 'react';
import { createClient } from '@/lib/supabase/browser';
import {
  Box,
  Button,
  IconButton,
  Stack,
  Typography,
  OutlinedInput,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import { PencilSimple as PencilIcon } from '@phosphor-icons/react/dist/ssr/PencilSimple';
import dayjs from 'dayjs';

export function CollectionItemPage({ config, record = {} }) {
  const supabase = createClient();
  const [edit, setEdit] = React.useState(false);
  const [values, setValues] = React.useState({});

  const isIncludedInView = (field, view) => {
    if (!field.includeInViews) return true;
    if (field.includeInViews.length === 1 && field.includeInViews[0] === 'none') return false;
    return field.includeInViews.includes(view);
  };

  React.useEffect(() => {
    const initial = {};
    config.fields.forEach((field) => {
      initial[field.name] = record[field.name] ?? '';
    });
    setValues(initial);
  }, [record, config.fields]);

  const handleChange = (fieldName, value) => {
    setValues((prev) => ({ ...prev, [fieldName]: value }));
  };

  const handleSave = async () => {
    const updateData = {};

    config.fields.forEach((field) => {
      const { name, type } = field;
      let value = values[name];

      if (!isIncludedInView(field, 'edit') || value === undefined || value === '') return;
      if (type === 'date' && value) value = dayjs(value).toISOString();
      if (["id", "created", "updated", "author_id"].includes(name)) return;

      updateData[name] = value;
    });

    if (!Object.keys(updateData).length) return;

    const { error } = await supabase
      .from(config.name)
      .update(updateData)
      .eq('id', record.id);

    if (error) {
      console.error('Update failed:', error.message);
    } else {
      setEdit(false);
      window.location.reload();
    }
  };

  const handleDelete = async () => {
    const { error } = await supabase
      .from(config.name)
      .delete()
      .eq('id', record.id);

    if (error) {
      console.error('Delete failed:', error.message);
    } else {
      window.location.href = `/dashboard/${config.name}`;
    }
  };

  const sections = config.sections || [
    { id: 'default', title: 'Details' }
  ];

  const fieldsBySection = sections.map(section => {
    const fields = config.fields.filter(
      (field) => (field.section || 'default') === section.id && isIncludedInView(field, edit ? 'edit' : 'view')
    );
    return { ...section, fields };
  });

  return (
    <Box sx={{ maxWidth: 960, mx: 'auto', mt: 4, px: 3 }}>
      <Stack spacing={3}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h4">{config.label} Details</Typography>
          <IconButton onClick={() => setEdit(!edit)}>
            <PencilIcon />
          </IconButton>
        </Stack>

        {fieldsBySection.map((section) => (
          <Card key={section.id}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>{section.title}</Typography>
              <Grid container spacing={2}>
                {section.fields.map((field) => (
                  <Grid item xs={12} sm={6} key={field.name}>
                    {edit ? (
                      <OutlinedInput
                        fullWidth
                        value={values[field.name]}
                        onChange={(e) => handleChange(field.name, e.target.value)}
                        placeholder={field.label}
                        multiline={field.type === 'textarea'}
                        minRows={field.type === 'textarea' ? 3 : 1}
                      />
                    ) : (
                      <Box>
                        <Typography variant="subtitle2">{field.label}</Typography>
                        <Typography color="text.secondary" variant="body2">
                          {values[field.name] || '—'}
                        </Typography>
                      </Box>
                    )}
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        ))}

        {edit && (
          <Stack direction="row" justifyContent="flex-end" spacing={2}>
            <Button onClick={() => setEdit(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleSave}>Save</Button>
          </Stack>
        )}

        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Button color="error" onClick={handleDelete}>
            Archive
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}
