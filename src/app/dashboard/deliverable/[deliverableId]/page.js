import { CollectionDetailLayout } from '@/components/views/collectionItem/CollectionDetailLayout';

export default async function DeliverableDetailPage({ params }) {
  const { deliverableId } = await params;
  return (
    <CollectionDetailLayout
      collectionKey="deliverable"
      recordId={deliverableId}
    />
  );
}
