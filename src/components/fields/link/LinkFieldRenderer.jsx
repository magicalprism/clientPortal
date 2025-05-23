'use client';

import { useEffect, useState } from 'react';
import {
  TextField,
  IconButton,
  Box,
  Tooltip
} from '@mui/material';
import { ArrowSquareOut } from '@phosphor-icons/react';
import { LinkField } from '@/components/fields/link/LinkField';

export const LinkFieldRenderer = ({
  value,
  field,
  editable = false,
  mode = 'view',
  onChange = () => {}
}) => {
  const isEditMode = editable || mode === 'create';
  const [localValue, setLocalValue] = useState(value || '');
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (!isDirty && value !== localValue) {
      setLocalValue(value || '');
    }
  }, [value, isDirty, localValue]);

  if (!isEditMode) {
    return <LinkField value={localValue} field={field} />;
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
      <TextField
        variant="outlined"
        size="small"
        value={localValue}
        onChange={(e) => {
          setIsDirty(true);
          setLocalValue(e.target.value);
        }}
        onBlur={() => {
          setIsDirty(false);
          onChange(localValue);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            setIsDirty(false);
            onChange(localValue);
          }
        }}
        placeholder={field.label || 'Enter link'}
        sx={{
          flexGrow: 1,
          minWidth: 0,
          '& .MuiInputBase-root': {
            pr: '8px'
          }
        }}
        InputProps={{ sx: { height: '100%' } }}
      />
      {!!localValue && (
        <Tooltip title="Open link" arrow>
          <IconButton
            component="a"
            href={localValue}
            target="_blank"
            rel="noopener noreferrer"
            size="small"
            sx={{ ml: 1, flexShrink: 0 }}
          >
            <ArrowSquareOut size={16} />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
};

export default LinkFieldRenderer;

// 🧩 For inclusion in main FieldRenderer switch map
export const LinkFieldCase = {
  type: 'link',
  Component: LinkFieldRenderer
};
