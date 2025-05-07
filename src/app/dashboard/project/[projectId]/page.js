import { CollectionDetailLayout } from '@/components/CollectionDetailLayout';

export default async function ProjectDetailPage({ params }) {
  const { projectId } = await params;
  return (
    <CollectionDetailLayout
      collectionKey="project"
      recordId={projectId}
    />
  );
}
