import * as collections from '@/collections';
import { CollectionItemPage } from '@/components/CollectionItemPage';
import { QuickViewCard } from '@/components/QuickViewCard';
import { createClient } from '@/lib/supabase/server';
import { hydrateRelationshipLabels } from '@/lib/utils/hydrateRelationshipLabels';
import { Box, Container, Grid } from '@mui/material';

export default async function CompanyDetailPage(props) {
  const { companyId } = props.params;
  const config = collections.company;
  const supabase = await createClient();

  // Build dynamic relationship join string
  const relationshipJoins = config.fields
  .filter(field => field.type === 'relationship' && field.relation?.table && field.relation?.labelField)
  .map(field => {
    // Supabase expects: fieldName ( labelField )
    return `${field.name} ( ${field.relation.labelField} )`;
  })
  .join(', ');


  // Build full select string
  const selectFields = relationshipJoins ? `*, ${relationshipJoins}` : '*';

  // Fetch data from Supabase
  const { data, error } = await supabase
    .from(config.name)
    .select(selectFields)
    .eq('id', Number(companyId))
    .single();

  if (error || !data) {
    console.error('❌ Error loading company:', error);
    return <div>Error loading company.</div>;
  }

  // Hydrate label fields
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
