'use client';

import { useEffect, useState } from 'react';
import { Typography, Switch, IconButton, TextField, Box, Checkbox, FormControlLabel, Select, MenuItem, Tooltip } from '@mui/material';
import { PencilSimple as PencilIcon } from '@phosphor-icons/react';
import { useRouter, usePathname } from 'next/navigation';
import { ArrowSquareOut } from '@phosphor-icons/react';
import { BrandBoardPreview } from '@/components/BrandBoardPreview';

import { MultiRelationshipField } from '@/components/fields/relationships/multi/MultiRelationshipField';
import { RelationshipField } from '@/components/fields/RelationshipField';
import { LinkField } from '@/components/fields/LinkField';
import { SimpleEditor } from '@/components/tiptap/components/tiptap-templates/simple/simple-editor';
import { TimezoneSelect } from '@/components/fields/TimezoneSelect';
import { MediaField } from '@/components/fields/MediaField';
import { TimestampField } from '@/components/fields/TimestampField';
import { ColorField } from '@/components/fields/ColorField';
import { ElementMap } from '@/components/ElementMap';
import { debounce } from '@/lib/utils/debounce';
import { TimeTrackerField } from '@/components/fields/time/timer/TimeTrackerField';
import { 
  normalizeSelectValue, 
  extractSelectValue, 
  processSelectChange 
} from '@/components/fields/SelectField';
import CascadeRefreshButton from '@/components/views/timeline/CascadeRefreshButton';
import { useAutoUpdateTasks } from '@/hooks/useAutoUpdateTasks';


export const isIncludedInView = (field, view = 'table') => {
  if (!field || typeof field !== 'object') return false;
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
    onChange(newValue); // ✅ just send value, not field
  };
  

  let content = null;

  switch (field.type) {
    case 'relationship': {
      const labelField = field.relation?.labelField || 'title';
      const relatedKey = field.name.replace('_id', ''); // e.g., company_id -> company
      const relatedLabel = record?.[relatedKey]?.[labelField];
    
      content = isEditMode ? (
        <RelationshipField
          field={{ ...field, parentId: record?.id, parentTable: config?.name }}
          value={localValue}
          editable
          onChange={handleUpdate}
          record={record}
        />
      ) : (
        <Typography variant="body2">
          {relatedLabel || '—'}
        </Typography>
      );
      break;
    }

    case 'multiRelationship':
      content = editable ? (
        <MultiRelationshipField
          field={{ ...field, parentId: record.id, parentTable: config?.name }}  // Added parentTable
          value={Array.isArray(record?.[field.name]) ? record[field.name] : []}
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
            handleUpdate(html); // ✅ consistent
          }, 800)}
        />
      ) : (
        localValue ? (
          <div dangerouslySetInnerHTML={{ __html: localValue }} />
        ) : (
          <Typography variant="body2">—</Typography>
        )
      );
      break;
    

   

      case 'media': {
        const fieldName = field.name;
        const recordFieldDetails = record?.[`${fieldName}_details`];
      
        content = (
          <MediaField
            field={field}
            record={record}
            config={config}
            value={localValue}
            onChange={(newId) => handleUpdate(newId)}
          />
        );
        break;      
    }

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
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <TextField
              variant="outlined"
              size="small"
              value={localValue || ''}
              onChange={(e) => handleUpdate(e.target.value)}
              placeholder={field.label || 'Enter link'}
              sx={{
                flexGrow: 1,
                minWidth: 0, // 🚨 Crucial: allows shrinking
                '& .MuiInputBase-root': {
                  pr: '8px' // ensure padding isn't interfering
                }
              }}
              InputProps={{
                sx: {
                  height: '100%',
                },
              }}
            />
            {!!localValue && (
              <Tooltip title="Open link" arrow>
                <IconButton
                  component="a"
                  href={localValue}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="small"
                  sx={{ ml: 1, flexShrink: 0 }}
                >
                  <ArrowSquareOut size={16} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        ) : (
          <LinkField value={localValue} field={field} />
        );
        break;




      

case 'date': {
  const isDueDate = field.name === 'due_date';

  content = isEditMode ? (
    <Box display="flex" alignItems="center" gap={1}>
      <TextField
        fullWidth
        type="date"
        size="small"
        value={localValue || ''}
        onChange={(e) => handleUpdate(e.target.value)}
        InputLabelProps={{ shrink: true }}
      />
      {isDueDate && record?.milestone_id && record?.project_id && (
        <CascadeRefreshButton
          taskId={record.id}
          milestoneId={record.milestone_id}
          projectId={record.project_id}
        />
      )}
    </Box>
  ) : (
    <Typography variant="body2">
      {localValue ? new Date(localValue).toLocaleDateString() : '—'}
    </Typography>
  );
  break;
}

      case 'boolean':
        content = isEditMode ? (
          <FormControlLabel
            control={
              <Switch
                checked={!!localValue}
                onChange={(e) => handleUpdate(e.target.checked)}
              />
            }
           
          />
        ) : (
          <Typography variant="body2">{localValue ? 'Yes' : 'No'}</Typography>
        );
        break;
      

case 'select':
case 'status': {
  // ✅ Only run task status update logic if this field is 'status'
  if (field.name === 'status') {
    useAutoUpdateTasks(record); // Hook runs only if needed
  }

  // Normalize the value for consistent handling
  const normalizedValue = normalizeSelectValue(localValue, field.options);
  const rawValue = extractSelectValue(normalizedValue);

  content = isEditMode ? (
    <Select
      fullWidth
      size="small"
      value={rawValue || ''}
      onChange={(e) => {
        const selectedValue = e.target.value;

        const selectedLabel =
          (field.options || []).find((opt) => opt.value === selectedValue)?.label || selectedValue;

        // Always create a value/label pair - this is important for UI display
        const processedValue = {
          value: selectedValue,
          label: selectedLabel
        };

        handleUpdate(processedValue);
      }}
      displayEmpty
      renderValue={(selected) => {
        if (!selected) return 'Select an option';
        const matchedOption = (field.options || []).find((opt) => opt.value === selected);
        return matchedOption ? matchedOption.label : selected;
      }}
    >
      <MenuItem value="">
        <em>None</em>
      </MenuItem>
      {(field.options || []).map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </Select>
  ) : (
    <Typography variant="body2">
      {normalizeSelectValue(localValue, field.options).label || '—'}
    </Typography>
  );
  break;
}
      
      
      case 'color':
        content = isEditMode ? (
          <ColorField
            value={localValue || '#000000'}
            onChange={(value) => handleChange(field.name, value)}
          />
        ) : (
          <Box
            sx={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              backgroundColor: localValue || '#000000',
              border: '1px solid #ccc',
              display: 'inline-block',
            }}
            title={localValue}
          />
        );
        break;




        case 'custom': {
          if (field.component === 'BrandBoardPreview') {
            content = <BrandBoardPreview brand={record} />;
          } else if (field.component === 'ElementMap') {
            content = <ElementMap projectId={record.id} />;
          } else if (field.component === 'TimeTrackerField') {
            content = <TimeTrackerField task={record} />;
          } else {
            return null;
          }
          break;
        }
        
        
      

    case 'json':
      content = <pre>{JSON.stringify(localValue, null, 2)}</pre>;
      break;

    case 'timestamp':
      content = (
        <TimestampField
          field={field}
          value={localValue}
          editable={isEditMode}
          mode={mode}
          onChange={(f, val) => {
            handleUpdate(val);
          }}
        />
      );
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
          onChange={(e) => {
            const next = e.target.value;

            setLocalValue(next);
          }}
          onBlur={() => {

            onChange(localValue);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onChange(localValue);
            }
          }}
          
          placeholder={field.label || ''}
        />
      ) : (
        <Typography variant="body2">{localValue ?? '—'}</Typography>
      );
      break;
    
  }

  return content;
};