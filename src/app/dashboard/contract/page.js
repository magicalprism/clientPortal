'use client';

import { contract } from '@/collections/contract';
import CollectionView from '@/components/views/CollectionView';

export default function ContractPage() {
  return <CollectionView config={contract} />;
}
