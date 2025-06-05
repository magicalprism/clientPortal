'use client';

import { useSearchParams } from 'next/navigation';
import * as collections from '@/collections';
import SimpleCreateForm from './SimpleCreateForm';
import CreateForm from './CreateForm'; // Your complex contract form

export function CollectionCreateLayout({ collectionKey }) {
  console.log('[CollectionCreateLayout] collectionKey:', collectionKey);
  
  const config = collections[collectionKey];
  const searchParams = useSearchParams();
  
  if (!config) {
    console.error('[CollectionCreateLayout] Collection not found:', collectionKey);
    console.log('[CollectionCreateLayout] Available collections:', Object.keys(collections));
    
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h3>Collection not found</h3>
        <p>Collection key: <strong>{collectionKey}</strong></p>
        <p>Available collections: {Object.keys(collections).join(', ')}</p>
        <details style={{ marginTop: '1rem', textAlign: 'left' }}>
          <summary>Debug Info</summary>
          <pre>{JSON.stringify({ 
            collectionKey, 
            availableCollections: Object.keys(collections),
            searchParams: Object.fromEntries(searchParams.entries())
          }, null, 2)}</pre>
        </details>
      </div>
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
}