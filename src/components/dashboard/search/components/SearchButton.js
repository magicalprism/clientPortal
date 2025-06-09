'use client';

import React, { useState } from 'react';
import {
  IconButton,
  Dialog,
  DialogContent,
  Box,
  useMediaQuery,
  useTheme,
  Tooltip,
  Kbd,
  Typography,
  alpha
} from '@mui/material';
import { MagnifyingGlass as SearchIcon } from '@phosphor-icons/react';
import dynamic from 'next/dynamic';

// Dynamically import search to avoid SSR issues
const StreamlinedSearchPage = dynamic(
  () => import('@/components/dashboard/search/StreamlinedSearchPage'),
  { ssr: false }
);

/**
 * Modern Search Button with keyboard shortcut support
 */
export default function SearchButton({ 
  variant = 'icon', // 'icon' | 'button' | 'fab'
  showShortcut = true 
}) {
  const [open, setOpen] = useState(false);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('lg'));

  // Keyboard shortcut handler
  React.useEffect(() => {
    const handleKeyDown = (event) => {
      // Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setOpen(true);
      }
      
      // Escape to close
      if (event.key === 'Escape' && open) {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  // Different variants of the search button
  const renderSearchTrigger = () => {
    switch (variant) {
      case 'button':
        return (
          <Box
            onClick={handleOpen}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              px: 2,
              py: 1,
              borderRadius: 2,
              backgroundColor: alpha(theme.palette.background.paper, 0.8),
              border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
              cursor: 'pointer',
              transition: 'all 0.2s',
              minWidth: 240,
              '&:hover': {
                backgroundColor: alpha(theme.palette.background.paper, 0.9),
                borderColor: alpha(theme.palette.primary.main, 0.3),
                transform: 'translateY(-1px)',
                boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`
              }
            }}
          >
            <SearchIcon size={18} style={{ color: theme.palette.text.secondary }} />
            <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
              Search...
            </Typography>
            {showShortcut && (
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <Kbd>⌘</Kbd>
                <Kbd>K</Kbd>
              </Box>
            )}
          </Box>
        );
        
      case 'fab':
        return (
          <IconButton
            onClick={handleOpen}
            size="large"
            sx={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              backgroundColor: theme.palette.primary.main,
              color: theme.palette.primary.contrastText,
              boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.3)}`,
              '&:hover': {
                backgroundColor: theme.palette.primary.dark,
                transform: 'scale(1.1)',
                boxShadow: `0 12px 32px ${alpha(theme.palette.primary.main, 0.4)}`
              },
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              zIndex: 1000
            }}
          >
            <SearchIcon size={24} weight="regular" />
          </IconButton>
        );
        
      default: // 'icon'
        return (
          <Tooltip 
            title={
              <Box>
                <Typography variant="body2">Search</Typography>
                {showShortcut && (
                  <Typography variant="caption" color="inherit">
                    ⌘K
                  </Typography>
                )}
              </Box>
            }
          >
            <IconButton 
              onClick={handleOpen}
              size="medium"
              sx={{ 
                color: 'inherit',
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main
                }
              }}
            >
              <SearchIcon size={20} weight="regular" />
            </IconButton>
          </Tooltip>
        );
    }
  };

  return (
    <>
      {renderSearchTrigger()}
      
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="xl"
        fullWidth
        fullScreen={fullScreen}
        PaperProps={{
          sx: { 
            height: fullScreen ? '100%' : '90vh',
            borderRadius: fullScreen ? 0 : 3,
            backgroundColor: alpha(theme.palette.background.default, 0.95),
            backdropFilter: 'blur(20px)',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
          }
        }}
        sx={{
          '& .MuiBackdrop-root': {
            backgroundColor: alpha(theme.palette.common.black, 0.3),
            backdropFilter: 'blur(4px)'
          }
        }}
      >
        <DialogContent sx={{ p: 0, height: '100%' }}>
          <Box sx={{ height: '100%', overflow: 'auto' }}>
            <StreamlinedSearchPage />
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Kbd component for keyboard shortcuts
 */
function Kbd({ children, ...props }) {
  const theme = useTheme();
  
  return (
    <Box
      component="kbd"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 20,
        height: 20,
        px: 0.5,
        fontSize: '0.75rem',
        fontFamily: 'monospace',
        backgroundColor: alpha(theme.palette.background.paper, 0.8),
        border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
        borderRadius: 0.5,
        color: theme.palette.text.secondary,
        fontWeight: 500
      }}
      {...props}
    >
      {children}
    </Box>
  );
}

/**
 * Hook for search functionality (can be used in other components)
 */
export function useSearch() {
  const [open, setOpen] = useState(false);
  
  return {
    isOpen: open,
    open: () => setOpen(true),
    close: () => setOpen(false),
    toggle: () => setOpen(prev => !prev)
  };
}