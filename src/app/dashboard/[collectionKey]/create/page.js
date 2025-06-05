'use client';

import { useParams } from 'next/navigation';
import * as collections from '@/collections';
import { CollectionCreateLayout } from '@/components/create/CollectionCreateLayout';

export default function CreateCollectionPage() {
  const params = useParams();
  const collectionKey = params?.collectionKey;

  const config = collections[collectionKey];

  if (!config) {
    return (
      <div style={{ padding: '2rem' }}>
        <h2>Invalid collection key</h2>
        <p>Got: <code>{collectionKey}</code></p>
        <p>Available: {Object.keys(collections).join(', ')}</p>
      </div>
    );
  }

 return (
  <div style={{
    minHeight: '100vh',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // semi-transparent background
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '2rem'
  }}>
    <div style={{
      backgroundColor: '#fff',
      borderRadius: '12px',
      boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.2)',
      padding: '2rem',
      width: '100%',
      maxWidth: '700px',
      maxHeight: '90vh',
      overflowY: 'auto'
    }}>
      <CollectionCreateLayout collectionKey={collectionKey} />
    </div>
  </div>
);

}
