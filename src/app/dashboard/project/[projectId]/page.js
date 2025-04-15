// src/app/dashboard/[collection]/[id]/page.js
import * as collections from '@/collections';
import { CollectionItemPage } from '@/components/CollectionItemPage';
import { createClient } from '@/lib/supabase/server';

export default async function CollectionDetailPage({ params }) {
  const { collection, projectId } = params;

  const config = collections[collection];
  if (!config) {
    return <div>❌ Collection config not found for "{collection}"</div>;
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from(config.name)
    .select('*')
    .eq('id', Number(projectId))
    .single();

  if (error || !data) {
    return <div>❌ Error loading {config.label}: {error?.message}</div>;
  }

  return <CollectionItemPage config={config} record={data} />;
}
