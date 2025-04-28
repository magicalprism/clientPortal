import * as collections from '@/collections';
import { CollectionItemPage } from '@/components/CollectionItemPage';
import { QuickViewCard } from '@/components/QuickViewCard';
import { createClient } from '@/lib/supabase/server';
import { hydrateRelationshipLabels } from '@/lib/utils/hydrateRelationshipLabels';
import { Box, Container, Grid } from '@mui/material';

export default async function ProjectDetailPage(props) {
  const params = await props.params; // 🧠 await params properly
  const collectionKey = 'project';
  const config = collections[collectionKey];
  const supabase = await createClient();
  const recordId = params?.[`${collectionKey}Id`];


  // Step 1: Basic relationship joins (single-table)
  const relationshipJoins = config.fields
    .filter(
      (field) =>
        (field.type === 'relationship' || field.type === 'media') &&
        field.relation?.table &&
        field.relation?.labelField &&
        !field.relation.labelField.includes('(')
    )
    .map(
      (field) =>
        `${field.relation.table}:${field.name}(${field.relation.labelField})`
    );

  const selectFields = ['*', ...relationshipJoins].join(', ');

  console.log('🧠 Basic SELECT:', selectFields);

  // Step 2: Load base record
  const { data: record, error } = await supabase
    .from(config.name)
    .select(selectFields)
    .eq('id', Number(recordId))
    .single();

  if (error || !record) {
    console.error('❌ Error loading record:', error);
    return <div>Error loading {collectionKey}.</div>;
  }

  // Step 3: Load multi-relationship data
  const multiRelations = await Promise.all(
    config.fields
      .filter(
        (field) =>
          field.type === 'multiRelationship' &&
          field.relation?.junctionTable &&
          field.relation?.table &&
          field.relation?.sourceKey &&
          field.relation?.targetKey &&
          field.relation?.labelField
      )
      .map(async (field) => {
        const { data: joined, error: relError } = await supabase
          .from(field.relation.junctionTable)
          .select(
            `${field.relation.targetKey}, ${field.relation.table}(id, ${field.relation.labelField})`
          )
          .eq(field.relation.sourceKey, record.id);

        if (relError) {
          console.error(`❌ Failed to load ${field.name}:`, relError);
          return [field.name, { ids: [], details: [] }];
        }

        const ids = joined.map((row) => row[field.relation.targetKey]);
        const details = joined.map((row) => row[field.relation.table]);

        return [field.name, { ids, details }];
      })
  );

  // Step 4: Merge multi-relationship data
  const multiRelationshipData = Object.fromEntries(
    multiRelations.flatMap(([name, { ids, details }]) => [
      [name, ids],
      [`${name}_details`, details]
    ])
  );

  const enriched = {
    ...record,
    ...multiRelationshipData,
  };

  // Step 5: Hydrate label/lookup fields
  const hydrated = hydrateRelationshipLabels(enriched, config);

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
