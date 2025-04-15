import * as collections from '@/collections';
import { CollectionItemPage } from '@/components/CollectionItemPage';
import { QuickViewCard } from '@/components/QuickViewCard';
import { createClient } from '@/lib/supabase/server';
import { Box, Container, Grid } from '@mui/material';

export default async function ProjectDetailPage({ params }) {
  const { projectId } = params;
  const config = collections.project;

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('project')
    .select(`
      *,
      company:company_id ( title )
    `)
    .eq('id', Number(projectId))
    .single();

  if (data?.company) {
    data.company_id_label = data.company.title;
  }

  return (
    <Box sx={{ py: 4 }}>
      <Container maxWidth="xl">
        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            <CollectionItemPage config={config} record={data} />
          </Grid>
          <Grid item xs={12} md={4}>
            <QuickViewCard config={config} record={data} />
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
