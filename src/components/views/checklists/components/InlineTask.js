'use client';

import { Box, TextField, IconButton, Checkbox } from '@mui/material';
import { Check, X } from '@phosphor-icons/react';
import { useEffect, useRef } from 'react';

export default function InlineTask({ 
  value, 
  onChange, 
  onSave, 
  onCancel, 
  placeholder = "Enter task title..." 
}) {
  const inputRef = useRef(null);

  useEffect(() => {
    // Auto-focus the input when component mounts
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  const handleBlur = () => {
    // Save on blur if there's content, otherwise cancel
    if (value.trim()) {
      onSave();
    } else {
      onCancel();
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        py: 1,
        pl: 2,
        borderTop: '1px solid #eee',
        backgroundColor: 'action.hover',
        borderRadius: 1,
        mt: 1
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
        {/* Placeholder checkbox (disabled) */}
        <Checkbox
          disabled
          sx={{ mr: 1, opacity: 0.3 }}
        />
        
        <TextField
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={placeholder}
          variant="standard"
          size="small"
          sx={{
            flexGrow: 1,
            '& .MuiInput-underline:before': {
              borderBottom: 'none'
            },
            '& .MuiInput-underline:hover:before': {
              borderBottom: 'none'
            },
            '& .MuiInput-underline:after': {
              borderBottom: '2px solid primary.main'
            }
          }}
          InputProps={{
            sx: {
              fontSize: '0.875rem',
              backgroundColor: 'transparent'
            }
          }}
        />
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <IconButton 
          size="small" 
          onClick={onSave}
          color="primary"
          disabled={!value.trim()}
        >
          <Check size={16} />
        </IconButton>
        <IconButton 
          size="small" 
          onClick={onCancel}
          color="error"
        >
          <X size={16} />
        </IconButton>
      </Box>
    </Box>
  );
}