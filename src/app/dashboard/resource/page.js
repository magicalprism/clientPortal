'use client';

import { resource } from '@/collections/resource';
import CollectionView from '@/components/views/CollectionView';

export default function ResourcePage() {
  return <CollectionView config={resource} />;
}
