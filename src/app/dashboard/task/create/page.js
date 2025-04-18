'use client';

import { task } from '@/collections/task';
import PrimaryTableView from '@/components/tables/PrimaryTableView';

export default function TaskPage() {
  return <PrimaryTableView config={task} />;
}
