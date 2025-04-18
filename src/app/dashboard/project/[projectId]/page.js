import * as collections from '@/collections';
import { CollectionItemPage } from '@/components/CollectionItemPage';
import { QuickViewCard } from '@/components/QuickViewCard';
import { createClient } from '@/lib/supabase/server';
import { hydrateRelationshipLabels } from '@/lib/utils/hydrateRelationshipLabels';
import { Box, Container, Grid } from '@mui/material';

export default async function ProjectDetailPage(props) {
  const { projectId } = await props.params;
  const config = collections.project;
  const supabase = await createClient();

  // 🧠 Step 1: Build dynamic relationship join string
  const relationshipJoins = config.fields
    .filter(field => field.type === 'relationship' && field.relation?.table && field.relation?.labelField)
    .map(field => `${field.relation.table}:${field.name} ( ${field.relation.labelField} )`)
    .join(', ');

  // 🧠 Step 2: Build full select string (and add pivot relation)
  const selectFields = relationshipJoins
    ? `*, ${relationshipJoins}, project_task(task:task_id(id, title))`
    : `*, project_task(task:task_id(id, title))`;

  // ✅ Step 3: Fetch data from Supabase
  const { data, error } = await supabase
    .from(config.name)
    .select(selectFields)
    .eq('id', Number(projectId))
    .single();

  if (error || !data) {
    console.error('❌ Error loading project:', error);
    return <div>Error loading project.</div>;
  }

  // ✅ Step 4: Extract task IDs from pivot table
  const taskObjects = data.project_task?.map(pt => pt.task).filter(Boolean) || [];

      const enrichedData = {
        ...data,
        tasks: taskObjects
      };

        // ✅ Step 5: Hydrate label fields
  const hydrated = hydrateRelationshipLabels(enrichedData, config);

      console.log('✅ enrichedData.tasks:', enrichedData.tasks);
console.log('✅ hydrated.tasks_details:', hydrated.tasks_details);

  return (
    <Box sx={{ py: 4 }}>
      <Container maxWidth="xl">
        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            <CollectionItemPage config={config} record={hydrated} />
          </Grid>
          <Grid item xs={12} md={4}>
            <QuickViewCard config={config} record={hydrated} />
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
