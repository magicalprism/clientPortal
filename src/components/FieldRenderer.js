'use client';

import { useEffect, useState } from 'react';
import { Typography, IconButton } from '@mui/material';
import { PencilSimple as PencilIcon } from '@phosphor-icons/react';
import { useRouter, usePathname } from 'next/navigation';
import { MultiRelationshipField } from '@/components/fields/MultiRelationshipField';
import { RelationshipField } from '@/components/fields/RelationshipField';
import { LinkField } from '@/components/fields/LinkField';


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
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  if (!isIncludedInView(field, view)) return null;
  if (field.format) return field.format(localValue, field, record);

  const handleUpdate = (fieldName, newValue) => {
    setLocalValue(newValue);
    onChange(fieldName, newValue);
  };

  // === Relationship (single)
  if (editable && field.type === 'relationship') {
    return (
      <RelationshipField
        field={field}
        value={localValue}
        editable={editable}
        onChange={handleUpdate}
      />
    );
  }

  // === Multi relationship (pivot table)
  if (editable && field.type === 'multiRelationship') {
    return (
      <MultiRelationshipField
        field={{ ...field, parentId: record.id }} // ✅ Pass parent project ID
        value={localValue}
        onChange={handleUpdate}
      />
    );
  }

  // === Media
  if (field.type === 'media') {
    if (!localValue) return '—';
    return (
      <img
        src={localValue}
        alt={field.label}
        style={{ maxWidth: '100%', borderRadius: 8 }}
        onError={(e) => (e.currentTarget.style.display = 'none')}
      />
    );
  }

  // Link
  if (field.type === 'link') {
    return <LinkField value={localValue} field={field} record={record} />;
  }
  

  if (field.type === 'date') return localValue ? new Date(localValue).toLocaleDateString() : '—';
  if (field.type === 'boolean') return localValue ? 'Yes' : 'No';
  if (field.type === 'status') return <span style={{ textTransform: 'capitalize' }}>{localValue}</span>;
  if (field.type === 'json') return <pre>{JSON.stringify(localValue, null, 2)}</pre>;

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

  if ((field.clickable || field.name === 'title') && view === 'table') {
    const handleClick = () => {
      router.push(`${pathname}?modal=edit&id=${record.id}`);
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
        {localValue || '—'}
      </Typography>
    );
  }
  

  return <Typography variant="body2">{localValue ?? '—'}</Typography>;
};
