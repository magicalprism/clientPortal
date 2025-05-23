import { CollectionDetailLayout } from '@/components/views/collectionItem/CollectionDetailLayout';

export default async function ContactDetailPage({ params }) {
  const { contactId } = await params;
  return (
    <CollectionDetailLayout
      collectionKey="contact"
      recordId={contactId}
    />
  );
}
