'use client';
import { useEffect, useState } from 'react';
import { Box, Typography, Chip, CircularProgress, Autocomplete, TextField } from '@mui/material';
import { useRelatedRecords } from '@/hooks/useRelatedRecords';
import { createClient } from '@/lib/supabase/browser';
import { useRouter } from 'next/navigation';

export const RelatedTagsField = ({ field, parentId }) => {
  const router = useRouter();
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

  // Handle navigation to tag detail
  const handleTagClick = (e, tagId) => {
    // If user clicked on delete icon or other parts of the chip, don't navigate
    if (e.target.tagName === 'svg' || 
        e.target.tagName === 'path' || 
        e.target.classList.contains('MuiChip-deleteIcon') ||
        e.target.classList.contains('MuiSvgIcon-root')) {
      return;
    }
    
    // Otherwise navigate to tag detail
    router.push(`/dashboard/${table}/${tagId}`);
  };



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
          renderTags={(tagValues, getTagProps) =>
            tagValues.map((option, index) => {
              const tagProps = getTagProps({ index });
                const { key, ...tagPropsWithoutKey } = getTagProps({ index });
              
             return (
              <Chip
                key={key} // Pass key directly as a prop
                label={option.indentedLabel}
                {...tagPropsWithoutKey} // Spread the rest of the props
                onClick={(e) => handleTagClick(e, option.id)}
                  sx={{
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'primary.light', // Uses your theme's primary light color
                      color: 'primary.contrastText',   // Uses the contrasting text color (usually white)
                      borderColor: 'primary.main'      // Adds a border in the primary color
                    },
                    '& .MuiChip-label': {
                      cursor: 'pointer',
                    },
                    // Make the delete icon more visible on hover
                    '&:hover .MuiChip-deleteIcon': {
                      color: 'primary.contrastText',   // Makes the delete icon match the text color
                    }
                  }}
                />
              );
            })
          }
        />
      )}
    </Box>
  );
};