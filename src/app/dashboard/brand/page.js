'use client';

import { brand } from '@/collections/brand';
import CollectionView from '@/components/views/CollectionView';

export default function BrandPage() {
  return <CollectionView config={brand} />;
}
