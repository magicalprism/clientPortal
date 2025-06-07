'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Box, TextField, Typography, IconButton } from '@mui/material';
import { Check, X, PencilSimple } from '@phosphor-icons/react';

export const InlineEditableField = ({ 
  value, 
  onChange, 
  onSave,
  variant = 'h4',
  placeholder = 'Click to edit',
  multiline = false,
  disabled = false,
  sx = {},
  component = 'div',
  ...props 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value || '');
  const inputRef = useRef(null);

  useEffect(() => {
    setTempValue(value || '');
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      // Focus the input
      inputRef.current.focus();
      
      // Try to select text, but handle cases where select() doesn't exist
      try {
        // For Material-UI TextField, we need to access the actual input element
        const inputElement = inputRef.current.querySelector('input') || 
                           inputRef.current.querySelector('textarea') || 
                           inputRef.current;
        
        if (inputElement && typeof inputElement.select === 'function') {
          inputElement.select();
        } else if (inputElement && typeof inputElement.setSelectionRange === 'function') {
          // Fallback for elements that support setSelectionRange
          inputElement.setSelectionRange(0, inputElement.value.length);
        }
      } catch (error) {
        console.log('Text selection not supported on this element');
      }
    }
  }, [isEditing]);

  const handleEdit = () => {
    if (disabled) return;
    setIsEditing(true);
    setTempValue(value || '');
  };

  const handleSave = async () => {
    try {
      await onSave?.(tempValue);
      onChange?.(tempValue);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving field:', error);
      // Optionally show error message
    }
  };

  const handleCancel = () => {
    setTempValue(value || '');
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const displayValue = value || placeholder;
  const isEmpty = !value || value.trim() === '';

  if (isEditing) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, ...sx }}>
        <TextField
          ref={inputRef}
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          onKeyDown={handleKeyDown}
          multiline={multiline}
          rows={multiline ? 3 : 1}
          variant="outlined"
          size="small"
          fullWidth
          autoFocus
          sx={{ 
            '& .MuiOutlinedInput-root': {
              fontSize: variant === 'h4' ? '2rem' : 
                        variant === 'h5' ? '1.5rem' :
                        variant === 'h6' ? '1.25rem' : 
                        variant === 'subtitle1' ? '1rem' :
                        variant === 'subtitle2' ? '0.875rem' :
                        variant === 'body1' ? '1rem' :
                        variant === 'body2' ? '0.875rem' :
                        variant === 'caption' ? '0.75rem' : '1rem',
              fontWeight: variant.startsWith('h') ? 600 : 
                         variant.startsWith('subtitle') ? 500 : 400
            }
          }}
          {...props}
        />
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <IconButton 
            size="small" 
            onClick={handleSave}
            sx={{ color: 'success.main' }}
          >
            <Check size={16} />
          </IconButton>
          <IconButton 
            size="small" 
            onClick={handleCancel}
            sx={{ color: 'error.main' }}
          >
            <X size={16} />
          </IconButton>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      component={component}
      onClick={handleEdit}
      sx={{
        cursor: disabled ? 'default' : 'pointer',
        position: 'relative',
        '&:hover': disabled ? {} : {
          backgroundColor: 'action.hover',
          '& .edit-indicator': {
            opacity: 1
          }
        },
        borderRadius: 1,
        padding: 0.5,
        margin: -0.5,
        ...sx
      }}
    >
      <Typography
        variant={variant}
        sx={{
          color: isEmpty ? 'text.secondary' : 'text.primary',
          fontStyle: isEmpty ? 'italic' : 'normal',
          minHeight: '1em',
          wordBreak: 'break-word'
        }}
        {...props}
      >
        {displayValue}
      </Typography>
      
      {!disabled && (
        <PencilSimple 
          size={14} 
          className="edit-indicator"
          style={{
            position: 'absolute',
            top: 4,
            right: 4,
            opacity: 0,
            transition: 'opacity 0.2s ease-in-out',
            color: '#666'
          }}
        />
      )}
    </Box>
  );
};