'use client';

import { Suspense } from 'react';
import { CircularProgress, Box } from '@mui/material';
import dynamic from 'next/dynamic';

const ProjectSearchPage = dynamic(
  () => import('@/components/dashboard/search/StreamlinedSearchPage').then(mod => mod.ProjectSearchPage),
  {
    ssr: false,
    loading: () => (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    )
  }
);

export default function ProjectSearchRoute() {
  return (
    <Suspense fallback={
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    }>
      <ProjectSearchPage />
    </Suspense>
  );
}