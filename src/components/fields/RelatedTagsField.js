'use client';
import { useEffect, useState } from 'react';
import { Box, Typography, Chip, CircularProgress, Autocomplete, TextField } from '@mui/material';
import { useRelatedRecords } from '@/hooks/useRelatedRecords';
import { createClient } from '@/lib/supabase/browser';

export const RelatedTagsField = ({ field, parentId }) => {
  const supabase = createClient();
  const relatedItems = useRelatedRecords({ parentId, field });
  const [allOptions, setAllOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [localSelectedItems, setLocalSelectedItems] = useState([]);

  const {
    relation: { table, labelField, sourceKey, junctionTable, targetKey }
  } = field;

  // Fetch all possible tag options
  useEffect(() => {
    const fetchOptions = async () => {
      const { data, error } = await supabase.from(table).select(`id, ${labelField}`);
      if (error) {
        console.error('Error loading options:', error);
      } else {
        setAllOptions(
          (data || []).map(opt => ({
            ...opt,
            indentedLabel: opt[labelField] || `ID: ${opt.id}`
          }))
        );
      }
      setLoading(false);
    };

    fetchOptions();
  }, [table, labelField]);

  const handleChange = async (event, selectedItems) => {
    if (!parentId || !Array.isArray(selectedItems)) return;

    const selectedIds = selectedItems.map(item => item.id);
    const currentIds = relatedItems.map(item => item.id);

    const toAdd = selectedIds.filter(id => !currentIds.includes(id));
    const toRemove = currentIds.filter(id => !selectedIds.includes(id));

    // Optimistically update UI
    setLocalSelectedItems(
      selectedItems.map(item => ({
        ...item,
        indentedLabel: item.indentedLabel || item[labelField] || `ID: ${item.id}`
      }))
    );

    // Add new tags
    if (toAdd.length && junctionTable) {
      const insertData = toAdd.map(id => ({
        [sourceKey]: parentId,
        [targetKey]: id
      }));
      await supabase.from(junctionTable).insert(insertData);
    }

    // Remove deselected tags
    if (toRemove.length && junctionTable) {
      for (const id of toRemove) {
        await supabase
          .from(junctionTable)
          .delete()
          .match({ [sourceKey]: parentId, [targetKey]: id });
      }
    }
  };

  // Sync from relatedItems to local state
  useEffect(() => {
    if (Array.isArray(relatedItems)) {
      setLocalSelectedItems(
        relatedItems.map(item => ({
          ...item,
          indentedLabel: item.indentedLabel || item[labelField] || `ID: ${item.id}`
        }))
      );
    }
  }, [relatedItems]);

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        {field.label}
      </Typography>

      {loading ? (
        <CircularProgress size={20} />
      ) : (
        <Autocomplete
          multiple
          options={[...allOptions].sort((a, b) =>
            (a.indentedLabel || '').localeCompare(b.indentedLabel || '')
          )}
          value={localSelectedItems}
          getOptionLabel={option =>
            option.indentedLabel || option[labelField] || `ID: ${option.id}`
          }
          isOptionEqualToValue={(option, value) => option.id === value.id}
          onChange={handleChange}
          renderOption={(props, option) => (
            <li {...props} key={`option-${option.id}`}>
              {option.indentedLabel}
            </li>
          )}
          renderInput={params => (
            <TextField {...params} variant="outlined" size="small" placeholder="Add tags" />
          )}
        />
      )}
    </Box>
  );
};
