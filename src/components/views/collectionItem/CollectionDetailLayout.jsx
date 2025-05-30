import * as collections from '@/collections';
import { createClient } from '@/lib/supabase/server';
import { hydrateRecord } from '@/lib/utils/hydrateRecord'; // Import the better hydration function
import CollectionDetailClient from '@/components/views/collectionItem/CollectionDetailClient';


export async function CollectionDetailLayout({ collectionKey, recordId }) {
  const config = collections[collectionKey];
  const supabase = await createClient();

  if (!recordId) {
    return <div>No record ID provided.</div>;
  }

  // Fetch the base record - much simpler now!
  const { data: record, error } = await supabase
    .from(config.name)
    .select('*')
    .eq('id', Number(recordId))
    .single();

  if (error || !record) {
    return <div>Error loading data</div>;
  }

  // Use the comprehensive hydration function to handle all field types
  const hydratedRecord = await hydrateRecord(record, config, supabase);

  return (
    <CollectionDetailClient config={config} record={hydratedRecord} />
  );
}