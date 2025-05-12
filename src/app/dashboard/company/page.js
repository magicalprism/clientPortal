'use client';

import { company } from '@/collections/company';
import CollectionView from '@/components/views/CollectionView';

export default function CompanyPage() {
  return <CollectionView config={company} />;
}
