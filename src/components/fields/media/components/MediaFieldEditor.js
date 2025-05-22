'use client';

import { Box, TextField, FormControl, InputLabel, Select, MenuItem, Autocomplete } from '@mui/material';
import { allEditableMediaKeys } from '@/components/fields/media/data/mediaFieldConfig';
import { useMultiRelationOptions } from '@/hooks/filters/listfilters/useMultiRelationOptions';

export const MediaFieldEditor = ({
  media,
  index = null,
  onChange,
  field
}) => {
  const update = (key, value) => {
    const updated = { ...media, [key]: value };
    onChange(index, updated);
  };

  const baseKeys = [...allEditableMediaKeys];
if ('url' in media && !baseKeys.includes('url')) {
  baseKeys.unshift('url'); // show URL at the top
}

  // Grab tag field config if present
  const tagField = field?.config?.fields?.find(f => f.name === 'tags' && f.type === 'multiRelationship');
  const { options: tagOptions = [] } = useMultiRelationOptions({ field: tagField });

  return (
    <Box display="flex" flexDirection="column" gap={1}>
      {baseKeys.map((key) => {
        if (key === 'mime_type') {
          return (
            <FormControl fullWidth size="small" key={key}>
              <InputLabel>Mime Type</InputLabel>
              <Select
                value={media.mime_type}
                onChange={(e) => update('mime_type', e.target.value)}
              >
                {(field?.mimeTypeOptions || []).map((type) => (
                  <MenuItem key={type} value={type}>{type}</MenuItem>
                ))}
              </Select>
            </FormControl>
          );
        }

        if (key === 'is_folder') {
          return (
            <FormControl fullWidth size="small" key={key}>
              <InputLabel>Is Folder</InputLabel>
              <Select
                value={media.is_folder ? 'true' : 'false'}
                onChange={(e) => update('is_folder', e.target.value === 'true')}
              >
                <MenuItem value="false">File</MenuItem>
                <MenuItem value="true">Folder</MenuItem>
              </Select>
            </FormControl>
          );
        }

        if (key === 'tags') {
          return (
            <Autocomplete
              key={key}
              multiple
              options={tagOptions}
              value={media.tags || []}
              onChange={(e, newValue) => update('tags', newValue)}
              getOptionLabel={(opt) => opt.title || opt.label || `ID: ${opt.id}`}
              isOptionEqualToValue={(a, b) => a.id === b.id}
              renderInput={(params) => (
                <TextField {...params} label="Tags" size="small" />
              )}
            />
          );
        }

        return (
          <TextField
            key={key}
            label={key
              .replace(/_/g, ' ')
              .replace(/\b\w/g, (l) => l.toUpperCase())}
            value={media[key] || ''}
            onChange={(e) => update(key, e.target.value)}
            fullWidth
            size="small"
            multiline={key === 'description'}
            minRows={key === 'description' ? 2 : 1}
          />
        );
      })}
    </Box>
  );
};
