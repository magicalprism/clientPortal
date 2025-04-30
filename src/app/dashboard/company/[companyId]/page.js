import { CollectionDetailLayout } from '@/components/CollectionDetailLayout';

export default function CompanyDetailPage(props) {
  return <CollectionDetailLayout collectionKey="company" params={props.params} />;
}
