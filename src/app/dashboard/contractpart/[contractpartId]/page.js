import { CollectionDetailLayout } from '@/components/views/collectionItem/CollectionDetailLayout';

export default async function ContractpartDetailPage({ params }) {
  const { contractpartId } = await params;
  return (
    <CollectionDetailLayout
      collectionKey="contractpart"
      recordId={contractpartId}
    />
  );
}
