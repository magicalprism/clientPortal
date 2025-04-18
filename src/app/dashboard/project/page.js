'use client';

import { project } from '@/collections/project';
import PrimaryCollectionTable from '@/components/tables/PrimaryCollectionTable';

export default function ProjectPage() {
  return <PrimaryCollectionTable config={project} />;
}
