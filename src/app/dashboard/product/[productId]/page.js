import { CollectionDetailLayout } from '@/components/views/collectionItem/CollectionDetailLayout';

export default async function ProductDetailPage({ params }) {
  const { productId } = await params;
  return (
    <CollectionDetailLayout
      collectionKey="product"
      recordId={productId}
    />
  );
}
