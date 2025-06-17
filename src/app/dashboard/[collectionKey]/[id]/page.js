import { CollectionDetailLayout } from '@/components/views/collectionItem/CollectionDetailLayout';

// This is a server component that handles dynamic route parameters
export default async function CollectionDetailPage({ params }) {
  // Extract the params using destructuring and await
  const { collectionKey, id } = await params;

  return (
    <CollectionDetailLayout
      collectionKey={collectionKey}
      recordId={id}
    />
  );
}