'use client';

import { useParams } from 'next/navigation';
import * as collections from '@/collections';
import CollectionView from '@/components/views/CollectionView';

export default function CollectionPage() {
  const { collectionKey } = useParams();
  const config = collections[collectionKey];

  if (!config) {
    return (
      <div style={{ padding: 32 }}>
        <h2>Invalid collection key</h2>
        <p>Got: <code>{collectionKey}</code></p>
        <p>Available: {Object.keys(collections).join(', ')}</p>
      </div>
    );
  }

  return <CollectionView config={config} />;
}
