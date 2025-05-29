// /components/views/collectionItem/CollectionCreateLayout.jsx
'use client';
import * as collections from '@/collections';
import ContractCreateForm from '@/components/dashboard/contract/ContractCreateForm';
import { useRouter } from 'next/navigation';

export function CollectionCreateLayout({ collectionKey }) {
  const config = collections[collectionKey];
  const router = useRouter();

  if (!config) {
    return <div>Collection not found</div>;
  }

  // Handle different collection types
  if (collectionKey === 'contract') {
    return (
      <ContractCreateForm
        config={config}
        onSave={(savedRecord) => {
          router.push(`/dashboard/${collectionKey}/${savedRecord.id}`);
        }}
        onCancel={() => {
          router.push(`/dashboard/${collectionKey}`);
        }}
      />
    );
  }

  // Default create form for other collections
  // You could add other specialized create forms here
  return (
    <div>Generic create form for {collectionKey} coming soon...</div>
  );
}