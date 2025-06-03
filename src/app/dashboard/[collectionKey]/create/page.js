'use client';

import { useParams } from 'next/navigation';
import * as collections from '@/collections';
import { CollectionCreateLayout } from '@/components/create/CollectionCreateLayout';

export default function CreateCollectionPage() {
  const params = useParams();
  const collectionKey = Array.isArray(params?.collectionKey)
    ? params.collectionKey[0]
    : params?.collectionKey;

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
    <div style={{ padding: '2rem' }}>
      <h1>Create {config.singularLabel || config.label}</h1>
      <CollectionCreateLayout config={config} />
    </div>
  );
}
