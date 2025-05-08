// components/buttons/ViewButtons.js
'use client';

import { IconButton, Box } from '@mui/material';
import { Eye, CornersOut } from '@phosphor-icons/react';
import { useRouter, usePathname } from 'next/navigation';

export const ViewButtons = ({ config, id }) => {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      <IconButton
        size="small"
        onClick={() => router.push(`${pathname}?id=${id}&modal=edit`)}
      >
        <Eye size={18} />
      </IconButton>
      <IconButton
        size="small"
        onClick={() => window.open(`/dashboard/${config.name}/${id}`, '_blank')}
      >
        <CornersOut size={18} />
      </IconButton>
    </Box>
  );
};
