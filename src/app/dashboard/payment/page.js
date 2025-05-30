'use client';

import { payment } from '@/collections/payment';
import CollectionView from '@/components/views/CollectionView';

export default function PaymentPage() {
  return <CollectionView config={payment} />;
}
