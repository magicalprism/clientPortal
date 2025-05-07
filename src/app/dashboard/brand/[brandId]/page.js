import { CollectionDetailLayout } from '@/components/CollectionDetailLayout';

export default async function BrandDetailPage({ params }) {
  const { brandId } = await params;
  return (
    <CollectionDetailLayout
      collectionKey="brand"
      recordId={brandId}
    />
  );
}
