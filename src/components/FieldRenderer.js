'use client';

import { Typography, IconButton } from '@mui/material';
import { PencilSimple as PencilIcon } from '@phosphor-icons/react';
import { useRouter, usePathname } from 'next/navigation';

/**
 * Helper to determine if a field should be shown in a specific view (table, modal, edit, etc.)
 */
const isIncludedInView = (field, view) => {
  if (!field.includeInViews) return true;
  if (field.includeInViews.length === 1 && field.includeInViews[0] === 'none') return false;
  return field.includeInViews.includes(view);
};

export const FieldRenderer = ({ value, field, record, config, view = 'default' }) => {
  const router = useRouter();
  const pathname = usePathname();

  if (!isIncludedInView(field, view)) return null;

  if (field.format) {
    return field.format(value, field, record);
  }

  if (value == null || value === '') return '—';

  switch (field.type) {
    case 'date':
      return new Date(value).toLocaleDateString();

    case 'currency':
      return `$${Number(value).toFixed(2)}`;

    case 'media':
      return (
        <img
          src={value}
          alt={field.label}
          style={{ maxWidth: '100%', borderRadius: 8 }}
          onError={(e) => (e.target.style.display = 'none')}
        />
      );

    case 'link':
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

    case 'relationship': {
      const label = record?.[`${field.name}_label`] || `ID: ${value}`;
      const href = `${field.relation?.linkTo || '#'}${value ? `/${value}` : ''}`;
      return (
        <a href={href} style={{ textDecoration: 'none', color: '#1976d2' }}>
          {label}
        </a>
      );
    }

    case 'boolean':
      return value ? 'Yes' : 'No';

    case 'status':
      return <span style={{ textTransform: 'capitalize' }}>{value}</span>;

    case 'json':
      return (
        <pre style={{ fontSize: '0.85em', whiteSpace: 'pre-wrap' }}>
          {JSON.stringify(value, null, 2)}
        </pre>
      );

      case 'editButton': {
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
      

    default:
      return <Typography variant="body2">{value.toString()}</Typography>;
  }
};
