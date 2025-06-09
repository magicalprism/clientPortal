'use client';

import { Suspense } from 'react';
import { CircularProgress, Box } from '@mui/material';
import dynamic from 'next/dynamic';

const MediaSearchPage = dynamic(
  () => import('@/components/dashboard/search/StreamlinedSearchPage').then(mod => mod.MediaSearchPage),
  {
    ssr: false,
    loading: () => (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    )
  }
);