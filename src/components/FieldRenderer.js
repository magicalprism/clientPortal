'use client';

import { useEffect, useState } from 'react';
import { Typography, IconButton, TextField, Box, Checkbox, FormControlLabel, Select, MenuItem } from '@mui/material';
import { PencilSimple as PencilIcon } from '@phosphor-icons/react';
import { useRouter, usePathname } from 'next/navigation';

import { MultiRelationshipField } from '@/components/fields/MultiRelationshipField';
import { RelationshipField } from '@/components/fields/RelationshipField';
import { LinkField } from '@/components/fields/LinkField';
import { SimpleEditor } from '@/components/tiptap/components/tiptap-templates/simple/simple-editor';
import { TimezoneSelect } from '@/components/fields/TimezoneSelect';
import { MediaField } from '@/components/fields/MediaField';

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
  mode = 'view',
  editable = false,
  isEditing = false,
  onChange = () => {},
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const [localValue, setLocalValue] = useState(value);

  const isEditMode = editable || mode === 'create';

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  if (!isIncludedInView(field, view)) return null;
  if (field.format) return field.format(localValue, field, record);

  const handleUpdate = (newValue) => {
    setLocalValue(newValue);
    onChange(field, newValue);
  };

  let content = null;

  switch (field.type) {
    case 'relationship':
      content = isEditMode ? (
        <RelationshipField
          field={{ ...field, parentId: record?.id, parentTable: config?.name }}
          value={localValue}
          editable
          onChange={handleUpdate}
          record={record}
        />
      ) : null;
      break;

    case 'multiRelationship':
      content = isEditMode ? (
        <MultiRelationshipField
          field={{ ...field, parentId: record?.id }}
          value={localValue}
          onChange={handleUpdate}
        />
      ) : null;
      break;

      case 'richText':
        content = isEditMode ? (
          <SimpleEditor
            content={localValue || ''}
            editable={true}
            onChange={debounce((html) => {
              setLocalValue(html);
              onChange(field, html); // ✅ This now not only updates local but properly calls parent save
            }, 800)} // 800ms debounce
          />
        ) : (
          localValue ? (
            <div dangerouslySetInnerHTML={{ __html: localValue }} />
          ) : (
            <Typography variant="body2">—</Typography>
          )
        );
        break;


        case 'media':
          console.log('🔍 [FieldRenderer] media field debug:', {
            localValue,
            recordFieldDetails: record?.[field.name + '_details'],
            fieldName: field.name,
          });
        
          content = isEditMode ? (
            <MediaField
              field={field}
              record={record}
              config={config}
              value={localValue}
              onChange={(newId) => handleUpdate(newId)}
            />
          ) : (
            localValue?.url ? (
              <Box sx={{ width: 150, height: 150, position: 'relative' }}>
                <img
                  src={localValue.url}
                  alt={localValue.alt_text || field.label}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }}
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
              </Box>
            ) : record?.[field.name + '_details']?.url ? (
              <Box sx={{ width: 150, height: 150, position: 'relative' }}>
                <img
                  src={record[field.name + '_details'].url}
                  alt={record[field.name + '_details'].alt_text || field.label}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }}
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
              </Box>
            ) : (
              <Typography variant="body2">No media uploaded</Typography>
            )
          );
          break;
        
        

    case 'timezone':
      content = isEditMode ? (
        <TimezoneSelect
          value={typeof localValue === 'string' ? localValue : ''}
          onChange={handleUpdate}
          name={field.name}
          parentId={record?.id}
          parentTable={config?.name}
        />
      ) : (
        <Typography variant="body2">{localValue ?? '—'}</Typography>
      );
      break;

    case 'link':
      content = isEditMode ? (
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
      content = isEditMode ? (
        <TextField
          fullWidth
          type="date"
          size="small"
          value={localValue || ''}
          onChange={(e) => handleUpdate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
      ) : (
        <Typography variant="body2">{localValue ? new Date(localValue).toLocaleDateString() : '—'}</Typography>
      );
      break;

    case 'boolean':
      content = isEditMode ? (
        <FormControlLabel
          control={
            <Checkbox
              checked={!!localValue}
              onChange={(e) => handleUpdate(e.target.checked)}
            />
          }
          label={field.label || ''}
        />
      ) : (
        <Typography variant="body2">{localValue ? 'Yes' : 'No'}</Typography>
      );
      break;

    case 'status':
      content = <span style={{ textTransform: 'capitalize' }}>{localValue}</span>;
      break;

    case 'select':
      content = isEditMode ? (
        <Select
          fullWidth
          size="small"
          value={localValue || ''}
          onChange={(e) => handleUpdate(e.target.value)}
          displayEmpty
        >
          {(field.options || []).map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      ) : (
        <Typography variant="body2">
          {(field.options || []).find((opt) => opt.value === localValue)?.label || '—'}
        </Typography>
      );
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
      content = isEditMode ? (
        <TextField
          fullWidth
          size="small"
          value={localValue || ''}
          onChange={(e) => handleUpdate(e.target.value)}
          placeholder={field.label || ''}
        />
      ) : (
        <Typography variant="body2">{localValue ?? '—'}</Typography>
      );
  }

  return content;
};
