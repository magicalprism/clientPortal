'use client';

import { proposal } from '@/collections/proposal';
import CollectionView from '@/components/views/CollectionView';

export default function ProposalPage() {
  return <CollectionView config={proposal} />;
}
