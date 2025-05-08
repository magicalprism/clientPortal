'use client';

import { resource } from '@/collections/resource';
import PrimaryTableView from '@/components/views/PrimaryTableView';

export default function ResourcePage() {
  return <PrimaryTableView config={resource} />;
}
