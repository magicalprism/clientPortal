'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
  Typography,
  IconButton
} from '@mui/material';
import { Info as InfoIcon, Plus } from '@phosphor-icons/react';
import { createClient } from '@/lib/supabase/browser';
import { useRouter, usePathname } from 'next/navigation';

const CreateForm = ({ config, onSuccess }) => {
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();
  const { name: table, fields } = config;

  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [relationshipOptions, setRelationshipOptions] = useState({});

  useEffect(() => {
    const fetchOptions = async () => {
      const relationFields = fields.filter(f => f.type === 'relationship');
      const promises = relationFields.map(async (field) => {
        const { data } = await supabase
          .from(field.relation.table)
          .select(`id, ${field.relation.labelField}`);
        return { name: field.name, data };
      });

      const results = await Promise.all(promises);
      const optionsMap = {};
      results.forEach((result) => {
        optionsMap[result.name] = result.data || [];
      });
      setRelationshipOptions(optionsMap);
    };

    fetchOptions();
  }, [fields, supabase]);

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
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
        window.location.href = `${config.editPathPrefix}/${data.id}`;
      }
    }
  };

  if (!Array.isArray(fields)) {
    return <Typography color="error">Invalid config: missing fields</Typography>;
  }

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Grid container spacing={3}>
        {fields.map((field) => {
          const value = formData[field.name] || '';
          const isFullWidth = field.type === 'boolean';

          return (
            <Grid item xs={12} md={isFullWidth ? 12 : 6} key={field.name}>
              <Box
                display="flex"
                flexDirection="column"
                justifyContent="space-between"
                height="100%"
                gap={1}
              >
                <Box>
                  <Typography variant="body2" fontWeight={500}>
                    {field.label}
                  </Typography>
                  {field.description && (
                    <Typography variant="caption" color="text.secondary">
                      {field.description}
                    </Typography>
                  )}
                </Box>

                {field.type === 'relationship' ? (
                  <Box display="flex" alignItems="center" gap={1}>
                    <FormControl fullWidth size="small">
                      <Select
                        value={value}
                        onChange={(e) => handleChange(field.name, e.target.value)}
                        displayEmpty
                        renderValue={(selected) => {
                          if (!selected) return `Select ${field.label}`;
                          const selectedOption = (relationshipOptions[field.name] || []).find(opt => opt.id === selected);
                          return selectedOption?.[field.relation.labelField] || `ID: ${selected}`;
                        }}
                      >
                        <MenuItem value="">
                          <em>None</em>
                        </MenuItem>
                        {(relationshipOptions[field.name] || []).map((opt) => (
                          <MenuItem key={opt.id} value={opt.id}>
                            {opt[field.relation.labelField]}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    {!!field.relation?.linkTo && (
                      <IconButton
                        size="small"
                        onClick={() => {
                          const params = new URLSearchParams(window.location.search);
                          params.set('modal', 'create');
                          params.set('refField', field.name);
                          router.push(`${pathname}?${params.toString()}`, { shallow: true });
                        }}
                        title={`Create new ${field.label}`}
                      >
                        <Plus size={16} />
                      </IconButton>
                    )}
                  </Box>
                ) : field.type === 'boolean' ? (
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={!!value}
                        onChange={(e) => handleChange(field.name, e.target.checked)}
                      />
                    }
                    label=""
                  />
                ) : (
                  <TextField
                    fullWidth
                    type={field.type === 'date' ? 'date' : 'text'}
                    value={value}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    InputLabelProps={field.type === 'date' ? { shrink: true } : {}}
                    size="small"
                  />
                )}
              </Box>
            </Grid>
          );
        })}
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
