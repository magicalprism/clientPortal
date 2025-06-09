'use client';

import { Suspense } from 'react';
import { CircularProgress, Box } from '@mui/material';
import dynamic from 'next/dynamic';

const CompanySearchPage = dynamic(
  () => import('@/components/dashboard/search/StreamlinedSearchPage').then(mod => mod.CompanySearchPage),
  {
    ssr: false,
    loading: () => (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    )
  }
);

export default function CompanySearchRoute() {
  return (
    <Suspense fallback={
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    }>
      <CompanySearchPage />
    </Suspense>
  );
}