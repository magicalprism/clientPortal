'use client';

import { useState, useEffect } from 'react';
import { Typography, Box } from '@mui/material';
import { debounce } from '@/lib/utils/debounce';
import { SimpleEditor } from '@/components/fields/text/richText/tipTap/components/tiptap-templates/simple/simple-editor';

export const RichTextFieldRenderer = ({
  value,
  field,
  config = {},
  editable = false,
  mode = 'view',
  onChange = () => {}
}) => {
  const [localValue, setLocalValue] = useState(value || '');
  const [isDirty, setIsDirty] = useState(false);
  const isEditable = editable || mode === 'create';
  
  // Extract lines from field or config, default to 3 for rich text
  const lines = field.lines || config.lines || 3;
  const minHeight = lines * 24; // Approximate line height of 24px

  // Sync incoming value unless the field is being edited
  useEffect(() => {
    if (!isDirty) {
      setLocalValue(value || '');
    }
  }, [value, isDirty]);

  // Reset dirty flag when value is saved externally
  useEffect(() => {
    if (isDirty && value === localValue) {
      setIsDirty(false);
    }
  }, [value, localValue, isDirty]);

  const handleChange = debounce((html) => {
    setIsDirty(true);
    setLocalValue(html);
    onChange(html);
  }, 800);

  if (!isEditable) {
    return localValue ? (
      <Box 
        component="div"
        sx={{ 
          wordBreak: 'break-word',
          whiteSpace: 'normal'
        }}
        dangerouslySetInnerHTML={{ __html: localValue }} 
      />
    ) : (
      <Typography variant="body2">—</Typography>
    );
  }

  return (
    <Box sx={{
      width: '100%',
      minHeight: `${minHeight}px`,
      '& .ProseMirror': {
        minHeight: `${minHeight}px`,
        width: '100%',
      }
    }}>
      <SimpleEditor
        content={localValue}
        editable={true}
        onChange={handleChange}
        config={{
          ...config,
          minHeight: `${minHeight}px`
        }}
      />
    </Box>
  );
};

export default RichTextFieldRenderer;

// 🧩 For inclusion in main FieldRenderer switch map
export const RichTextFieldCase = {
  type: 'richText',
  Component: RichTextFieldRenderer
};