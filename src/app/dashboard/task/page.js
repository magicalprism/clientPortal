'use client';

import { task } from '@/collections/task';
import PrimaryTableView from '@/components/views/PrimaryTableView';

export default function TaskPage() {
  return <PrimaryTableView config={task} />;
}
