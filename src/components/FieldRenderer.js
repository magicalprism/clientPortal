'use client';

import { useEffect, useState } from 'react';
import { Typography, IconButton, Select, MenuItem, CircularProgress, InputLabel, FormControl } from '@mui/material';
import { PencilSimple as PencilIcon } from '@phosphor-icons/react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';

/**
 * Helper to determine if a field should be shown in a specific view (table, modal, edit, etc.)
 */
export const isIncludedInView = (field, view = 'table') => {
  if (!field.includeInViews) return true;
  if (field.includeInViews.length === 1 && field.includeInViews[0] === 'none') return false;
  return field.includeInViews.includes(view);
};

export const FieldRenderer = ({
  value,
  field,
  record,
  config,
  view = 'default',
  editable = false,
  onChange = () => {}
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Relationship dropdown loader
  useEffect(() => {
    const loadOptions = async () => {
      if (field.type !== 'relationship' || !editable) return;
  
      const { table, labelField, filter = {} } = field.relation || {};
      if (!table || !labelField) return;
  
      setLoading(true);
      let query = supabase.from(table).select(`id, ${labelField}`);
      for (const [key, val] of Object.entries(filter)) {
        query = query.eq(key, val);
      }
  
      const { data, error } = await query;
      if (!error && data) {
        const sorted = data.sort((a, b) =>
          (a[labelField] || '').localeCompare(b[labelField] || '')
        );
        setOptions(sorted);
      }
  
      setLoading(false);
    };
  
    loadOptions();
  }, [field, editable]);
  

  // 🔒 Respect includeInViews
  if (!isIncludedInView(field, view)) return null;

  // 💬 Optional custom formatter override
  if (field.format) {
    return field.format(value, field, record);
  }

  // ⛔ Empty fallback
  if (value == null || value === '') return '—';

  // ✏️ Editable relationship dropdown
  if (editable && field.type === 'relationship') {
    return loading ? (
      <CircularProgress size={16} />
    ) : (
      <Select
        fullWidth
        size="small"
        value={value || ''}
        onChange={(e) => onChange(field.name, e.target.value)}
        displayEmpty
      >
        <MenuItem value="">—</MenuItem>
        {options.map((option) => (
          <MenuItem key={option.id} value={option.id}>
            {option[field.relation.labelField] || `ID: ${option.id}`}
          </MenuItem>
        ))}
      </Select>
    );
  }

  // 🔗 Relationship display
// ✏️ Editable relationship dropdown + view button
    if (editable && field.type === 'relationship') {
      return loading ? (
        <CircularProgress size={16} />
      ) : (
        <FormControl fullWidth size="small" sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
          <Select
            value={value || ''}
            onChange={(e) => onChange(field.name, e.target.value)}
            displayEmpty
            sx={{ flex: 1 }}
            renderValue={(selected) => {
              if (!selected) return `Select ${field.label}`;
              const selectedOption = options.find(opt => opt.id === selected);
              return selectedOption?.[field.relation.labelField] || `ID: ${selected}`;
            }}
          >
            <MenuItem value="">Select {field.label}</MenuItem>
            {/* Ensure current value is included in the dropdown, even if not in options */}
            {!options.some(opt => opt.id === value) && value && (
              <MenuItem key={value} value={value}>
                {record?.[`${field.name}_label`] || `ID: ${value}`}
              </MenuItem>
            )}
            {options.map((opt) => (
              <MenuItem key={opt.id} value={opt.id}>
                {opt[field.relation.labelField] || `ID: ${opt.id}`}
              </MenuItem>
            ))}
          </Select>

          {!!value && (
            <IconButton
              size="small"
              sx={{ ml: 1 }}
              onClick={() => {
                const base = field.relation?.linkTo || '#';
                router.push(`${base}/${value}`);
              }}
            >
              <PencilIcon size={16} />
            </IconButton>
          )}
        </FormControl>
      );
    }




  // 📸 Image / Media
  if (field.type === 'media') {
    return (
      <img
        src={value}
        alt={field.label}
        style={{ maxWidth: '100%', borderRadius: 8 }}
        onError={(e) => (e.target.style.display = 'none')}
      />
    );
  }

  // 🌐 URL
  if (field.type === 'link') {
    return (
      <a
        href={value}
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: '#1976d2', wordBreak: 'break-word' }}
      >
        {field.displayLabel || value}
      </a>
    );
  }

  // 📅 Date
  if (field.type === 'date') {
    return new Date(value).toLocaleDateString();
  }

  // ✅ Boolean
  if (field.type === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  // 📊 Status
  if (field.type === 'status') {
    return <span style={{ textTransform: 'capitalize' }}>{value}</span>;
  }

  // 🧾 JSON
  if (field.type === 'json') {
    return (
      <pre style={{ fontSize: '0.85em', whiteSpace: 'pre-wrap' }}>
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  }

  // ✏️ Edit icon (not editable field, but action button)
  if (field.type === 'editButton') {
    const openMode = field.openMode || config?.openMode || 'page';
    const href = config?.editPathPrefix
      ? `${config.editPathPrefix}/${record.id}`
      : `/${config?.name}/${record.id}`;

    const handleClick = () => {
      if (openMode === 'modal') {
        router.push(`${pathname}?modal=edit&id=${record.id}`);
      } else {
        router.push(href);
      }
    };

    return (
      <IconButton onClick={handleClick} size="small">
        <PencilIcon size={16} />
      </IconButton>
    );
  }

  // 📎 Clickable labels (e.g. title fields)
  if (field.clickable) {
    const openMode = field.openMode || config?.openMode || 'modal';
    const href = config?.editPathPrefix
      ? `${config.editPathPrefix}/${record.id}`
      : `/${config?.name}/${record.id}`;

    const handleClick = () => {
      if (openMode === 'modal') {
        router.push(`${pathname}?modal=edit&id=${record.id}`);
      } else {
        router.push(href);
      }
    };

    return (
      <Typography
        variant="body2"
        onClick={handleClick}
        sx={{
          cursor: 'pointer',
          color: 'primary.main',
          '&:hover': { textDecoration: 'underline' }
        }}
      >
        {value}
      </Typography>
    );
  }

  // 🔤 Default fallback
  return <Typography variant="body2">{value.toString()}</Typography>;
};

