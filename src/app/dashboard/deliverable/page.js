'use client';

import { deliverable } from '@/collections/deliverable';
import CollectionView from '@/components/views/CollectionView';

export default function DeliverablePage() {
  return <CollectionView config={deliverable} />;
}
