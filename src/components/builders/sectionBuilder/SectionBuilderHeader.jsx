'use client';

import React from 'react';
import { AppBar, Toolbar, Typography, IconButton } from '@mui/material';
import { X } from '@phosphor-icons/react';

export default function SectionBuilderHeader({ onClose }) {
  return (
    <AppBar position="sticky" color="default" sx={{ boxShadow: 'none' }}>
      <Toolbar>
        <Typography variant="h6" sx={{ flex: 1 }}>
          Section Builder
        </Typography>
        <IconButton edge="end" color="inherit" onClick={onClose} aria-label="close">
          <X />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
} 
