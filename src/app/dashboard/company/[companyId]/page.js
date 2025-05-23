import { CollectionDetailLayout } from '@/components/views/collectionItem/CollectionDetailLayout';

export default async function CompanyDetailPage({ params }) {
  const { companyId } = await params;
  return (
    <CollectionDetailLayout
      collectionKey="company"
      recordId={companyId}
    />
  );
}
