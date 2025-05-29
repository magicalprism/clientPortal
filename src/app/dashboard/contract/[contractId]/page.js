import { CollectionDetailLayout } from '@/components/views/collectionItem/CollectionDetailLayout';

export default async function ContractDetailPage({ params }) {
  const { contractId } = await params;
  return (
    <CollectionDetailLayout
      collectionKey="contract"
      recordId={contractId}
    />
  );
}
