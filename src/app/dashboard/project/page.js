'use client';

import { project } from '@/collections/project';
import CollectionView from '@/components/views/CollectionView';

export default function ProjectPage() {
  return <CollectionView config={project} />;
}
