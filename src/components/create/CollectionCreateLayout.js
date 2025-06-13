'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, memo } from 'react';
import { CircularProgress, Box } from '@mui/material';
import * as collections from '@/collections';

// Lazy load the forms for better performance
import dynamic from 'next/dynamic';

const SimpleCreateForm = dynamic(
  () => import('./SimpleCreateForm'),
  { 
    loading: () => (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    ),
    ssr: false
  }
);

const CreateForm = dynamic(
  () => import('./CreateForm'),
  { 
    loading: () => (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    ),
    ssr: false
  }
);

// Memoized component for better performance
const CollectionCreateLayoutContent = memo(({ collectionKey }) => {
  const config = collections[collectionKey];
  const searchParams = useSearchParams();
  
  if (!config) {
    console.error('[CollectionCreateLayout] Collection not found:', collectionKey);
    console.log('[CollectionCreateLayout] Available collections:', Object.keys(collections));
    
    return (
      <Box sx={{ padding: 4, textAlign: 'center' }}>
        <h3>Collection not found</h3>
        <p>Collection key: <strong>{collectionKey}</strong></p>
        <p>Available collections: {Object.keys(collections).join(', ')}</p>
        <details style={{ marginTop: 16, textAlign: 'left' }}>
          <summary>Debug Info</summary>
          <pre>{JSON.stringify({ 
            collectionKey, 
            availableCollections: Object.keys(collections),
            searchParams: Object.fromEntries(searchParams.entries())
          }, null, 2)}</pre>
        </details>
      </Box>
    );
  }

  // Check if this is a modal create
  const isModal = searchParams.get('modal') === 'create';

  // Use complex form for contracts (if you want to keep it)
  // Otherwise, use simple form for everything
  const useComplexForm = config.name === 'contract' && false; // Set to true if you want the complex contract form

  if (useComplexForm) {
    return (
      <CreateForm 
        config={config}
        disableRedirect={isModal}
        onCancel={isModal ? () => window.history.back() : undefined}
      />
    );
  }

  // Use simple form for everything else (and contracts if not using complex form)
  return (
    <SimpleCreateForm 
      config={config}
      isModal={isModal}
      onClose={isModal ? () => window.history.back() : undefined}
    />
  );
});

CollectionCreateLayoutContent.displayName = 'CollectionCreateLayoutContent';

export function CollectionCreateLayout({ collectionKey }) {
  console.log('[CollectionCreateLayout] collectionKey:', collectionKey);
  
  return (
    <Suspense fallback={
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    }>
      <CollectionCreateLayoutContent collectionKey={collectionKey} />
    </Suspense>
  );
}