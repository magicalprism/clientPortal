'use client';

import { ArrowSquareOut } from '@phosphor-icons/react';
import { Typography, IconButton, Tooltip } from '@mui/material';

export const LinkField = ({ value, field }) => {
  if (!value) return '—';

  const label = typeof field.displayLabel === 'string' ? field.displayLabel : value;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <Typography variant="body2" color="text.primary" noWrap>
        {label}
      </Typography>
      <Tooltip title="Open link" arrow>
        <IconButton
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          size="small"
        >
          <ArrowSquareOut size={16} />
        </IconButton>
      </Tooltip>
    </div>
  );
};
