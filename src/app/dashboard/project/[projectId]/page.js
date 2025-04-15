//src/app/dashboard/[collection]/[projectId]/page.js
import * as collections from '@/collections';
import { CollectionItemPage } from '@/components/CollectionItemPage';
import { createClient } from '@/lib/supabase/server';

export default async function CollectionDetailPage({ params }) {
  // ❌ THIS IS THE PROBLEM:
  // const { collection, projectId } = params;

  // ✅ FIX: await params before accessing
  const awaitedParams = await params;
  const { collection, projectId } = awaitedParams;

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
