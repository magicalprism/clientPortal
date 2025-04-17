'use client';

import { useEffect, useState } from 'react';
import {
  Select,
  MenuItem,
  FormControl,
  CircularProgress,
  Checkbox,
  ListItemText,
  IconButton,
  Typography
} from '@mui/material';
import { Plus } from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';

export const MultiRelationshipField = ({ field, value = [], onChange }) => {
  const router = useRouter();
  const supabase = createClient();
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOptions = async () => {
      const { table, labelField, filter = {} } = field.relation || {};
      if (!table || !labelField) return;

      let query = supabase.from(table).select(`id, ${labelField}`);
      Object.entries(filter).forEach(([key, val]) => {
        query = query.eq(key, val);
      });

      const { data } = await query;
      if (data) {
        setOptions(
          data.sort((a, b) =>
            (a[labelField] || '').localeCompare(b[labelField] || '')
          )
        );
      }

      setLoading(false);
    };

    loadOptions();
  }, [field]);

  if (loading) return <CircularProgress size={16} />;

  const selectedIds = Array.isArray(value) ? value.filter(id => options.some(opt => opt.id === id)) : [];

  return (
    <FormControl fullWidth size="small" sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
      <Select
        multiple
        value={selectedIds}
        onChange={(e) => {
          const selected = e.target.value;
          onChange(field.name, selected);
        }}
        displayEmpty
        renderValue={(selected) => {
          if (!selected.length) return <Typography color="text.secondary">Select {field.label}</Typography>;
          return selected
            .map((id) => {
              const opt = options.find((o) => o.id === id);
              return opt?.[field.relation.labelField] || `ID: ${id}`;
            })
            .join(', ');
        }}
        MenuProps={{
          PaperProps: { style: { maxHeight: 300 } },
          disableAutoFocusItem: true
        }}
      >
        {options.map((opt) => (
          <MenuItem key={opt.id} value={opt.id}>
            <Checkbox checked={selectedIds.includes(opt.id)} />
            <ListItemText primary={opt[field.relation.labelField] || `ID: ${opt.id}`} />
          </MenuItem>
        ))}
      </Select>

      {!!field.relation?.linkTo && (
        <IconButton
          size="small"
          sx={{ ml: 1 }}
          onClick={() => {
            const params = new URLSearchParams({
              modal: 'create',
              refField: field.name
            });
            router.push(`${field.relation.linkTo}?${params.toString()}`);
          }}
          title={`Create new ${field.label}`}
        >
          <Plus size={16} />
        </IconButton>
      )}
    </FormControl>
  );
};
