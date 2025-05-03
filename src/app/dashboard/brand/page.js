'use client';

import { brand } from '@/collections/brand';
import PrimaryTableView from '@/components/views/PrimaryTableView';

export default function BrandPage() {
  return <PrimaryTableView config={brand} />;
}
