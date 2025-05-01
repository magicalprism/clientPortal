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

export const RelationshipField = ({ field, value, editable, onChange, record }) => {
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
        let actualValue = val;
      
        // 🧠 Dynamic {{record.field}} replacement
        if (typeof val === 'string' && val.startsWith('{{record.') && val.endsWith('}}')) {
          const fieldName = val.slice(9, -2);
          actualValue = record?.[fieldName] ?? null;
        }
      
        if (actualValue !== null) {
          // 🧠 Manually coerce string "true"/"false" to real booleans for known boolean fields
          if (['is_client', 'is_active', 'is_archived'].includes(key)) {
            if (actualValue === 'true' || actualValue === true) {
              actualValue = true;
            }
            if (actualValue === 'false' || actualValue === false) {
              actualValue = false;
            }
          }
      
          if (Array.isArray(actualValue)) {
            query = query.in(key, actualValue);
          } else if (typeof actualValue === 'boolean') {
            query = query.eq(key, actualValue);
          } else if (typeof actualValue === 'number') {
            query = query.eq(key, actualValue);
          } else if (typeof actualValue === 'string' && actualValue.includes(',')) {
            const parts = actualValue.split(',').map((s) => s.trim());
            query = query.in(key, parts);
          } else if (typeof actualValue === 'string') {
            query = query.ilike(key, `%${actualValue}%`);
          } else {
            query = query.eq(key, actualValue);
          }
        }
      });
      
      
      
      
      
      
      
      

      const { data, error } = await query;
      if (error) {
        console.error(`[RelationshipField] ❌ Failed loading options:`, error);
      }

      if (data) {
        const sorted = data.sort((a, b) =>
          (a[field.relation.labelField] || '').localeCompare(b[field.relation.labelField] || '')
        );
        setOptions(sorted);
      }

      setLoading(false);
    };

    if (editable) loadOptions();
  }, [editable, field.name, record?.id]);

  const selectedOption = options.find(opt => String(opt.id) === String(value));

  const handleChange = async (e) => {
    const newValue = e.target.value === '' ? null : e.target.value;
    onChange(newValue); // update UI immediately via FieldRenderer

    const parentId = field.parentId;
    const parentTable = field.parentTable;

    if (parentId && parentTable) {
      try {
        const { error } = await supabase
          .from(parentTable)
          .update({ [field.name]: newValue })
          .eq('id', parentId);

        if (error) {
          console.error(`[RelationshipField] ❌ Auto-save error on ${field.name}:`, error);
        }
      } catch (err) {
        console.error(`[RelationshipField] ❌ Unexpected save error:`, err);
      }
    }
  };

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
    <FormControl
      fullWidth
      size="small"
      sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}
    >
      <Select
        value={selectedOption?.id ?? ''}
        onChange={handleChange}
        displayEmpty
        sx={{ flex: 1 }}
        renderValue={(selected) => {
          if (!selected) return `Select ${field.label}`;
          const match = options.find(opt => String(opt.id) === String(selected));
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
