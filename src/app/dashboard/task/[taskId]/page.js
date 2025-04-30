import { CollectionDetailLayout } from '@/components/CollectionDetailLayout';

export default function TaskDetailPage(props) {
  return <CollectionDetailLayout collectionKey="task" params={props.params} />;
}
