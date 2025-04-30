'use client';

import { projectpage } from '@/collections/projectpage';
import PrimaryTableView from '@/components/views/PrimaryTableView';

export default function ProjectpagePage() {
  return <PrimaryTableView config={projectpage} />;
}
