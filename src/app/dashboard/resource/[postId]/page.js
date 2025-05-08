import { CollectionDetailLayout } from '@/components/CollectionDetailLayout';

export default async function ResourceDetailPage({ params }) {
  const { resourceId } = await params;
  return (
	<CollectionDetailLayout
	  collectionKey="resource"
	  recordId={resourceId}
	/>
  );
}
