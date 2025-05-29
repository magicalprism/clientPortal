'use client';

import { product } from '@/collections/product';
import CollectionView from '@/components/views/CollectionView';

export default function ProductPage() {
  return <CollectionView config={product} />;
}
