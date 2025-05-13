'use client';

import { media } from '@/collections/media';
import CollectionView from '@/components/views/CollectionView';

export default function MediaPage() {
  return <CollectionView config={media} />;
}
