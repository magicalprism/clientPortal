'use client';

import { ArrowSquareOut } from '@phosphor-icons/react';
import { Typography, IconButton, Tooltip, Box } from '@mui/material';

export const LinkField = ({ value, field }) => {
  if (!value) return '—';

  const label = typeof field.displayLabel === 'string' ? field.displayLabel : value;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
      <Typography variant="body2" color="text.primary" noWrap sx={{ flexGrow: 1 }}>
        {label}
      </Typography>
      <Tooltip title="Open link" arrow>
        <IconButton
          component="a"
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          size="small"
          sx={{ flexShrink: 0 }}
        >
          <ArrowSquareOut size={16} />
        </IconButton>
      </Tooltip>
    </Box>
  );
};
