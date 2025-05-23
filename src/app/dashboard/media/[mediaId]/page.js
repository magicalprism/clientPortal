import { CollectionDetailLayout } from '@/components/views/collectionItem/CollectionDetailLayout';

export default async function MediaDetailPage({ params }) {
  const { mediaId } = await params;
  return (
    <CollectionDetailLayout
      collectionKey="media"
      recordId={mediaId}
    />
  );
}
