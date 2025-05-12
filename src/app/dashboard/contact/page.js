'use client';

import { contact } from '@/collections/contact';
import CollectionView from '@/components/views/CollectionView';

export default function ContactPage() {
  return <CollectionView config={contact} />;
}
