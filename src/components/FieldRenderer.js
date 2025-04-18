'use client';

import { useEffect, useState } from 'react';
import { Typography, IconButton, TextField } from '@mui/material';
import { PencilSimple as PencilIcon } from '@phosphor-icons/react';
import { useRouter, usePathname } from 'next/navigation';

import { MultiRelationshipField } from '@/components/fields/MultiRelationshipField';
import { RelationshipField } from '@/components/fields/RelationshipField';
import { LinkField } from '@/components/fields/LinkField';
import { SimpleEditor } from '@/components/tiptap/components/tiptap-templates/simple/simple-editor';
import { TimezoneSelect } from '@/components/fields/TimezoneSelect';

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
  isEditing = false,
  onChange = () => {},
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  if (!isIncludedInView(field, view)) return null;
  if (field.format) return field.format(localValue, field, record);

  const handleUpdate = (newValue) => {
    setLocalValue(newValue);
    onChange(field.name, newValue);
  };

  let content = null;

  switch (field.type) {
    case 'relationship':
      content = editable ? (
        <RelationshipField
          field={{ ...field, parentId: record.id, parentTable: config.name }}
          value={localValue}
          editable
          onChange={handleUpdate}
        />
      ) : null;
      break;

    case 'multiRelationship':
      content = editable ? (
        <MultiRelationshipField
          field={{ ...field, parentId: record.id }}
          value={localValue}
          onChange={handleUpdate}
        />
      ) : null;
      break;

    case 'richText':
      content =
        !editable && !localValue ? (
          '—'
        ) : (
          <>
    <SimpleEditor
        content={localValue}
        editable={editable}
        onChange={(html) => setLocalValue(html)}
      />
      {editable && (
        <Box mt={2} display="flex" justifyContent="flex-end">
          <button
            style={{
              padding: '6px 12px',
              backgroundColor: '#1976d2',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
            }}
            onClick={() => handleUpdate(localValue)}
          >
            Save
          </button>
        </Box>
      )}
    </>

        );
      break;

    case 'media':
      content = localValue ? (
        <img
          src={localValue}
          alt={field.label}
          style={{ maxWidth: '100%', borderRadius: 8 }}
          onError={(e) => (e.currentTarget.style.display = 'none')}
        />
      ) : (
        '—'
      );
      break;

    case 'timezone':
      content = (
        <TimezoneSelect
          value={typeof localValue === 'string' ? localValue : ''}
          onChange={onChange}
          name={field.name}
          parentId={record?.id}
          parentTable={config?.name}
        />
      );
      break;

    case 'link':
      content = isEditing ? (
        <TextField
          fullWidth
          variant="outlined"
          size="small"
          value={localValue || ''}
          onChange={(e) => handleUpdate(e.target.value)}
          placeholder={field.label || 'Enter link'}
        />
      ) : (
        <LinkField value={localValue} field={field} record={record} />
      );
      break;

    case 'date':
      content = localValue ? new Date(localValue).toLocaleDateString() : '—';
      break;

    case 'boolean':
      content = localValue ? 'Yes' : 'No';
      break;

    case 'status':
      content = <span style={{ textTransform: 'capitalize' }}>{localValue}</span>;
      break;

    case 'json':
      content = <pre>{JSON.stringify(localValue, null, 2)}</pre>;
      break;

    case 'editButton': {
      const href = config?.editPathPrefix
        ? `${config.editPathPrefix}/${record.id}`
        : `/${config?.name}/${record.id}`;

      const handleClick = () => {
        router.push(
          config?.openMode === 'modal'
            ? `${pathname}?modal=edit&id=${record.id}`
            : href
        );
      };

      content = (
        <IconButton onClick={handleClick} size="small">
          <PencilIcon size={16} />
        </IconButton>
      );
      break;
    }

    default:
      if ((field.clickable || field.name === 'title') && view === 'table') {
        const handleClick = () => {
          router.push(`${pathname}?modal=edit&id=${record.id}`);
        };
        content = (
          <Typography
            variant="body2"
            onClick={handleClick}
            sx={{
              cursor: 'pointer',
              color: 'primary.main',
              '&:hover': { textDecoration: 'underline' },
            }}
          >
            {localValue || '—'}
          </Typography>
        );
      } else {
        content = <Typography variant="body2">{localValue ?? '—'}</Typography>;
      }
  }

  return content;
};
