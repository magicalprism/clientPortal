import { CollectionDetailLayout } from '@/components/views/collectionItem/CollectionDetailLayout';

export default async function PaymentDetailPage({ params }) {
  const { paymentId } = await params;
  return (
    <CollectionDetailLayout
      collectionKey="payment"
      recordId={paymentId}
    />
  );
}
