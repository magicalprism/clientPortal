'use client';

import { contractpart } from '@/collections/contractpart';
import CollectionView from '@/components/views/CollectionView';

export default function ContractpartPage() {
  return <CollectionView config={contractpart} />;
}
