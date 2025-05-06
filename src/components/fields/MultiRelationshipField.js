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

      let query = supabase.from(table).select(`id, ${labelField}, parent_id`);
      Object.entries(filter).forEach(([key, val]) => {
        query = query.eq(key, val);
      });

      const { data, error } = await query;

      if (error) {
        console.error('[MultiRelationshipField] Failed to load options:', error);
      } else {
        const tree = buildTree(data);
        const flat = flattenTreeWithIndent(tree, 0);
        setOptions(flat);
      }

      setLoading(false);
    };

    loadOptions();
  }, [field]);

  const buildTree = (items) => {
    const map = new Map();
    const roots = [];

    // Create map of id to item
    items.forEach(item => {
      map.set(item.id, { ...item, children: [] });
    });

    // Assign children to parents
    map.forEach(item => {
      if (item.parent_id && map.has(item.parent_id)) {
        map.get(item.parent_id).children.push(item);
      } else {
        roots.push(item);
      }
    });

    return roots;
  };

  const flattenTreeWithIndent = (nodes, depth = 0) => {
    // Alphabetically sort each level by labelField
    const sortedNodes = [...nodes].sort((a, b) => {
      const aLabel = (a[labelField] || '').toLowerCase();
      const bLabel = (b[labelField] || '').toLowerCase();
      return aLabel.localeCompare(bLabel);
    });

    return sortedNodes.flatMap(node => {
      const prefix = '—'.repeat(depth);
      const label = node[labelField]?.trim() || 'Untitled';
      const formatted = {
        ...node,
        indentedLabel: `${prefix} ${label}`.trim()
      };
      return [formatted, ...flattenTreeWithIndent(node.children || [], depth + 1)];
    });
  };

  const normalizedValue = useMemo(() => {
    return Array.isArray(value) ? value.map(String) : [];
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
      console.warn('Missing parentId or junctionTable.');
      return;
    }

    try {
      const { error: deleteError } = await supabase
        .from(junctionTable)
        .delete()
        .eq(sourceKey, parentId);

      if (deleteError) {
        console.error('[MultiRelationshipField] Failed deleting old relations:', deleteError);
      }

      if (selectedIds.length > 0) {
        const newLinks = selectedIds.map(id => ({
          [sourceKey]: parentId,
          [targetKey]: id
        }));

        const { error: insertError } = await supabase
          .from(junctionTable)
          .insert(newLinks);

        if (insertError) {
          console.error('[MultiRelationshipField] Failed inserting new relations:', insertError);
        }
      }

      const { data: linkedData, error: fetchError } = await supabase
        .from(field.relation.table)
        .select(`id, ${field.relation.labelField}`)
        .in('id', selectedIds);

      if (fetchError) {
        console.error('[MultiRelationshipField] Failed fetching new data:', fetchError);
      }

      onChange(field, {
        ids: selectedIds.map(String),
        details: linkedData || [],
      });

      if (linkedData) {
        const newOptions = Array.from(
          new Map([...options, ...linkedData].map(item => [item.id, item])).values()
        );
        setOptions(newOptions);
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
          const label = option?.indentedLabel || option?.[labelField]?.trim();
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
