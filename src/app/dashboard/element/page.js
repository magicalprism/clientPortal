'use client';

import { element } from '@/collections/element';
import PrimaryTableView from '@/components/views/PrimaryTableView';

export default function ElementPage() {
  return <PrimaryTableView config={element} />;
}
