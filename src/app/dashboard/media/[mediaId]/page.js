import { CollectionDetailLayout } from '@/components/CollectionDetailLayout';

export default async function TaskDetailPage({ params }) {
  const { taskId } = await params;
  return (
    <CollectionDetailLayout
      collectionKey="task"
      recordId={taskId}
    />
  );
}
