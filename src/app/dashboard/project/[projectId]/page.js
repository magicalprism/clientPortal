import * as collections from '@/collections';
import { CollectionItemPage } from '@/components/CollectionItemPage';
import { createClient } from '@/lib/supabase/server';

export default async function ProjectDetailPage({ params }) {
  const { projectId } = params;
  const config = collections['project'];

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('project')
    .select(`
      *,
      company:company_id ( title ),
      server:server_id ( title ),
      domain_login:domain_login_id ( title ),
      care_plan:care_plan_id ( title )
    `)
    .eq('id', Number(projectId))
    .single();

  // ✅ Flatten relationship labels so formatValue can use them
  if (data?.company) data.company_id_label = data.company.title;
  if (data?.server) data.server_id_label = data.server.title;
  if (data?.domain_login) data.domain_login_id_label = data.domain_login.title;
  if (data?.care_plan) data.care_plan_id_label = data.care_plan.title;

  if (error || !data) {
    return <div>❌ Error loading project: {error?.message}</div>;
  }

  return <CollectionItemPage config={config} record={data} />;
}
