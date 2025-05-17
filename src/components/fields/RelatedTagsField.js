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

  const {
    relation: {
      table,
      labelField,
      sourceKey,
      junctionTable,
      targetKey
    }
  } = field;

  // Fetch all possible tag options
  useEffect(() => {
    const fetchOptions = async () => {
      const { data, error } = await supabase.from(table).select(`id, ${labelField}`);
      if (error) {
        console.error('Error loading options:', error);
      } else {
        setAllOptions(data);
      }
      setLoading(false);
    };

    fetchOptions();
  }, [table, labelField]);

  const handleChange = async (event, selectedItems) => {
    if (!parentId) return;

    const selectedIds = selectedItems.map(item => item.id);
    const currentIds = relatedItems.map(item => item.id);

    const toAdd = selectedIds.filter(id => !currentIds.includes(id));
    const toRemove = currentIds.filter(id => !selectedIds.includes(id));

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

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>{field.label}</Typography>

      {loading ? (
        <CircularProgress size={20} />
      ) : (
        <Autocomplete
          multiple
          options={allOptions}
          value={relatedItems}
          getOptionLabel={(option) => option[labelField]}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          onChange={handleChange}
          renderInput={(params) => (
            <TextField {...params} variant="outlined" size="small" placeholder="Add tags" />
          )}
        />
      )}
    </Box>
  );
};
