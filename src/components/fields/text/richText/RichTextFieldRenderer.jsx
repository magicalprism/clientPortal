'use client';

import { useState, useEffect } from 'react';
import { Typography } from '@mui/material';
import { debounce } from '@/lib/utils/debounce';
import { SimpleEditor } from '@/components/fields/text/richText/tipTap/components/tiptap-templates/simple/simple-editor';

export const RichTextFieldRenderer = ({
  value,
  field,
  editable = false,
  mode = 'view',
  onChange = () => {}
}) => {
  const [localValue, setLocalValue] = useState(value || '');
  const [isDirty, setIsDirty] = useState(false);
  const isEditable = editable || mode === 'create';

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
      <div dangerouslySetInnerHTML={{ __html: localValue }} />
    ) : (
      <Typography variant="body2">—</Typography>
    );
  }

  return (
    <SimpleEditor
      content={localValue}
      editable={true}
      onChange={handleChange}
    />
  );
};

export default RichTextFieldRenderer;

// 🧩 For inclusion in main FieldRenderer switch map
export const RichTextFieldCase = {
  type: 'richText',
  Component: RichTextFieldRenderer
};
