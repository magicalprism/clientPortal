'use client';

import { Box, TextField } from '@mui/material';
import { MediaFieldEditor } from './MediaFieldEditor';
import { getInitialMedia } from '@/components/fields/media/old/components/data/mediaFieldConfig';

export const MediaManualEntryEditor = ({
  media,
  index,
  onChange,
  field
}) => {
  const handleUrlChange = (e) => {
    const updated = { ...media, url: e.target.value };
    onChange(index, updated);
  };

  return (
    <Box display="flex" flexDirection="column" gap={2}>
      <TextField
        fullWidth
        size="small"
        label="URL"
        value={media.url || ''}
        onChange={handleUrlChange}
      />

      <MediaFieldEditor
        media={media}
        index={index}
        onChange={onChange}
        field={field}
      />
    </Box>
  );
};
