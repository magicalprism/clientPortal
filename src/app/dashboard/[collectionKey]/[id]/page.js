import { CollectionDetailLayout } from '@/components/views/collectionItem/CollectionDetailLayout';

export default function CollectionDetailPage({ params }) {
  const { collectionKey, id } = params;

  return (
    <CollectionDetailLayout
      collectionKey={collectionKey}
      recordId={id}
    />
  );
}
