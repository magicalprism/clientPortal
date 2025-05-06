import * as collections from '@/collections';
import { CollectionItemPage } from '@/components/CollectionItemPage';
import { QuickViewCard } from '@/components/QuickViewCard';
import { createClient } from '@/lib/supabase/server';
import { hydrateRelationshipLabels } from '@/lib/utils/hydrateRelationshipLabels';
import { Box, Container, Grid, Typography } from '@mui/material';

export async function CollectionDetailLayout({ collectionKey, params }) {
  const config = collections[collectionKey];
  const supabase = await createClient();
  const recordId = params?.[`${collectionKey}Id`];

  const relationshipJoins = config.fields
    .filter((field) =>
      (field.type === 'relationship' || field.type === 'media') &&
      field.relation?.table
    )
    .map((field) => {
      if (field.type === 'media') {
        return `${field.relation.table}_${field.name}:${field.name}(id, url, alt_text, copyright, file_path, mime_type, is_folder)`;
      } else if (field.type === 'relationship' && field.relation.labelField) {
        return `${field.relation.table}_${field.name}:${field.name}(${field.relation.labelField})`;
      }
      return null;
    });

  const selectFields = ['*', ...relationshipJoins].join(', ');

  const { data: record, error } = await supabase
    .from(config.name)
    .select(selectFields)
    .eq('id', Number(recordId))
    .single();

  if (error || !record) {
    return <Typography color="error">Error loading {collectionKey}.</Typography>;
  }

  const relationshipDetails = {};

  for (const field of config.fields) {
    const alias = `${field.relation?.table}_${field.name}`;
    const value = record[alias];
    if (value) {
      relationshipDetails[`${field.name}_details`] = value;
      delete record[alias];
    }
  }

  const multiRelations = await Promise.all(
    config.fields
      .filter((field) =>
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

        if (relError) return [field.name, { ids: [], details: [] }];

        const ids = joined.map((row) => row[field.relation.targetKey]);
        const details = joined.map((row) => row[field.relation.table]);

        return [field.name, { ids, details }];
      })
  );

  const multiRelationshipData = Object.fromEntries(
    multiRelations.flatMap(([name, { ids, details }]) => [
      [name, ids],
      [`${name}_details`, details],
    ])
  );

  const enriched = {
    ...record,
    ...relationshipDetails,
    ...multiRelationshipData,
  };

  const hydrated = hydrateRelationshipLabels(enriched, config);

  return (
    <Box sx={{ py: 4 }}>
      <Container maxWidth="xl">
        <Grid container spacing={4}>
          <Grid item xs={12} md={9}>
            <CollectionItemPage config={config} record={hydrated} />
          </Grid>
          <Grid item xs={12} md={3}>
            <QuickViewCard config={config} record={hydrated} />
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
