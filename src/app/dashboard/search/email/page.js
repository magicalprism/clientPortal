'use client';

import { Suspense } from 'react';
import { CircularProgress, Box } from '@mui/material';
import dynamic from 'next/dynamic';

const EmailSearchPage = dynamic(
  () => import('@/components/dashboard/search/StreamlinedSearchPage').then(mod => mod.EmailSearchPage),
  {
    ssr: false,
    loading: () => (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    )
  }
);

export default EmailSearchPage;