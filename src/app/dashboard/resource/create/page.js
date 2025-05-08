'use client';

import { project } from '@/collections/project';
import PrimaryTableView from '@/components/views/PrimaryTableView';

export default function ProjectPage() {
  return <PrimaryTableView config={project} />;
}
