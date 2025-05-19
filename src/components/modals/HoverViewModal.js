'use client';

import { Popover, Box, Typography } from '@mui/material';
import { ViewButtons } from '@/components/buttons/ViewButtons';

export const HoverViewModal = ({ config, id, anchorEl, onClose }) => {
  const open = Boolean(anchorEl);

  console.log('[HoverViewModal] anchorEl:', anchorEl, 'ID:', id);
  console.log('[HoverViewModal] RENDERED with ID:', id);

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      disableRestoreFocus
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      PaperProps={{
        sx: {
          p: 1,
          minWidth: 150,
          zIndex: 1300,
          backgroundColor: '#fff',
        },
      }}
    >
      <Box>
        <Typography variant="caption">Viewing ID: {id}</Typography>
        <ViewButtons config={config} id={id} />
      </Box>
    </Popover>
  );
};
