'use client';

import { useMemo } from 'react';
import {
  FormControl,
  Autocomplete,
  TextField,
  Chip,
  CircularProgress,
  IconButton
} from '@mui/material';
import { Plus } from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';

import { useMultiRelationOptions } from './useMultiRelationOptions';
import { useMultiRelationSync } from './useMultiRelationSync';

export const MultiRelationshipField = ({ field, value = [], onChange }) => {
  const router = useRouter();
  const { options, loading, setOptions } = useMultiRelationOptions({ field });
  const { syncMultiRelation } = useMultiRelationSync();

  const labelField = field.relation?.labelField || 'title';
  const parentId = field.parentId;

  const normalizedValue = useMemo(() => value.map(String), [value]);

  const selectedObjects = useMemo(
    () => normalizedValue.map(id => options.find(opt => String(opt.id) === id)).filter(Boolean),
    [options, normalizedValue]
  );

const handleChange = async (_, selectedOptionObjects) => {
  const selectedIds = selectedOptionObjects.map(opt => opt.id);

  const selectedDetails = selectedOptionObjects.map(opt => ({
    id: opt.id,
    [labelField]: opt[labelField]
  }));

  onChange(selectedIds);

   const linkedData = await syncMultiRelation({
    field,
    parentId,
    selectedIds,
    options,
    onChange: () => {} // We've already called onChange above
  });

  if (linkedData) {
    const newOptions = Array.from(
      new Map([...options, ...linkedData].map(item => [item.id, item])).values()
    );
    setOptions(newOptions);
  }
};

  return (
    <FormControl fullWidth size="small" sx={{ display: 'flex', flexDirection: 'row', gap: 1 }}>
     <Autocomplete
  multiple
  loading={loading}
  options={options}
  value={selectedObjects}
  onChange={handleChange}
  getOptionLabel={(option) =>
    // 👇 remove duplicate-prone formatting here
    typeof option === 'string' ? option : `${option[labelField]} (${option.id})`
  }
  isOptionEqualToValue={(option, value) => String(option.id) === String(value.id)}
  getOptionKey={(option) => option.id} // 👈 if supported, else see below
  renderTags={(selected, getTagProps) =>
    selected.map((option, index) => {
      const { key: _, ...restChipProps } = getTagProps({ index });
      return (
        <Chip
          key={`chip-${option.id}`}
          label={`${option[labelField] || 'Untitled'} (${option.id})`}
          {...restChipProps}
        />
      );
    })
  }
  renderOption={(props, option) => (
    <li {...props} key={`opt-${option.id}`}>
      {`${option.indentedLabel || option[labelField]} (${option.id})`}
    </li>
  )}
  renderInput={(params) => (
    <TextField
      {...params}
      label={`Select ${field.label}`}
      placeholder="Search..."
      InputProps={{
        ...params.InputProps,
        endAdornment: (
          <>
            {loading && <CircularProgress size={16} />}
            {params.InputProps.endAdornment}
          </>
        ),
      }}
    />
  )}
  sx={{ flexGrow: 1, minWidth: 300 }}
/>


      {!!field.relation?.linkTo && (
        <IconButton
          size="small"
          onClick={() =>
            router.push(`?modal=create&refField=${field.name}`, { scroll: false })
          }
          title={`Create new ${field.label}`}
        >
          <Plus size={16} />
        </IconButton>
      )}
    </FormControl>
  );
};
