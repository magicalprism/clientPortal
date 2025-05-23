import { CollectionDetailLayout } from '@/components/views/collectionItem/CollectionDetailLayout';

export default async function ElementDetailPage({ params }) {
  const { elementId } = await params;
  return (
    <CollectionDetailLayout
      collectionKey="element"
      recordId={elementId}
    />
  );
}
