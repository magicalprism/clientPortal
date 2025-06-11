'use client';

import { useState } from 'react';
import { Button, IconButton, Tooltip } from '@mui/material';
import { Plus } from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';
import { useModal } from '@/components/modals/ModalContext';

export default function AddRecordButton({ 
  config, 
  defaultValues = {}, 
  variant = 'button',
  onSuccess,
  children,
  ...props 
}) {
  const router = useRouter();
  const { openModal } = useModal();
  
  const handleClick = () => {
    // Create URL with default values as search params
    const params = new URLSearchParams();
    params.set('modal', 'create');
    
    // Add all default values as URL parameters
    Object.entries(defaultValues).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, String(value));
      }
    });

    const url = `${window.location.pathname}?${params.toString()}`;
    router.push(url);
  };

  if (variant === 'icon') {
    return (
      <Tooltip title={`Add ${config.singularLabel || 'Record'}`}>
        <IconButton 
          onClick={handleClick}
          size="small"
          {...props}
        >
          <Plus size={18} />
        </IconButton>
      </Tooltip>
    );
  }

  return (
    <Button
      onClick={handleClick}
      startIcon={<Plus size={16} />}
      variant="outlined"
      size="small"
      {...props}
    >
      {children || `Add ${config.singularLabel || 'Record'}`}
    </Button>
  );
}