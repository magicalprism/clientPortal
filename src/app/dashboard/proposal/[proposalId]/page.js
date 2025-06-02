import { CollectionDetailLayout } from '@/components/views/collectionItem/CollectionDetailLayout';

export default async function ProposalDetailPage({ params }) {
  const { proposalId } = await params;
  return (
    <CollectionDetailLayout
      collectionKey="proposal"
      recordId={proposalId}
    />
  );
}
