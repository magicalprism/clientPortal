import * as collections from '@/collections';
import { CollectionItemPage } from '@/components/CollectionItemPage';
import { QuickViewCard } from '@/components/QuickViewCard';
import { createClient } from '@/lib/supabase/server';
import { hydrateRelationshipLabels } from '@/lib/utils/hydrateRelationshipLabels';
import { Box, Container, Grid } from '@mui/material';

export default async function TaskDetailPage(props) {
  const { taskId } = await props.params;
  const config = collections.task;
  const supabase = await createClient();

  // 🧠 Step 1: Build dynamic relationship join string
  const relationshipJoins = config.fields
    .filter(field => field.type === 'relationship' && field.relation?.table && field.relation?.labelField)
    .map(field => `${field.relation.table}:${field.name} ( ${field.relation.labelField} )`)
    .join(', ');

  // 🧠 Step 2: Build full select string
  const selectFields = relationshipJoins ? `*, ${relationshipJoins}` : '*';

  // ✅ Step 3: Fetch data from Supabase
  const { data, error } = await supabase
    .from(config.name)
    .select(selectFields)
    .eq('id', Number(taskId))
    .single();

  // ✅ Step 4: Hydrate label fields from config
  const hydrated = hydrateRelationshipLabels(data, config);

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
