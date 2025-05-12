'use client';

import { task } from '@/collections/task';
import CollectionView from '@/components/views/CollectionView';

export default function TaskPage() {
  return <CollectionView config={task} />;
}
