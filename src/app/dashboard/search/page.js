'use client';

import { Suspense } from 'react';
import { 
  Container, 
  Typography, 
  CircularProgress, 
  Box 
} from '@mui/material';
import dynamic from 'next/dynamic';

// Dynamically import the search component to ensure client-side rendering
const StreamlinedSearchPage = dynamic(
  () => import('@/components/dashboard/search/StreamlinedSearchPage'),
  {
    ssr: false,
    loading: () => (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    )
  }
);

export default function SearchPage() {
  return (
    <Suspense fallback={
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Typography variant="h4" gutterBottom>
          Loading Search...
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    }>
      <StreamlinedSearchPage />
    </Suspense>
  );
}



