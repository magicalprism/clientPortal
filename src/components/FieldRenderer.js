'use client';

import { useEffect, useState } from 'react';
import {
  Typography,
  IconButton,
  Select,
  MenuItem,
  CircularProgress,
  FormControl,
  Checkbox,
  ListItemText
} from '@mui/material';
import {
  PencilSimple as PencilIcon,
  Eye,
  Plus
} from '@phosphor-icons/react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';
import { MultiRelationshipField } from '@/components/fields/MultiRelationshipField';

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

  useEffect(() => {
    const loadOptions = async () => {
      if (!['relationship', 'multiRelationship'].includes(field.type) || !editable) return;

      const { table, labelField, filter = {} } = field.relation || {};
      if (!table || !labelField) return;

      setLoading(true);
      let query = supabase.from(table).select(`id, ${labelField}`);
      Object.entries(filter).forEach(([key, val]) => {
        query = query.eq(key, val);
      });

      const { data } = await query;
      if (data) {
        setOptions(data.sort((a, b) =>
          (a[labelField] || '').localeCompare(b[labelField] || '')
        ));
      }

      setLoading(false);
    };

    loadOptions();
  }, [field, editable]);

  if (!isIncludedInView(field, view)) return null;
  if (field.format) return field.format(value, field, record);

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

  // === Single relationship
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
  }

  // === Multi relationship
  if (editable && field.type === 'multiRelationship') {
    return (
      <MultiRelationshipField
        field={field}
        value={value}
        onChange={onChange}
      />
    );
  }

  // === Static views
  if (field.type === 'media') {
    if (!value || value === '') return '—';
    return (
      <img
        src={value || undefined}
        alt={field.label}
        style={{ maxWidth: '100%', borderRadius: 8 }}
        onError={(e) => (e.currentTarget.style.display = 'none')}
      />
    );
  }

  if (field.type === 'link') {
    return (
      <a href={value} target="_blank" rel="noopener noreferrer" style={{ color: '#1976d2' }}>
        {field.displayLabel || value}
      </a>
    );
  }

  if (field.type === 'date') return value ? new Date(value).toLocaleDateString() : '—';
  if (field.type === 'boolean') return value ? 'Yes' : 'No';
  if (field.type === 'status') return <span style={{ textTransform: 'capitalize' }}>{value}</span>;
  if (field.type === 'json') return <pre>{JSON.stringify(value, null, 2)}</pre>;

  if (field.type === 'editButton') {
    const href = config?.editPathPrefix
      ? `${config.editPathPrefix}/${record.id}`
      : `/${config?.name}/${record.id}`;
    const handleClick = () => {
      router.push(config?.openMode === 'modal'
        ? `${pathname}?modal=edit&id=${record.id}`
        : href
      );
    };
    return (
      <IconButton onClick={handleClick} size="small">
        <PencilIcon size={16} />
      </IconButton>
    );
  }

  if (field.clickable) {
    const href = config?.editPathPrefix
      ? `${config.editPathPrefix}/${record.id}`
      : `/${config?.name}/${record.id}`;
    const handleClick = () => {
      router.push(config?.openMode === 'modal'
        ? `${pathname}?modal=edit&id=${record.id}`
        : href
      );
    };
    return (
      <Typography
        variant="body2"
        onClick={handleClick}
        sx={{ cursor: 'pointer', color: 'primary.main', '&:hover': { textDecoration: 'underline' } }}
      >
        {value}
      </Typography>
    );
  }

  return <Typography variant="body2">{value ?? '—'}</Typography>;
};
