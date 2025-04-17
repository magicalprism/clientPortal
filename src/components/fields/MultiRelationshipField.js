'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  CircularProgress,
  FormControl,
  IconButton,
  TextField,
  Chip,
  Autocomplete
} from '@mui/material';
import { Plus } from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';

export const MultiRelationshipField = ({ field, value = [], onChange }) => {
  const router = useRouter();
  const supabase = createClient();
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);

  const labelField = field.relation?.labelField || 'title';

  useEffect(() => {
    const loadOptions = async () => {
      const { table, filter = {} } = field.relation || {};
      if (!table || !labelField) return;

      let query = supabase.from(table).select(`id, ${labelField}`);
      Object.entries(filter).forEach(([key, val]) => {
        query = query.eq(key, val);
      });

      const { data, error } = await query;

      if (error) {
        console.error('[MultiRelationshipField] Failed to load options:', error);
      } else {
        const uniqueOptions = Array.from(
          new Map(data.map(item => [item.id, item])).values()
        );
        setOptions(uniqueOptions);
      }

      setLoading(false);
    };

    loadOptions();
  }, [field]);

  const normalizedValue = useMemo(() => {
    const val = Array.isArray(value) ? value.map(String) : [];
    return val;
  }, [value]);

  const selectedObjects = useMemo(() => {
    return normalizedValue
      .map(id => options.find(opt => String(opt.id) === id))
      .filter(Boolean);
  }, [options, normalizedValue]);

  const handleChange = async (event, selectedOptionObjects) => {
    const taskIds = selectedOptionObjects.map(opt => parseInt(opt.id, 10));
    const projectId = field.parentId; // Pass this in from FieldRenderer or CollectionItemPage

    onChange(field.name, taskIds.map(String)); // update UI state

    if (!projectId || isNaN(projectId)) {
      console.warn('Missing or invalid project ID. Cannot update pivot table.');
      return;
    }

    try {
      // 1. Delete existing pivot records
      const { error: deleteError } = await supabase
        .from('project_task')
        .delete()
        .eq('project_id', projectId);

      if (deleteError) {
        console.error('Failed to clear old project_task:', deleteError);
      }

      // 2. Insert new pivot records
      const newLinks = taskIds.map(taskId => ({
        project_id: projectId,
        task_id: taskId
      }));

      const { error: insertError } = await supabase
        .from('project_task')
        .insert(newLinks);

      if (insertError) {
        console.error('Failed to insert new project_tasks:', insertError);
      }
    } catch (err) {
      console.error('Unexpected pivot save error:', err);
    }
  };

  return (
    <FormControl
      fullWidth
      size="small"
      sx={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 1
      }}
    >
      <Autocomplete
        multiple
        options={options}
        loading={loading}
        value={selectedObjects}
        onChange={handleChange}
        getOptionLabel={(option) => {
          const label = option?.[labelField]?.trim();
          return label ? `${label} (${option.id})` : `Untitled (${option.id})`;
        }}
        isOptionEqualToValue={(option, value) =>
          String(option.id) === String(value.id)
        }
        renderTags={(selected, getTagProps) =>
          selected.map((option, index) => (
            <Chip
              {...getTagProps({ index })}
              key={`chip-${option.id}`}
              label={
                option?.[labelField]?.trim()
                  ? `${option[labelField]} (${option.id})`
                  : `Untitled (${option.id})`
              }
            />
          ))
        }
        renderInput={(params) => (
          <TextField
            {...params}
            label={`Select ${field.label}`}
            placeholder="Search..."
            size="small"
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading ? <CircularProgress size={16} /> : null}
                  {params.InputProps.endAdornment}
                </>
              )
            }}
          />
        )}
        sx={{ flexGrow: 1, minWidth: 300 }}
      />

      {!!field.relation?.linkTo && (
        <IconButton
          size="small"
          sx={{ alignSelf: 'center' }}
          onClick={() => {
            const params = new URLSearchParams({
              modal: 'create',
              refField: field.name
            });

            const fallbackUrl = `/dashboard/${field.relation?.table}`;
            const linkTo = field.relation?.linkTo || fallbackUrl;

            router.push(`?modal=create&refField=${field.name}`, { scroll: false });
          }}
          title={`Create new ${field.label}`}
        >
          <Plus size={16} />
        </IconButton>
      )}
    </FormControl>
  );
};
