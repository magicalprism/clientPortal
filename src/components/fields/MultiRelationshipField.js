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
    const selectedIds = selectedOptionObjects.map(opt => opt.id);
    const parentId = field.parentId;
    const junctionTable = field.relation?.junctionTable;
    const sourceKey = field.relation?.sourceKey || `${field.parentTable}_id`;
    const targetKey = field.relation?.targetKey || `${field.relation.table}_id`;
  
    if (!parentId || !junctionTable) {
      console.warn('Missing parentId or junctionTable. Cannot update pivot table.');
      return;
    }
  
    try {
      // Delete old pivot rows
      const { error: deleteError } = await supabase
        .from(junctionTable)
        .delete()
        .eq(sourceKey, parentId);
  
      if (deleteError) {
        console.error(`[MultiRelationshipField] ❌ Failed to delete old relations:`, deleteError);
      }
  
      // Insert new pivot rows
      if (selectedIds.length > 0) {
        const newLinks = selectedIds.map(id => ({
          [sourceKey]: parentId,
          [targetKey]: id
        }));
  
        const { error: insertError } = await supabase
          .from(junctionTable)
          .insert(newLinks);
  
        if (insertError) {
          console.error(`[MultiRelationshipField] ❌ Failed to insert new relations:`, insertError);
        }
      }
  
      // Fetch updated details
      const { data: linkedData, error: fetchError } = await supabase
        .from(field.relation.table)
        .select(`id, ${field.relation.labelField}`)
        .in('id', selectedIds);
  
      if (fetchError) {
        console.error('[MultiRelationshipField] ❌ Failed to fetch updated linked data:', fetchError);
      } else {
        // Update local UI state
        onChange(field, {
          ids: selectedIds.map(String),
          details: linkedData || [],
        });
      }
    } catch (err) {
      console.error('[MultiRelationshipField] ❌ Unexpected pivot update error:', err);
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
