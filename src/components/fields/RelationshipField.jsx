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
import { resolveDynamicFilter } from '@/lib/utils/filters';


export const RelationshipField = ({ field, value, editable, onChange, record }) => {
  const router = useRouter();
  const supabase = createClient();
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadOptions = async () => {
      if (!field.relation?.table || !field.relation?.labelField) {
        console.warn(`[RelationshipField] Missing table or labelField for field: ${field.name}`);
        return;
      }
  
      setLoading(true);
      let query = supabase.from(field.relation.table).select(`id, ${field.relation.labelField}`);
  
      try {
        const resolvedFilter = resolveDynamicFilter(field.relation.filter || {}, record);
        
  
        for (const [key, actualValue] of Object.entries(resolvedFilter)) {
          if (actualValue === null || actualValue === undefined || actualValue === '') {
            console.warn(`[RelationshipField] Skipping filter ${key} — value is null/undefined`);
            continue; // skip this filter
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
          } else if (typeof actualValue === 'string' && actualValue.includes('%')) {
            query = query.ilike(key, actualValue);
          } else {
            query = query.eq(key, actualValue);
          }
        }
        
        const { data, error } = await query;
        if (error) {
          console.error(`[RelationshipField] ❌ Failed loading options for ${field.name}:`, {
            error,
            table: field.relation.table,
            labelField: field.relation.labelField,
            resolvedFilter,
          });
        }
  
        if (data) {
          const sorted = data.sort((a, b) =>
            (a[field.relation.labelField] || '').localeCompare(b[field.relation.labelField] || '')
          );
          setOptions(sorted);
        }
      } catch (err) {
        console.error(`[RelationshipField] ❌ Unexpected error in loadOptions for ${field.name}:`, err);
      }
  
      setLoading(false);
    };
  
    if (editable) loadOptions();
  }, [editable, field.name, field.relation, record]);
  



  const selectedOption = options.find(opt => String(opt.id) === String(value));

  const handleChange = async (e) => {
    const newValue = e.target.value === '' ? null : e.target.value;
    onChange(newValue); // update UI immediately via FieldRenderer

   
  };

  const createButton = !!field.relation?.linkTo && (
    <IconButton
      size="small"
      sx={{ ml: 1 }}
      onClick={() => {
        const params = new URLSearchParams({
          modal: 'create',
          refField: field.name,
          id: record?.id // ✅ the parent record ID
        });
        const url = new URL(window.location.href);
        url.searchParams.set('modal', 'create');
        url.searchParams.set('refField', field.name);
        url.searchParams.set('id', record?.id);
        router.push(url.toString());

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
