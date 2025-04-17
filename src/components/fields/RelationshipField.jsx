'use client';

import { useEffect, useState } from 'react';
import {
  CircularProgress,
  FormControl,
  IconButton,
  MenuItem,
  Select
} from '@mui/material';
import { Eye, Plus } from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';

export const RelationshipField = ({ field, value, editable, onChange }) => {
  const router = useRouter();
  const supabase = createClient();
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadOptions = async () => {
      if (!field.relation?.table || !field.relation?.labelField) return;

      setLoading(true);
      let query = supabase.from(field.relation.table).select(`id, ${field.relation.labelField}`);
      const filter = field.relation.filter || {};
      Object.entries(filter).forEach(([key, val]) => {
        query = query.eq(key, val);
      });

      const { data } = await query;
      if (data) {
        setOptions(data.sort((a, b) =>
          (a[field.relation.labelField] || '').localeCompare(b[field.relation.labelField] || '')
        ));
      }

      setLoading(false);
    };

    if (editable) loadOptions();
  }, [editable, field]);

  const selectedOption = options.find(opt => opt.id === value);

  const createButton = !!field.relation?.linkTo && (
    <IconButton
      size="small"
      sx={{ ml: 1 }}
      onClick={() => {
        const params = new URLSearchParams({ modal: 'create', refField: field.name });
        router.push(`${field.relation.linkTo}?${params.toString()}`);
      }}
      title={`Create new ${field.label}`}
    >
      <Plus size={16} />
    </IconButton>
  );

  if (loading) return <CircularProgress size={16} />;

  return (
    <FormControl fullWidth size="small" sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
      <Select
        value={selectedOption?.id ?? ''}
        onChange={(e) => onChange(field.name, e.target.value)}
        displayEmpty
        sx={{ flex: 1 }}
        renderValue={(selected) => {
          if (!selected) return `Select ${field.label}`;
          const match = options.find(opt => opt.id === selected);
          return match?.[field.relation.labelField] || `ID: ${selected}`;
        }}
      >
        <MenuItem value="">
          <em>Select {field.label}</em>
        </MenuItem>
        {options.map((opt) => (
          <MenuItem key={opt.id} value={opt.id}>
            {opt[field.relation.labelField] || `ID: ${opt.id}`}
          </MenuItem>
        ))}
      </Select>

      {!!value && field.relation?.linkTo && (
        <IconButton
          size="small"
          sx={{ ml: 1 }}
          onClick={() => router.push(`${field.relation.linkTo}/${value}`)}
          title={`View ${field.label}`}
        >
          <Eye size={16} />
        </IconButton>
      )}

      {createButton}
    </FormControl>
  );
};
