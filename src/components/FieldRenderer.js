'use client';

import { useEffect, useState } from 'react';
import {
  Typography,
  IconButton,
  Select,
  MenuItem,
  CircularProgress,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  PencilSimple as PencilIcon,
  Eye,
  Plus
} from '@phosphor-icons/react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';

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

  // Load relationship options
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

  if (!isIncludedInView(field, view)) return null;

  if (field.format) {
    return field.format(value, field, record);
  }

  // Editable Relationship Field
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

        {/* View Button */}
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

        {/* Create New Button */}
        {!!field.relation?.linkTo && (
          <IconButton
            size="small"
            sx={{ ml: 1 }}
            onClick={() => {
              const base = field.relation.linkTo;
              const searchParams = new URLSearchParams({
                modal: 'create',
                refField: field.name
              });
              router.push(`${base}?${searchParams.toString()}`);
            }}
            title={`Create new ${field.label}`}
          >
            <Plus size={16} />
          </IconButton>
        )}
      </FormControl>
    );
  }

  // === Static Renders ===

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

  if (field.type === 'date') {
    return value ? new Date(value).toLocaleDateString() : '—';
  }

  if (field.type === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (field.type === 'status') {
    return <span style={{ textTransform: 'capitalize' }}>{value}</span>;
  }

  if (field.type === 'json') {
    return (
      <pre style={{ fontSize: '0.85em', whiteSpace: 'pre-wrap' }}>
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  }

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

  if (value == null || value === '') return '—';

  return <Typography variant="body2">{value.toString()}</Typography>;
};
