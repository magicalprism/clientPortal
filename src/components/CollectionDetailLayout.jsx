import * as collections from '@/collections';
import { createClient } from '@/lib/supabase/server';
import { hydrateRelationshipLabels } from '@/lib/utils/hydrateRelationshipLabels';
import CollectionDetailClient from '@/components/CollectionDetailClient'; // ⬅️ you'll create this

export async function CollectionDetailLayout({ collectionKey, recordId }) {
  const config = collections[collectionKey];
  const supabase = await createClient();

  if (!recordId) {
    return <div>No record ID provided.</div>;
  }

  const relationshipJoins = config.fields
    .filter(
      (field) =>
        (field.type === 'relationship' || field.type === 'media') &&
        field.relation?.table
    )
    .map((field) => {
      if (field.type === 'media') {
        return `${field.relation.table}_${field.name}:${field.name}(id, url, alt_text, copyright, file_path, mime_type, is_folder)`;
      } else {
        return `${field.relation.table}_${field.name}:${field.name}(${field.relation.labelField})`;
      }
    });

  const selectFields = ['*', ...relationshipJoins].join(', ');

  const { data: record, error } = await supabase
    .from(config.name)
    .select(selectFields)
    .eq('id', Number(recordId))
    .single();

  if (error || !record) {
    return <div>Error loading data</div>;
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
        const { data: joined } = await supabase
          .from(field.relation.junctionTable)
          .select(
            `${field.relation.targetKey}, ${field.relation.table}(id, ${field.relation.labelField})`
          )
          .eq(field.relation.sourceKey, record.id);

        const ids = joined.map((row) => row[field.relation.targetKey]);
        const details = joined.map((row) => row[field.relation.table]);

        return [field.name, { ids, details }];
      })
  );

  const multiRelationshipData = Object.fromEntries(
    multiRelations.flatMap(([name, { ids, details }]) => [
      [name, ids],
      [`${name}_details`, details]
    ])
  );

  const hydrated = hydrateRelationshipLabels(
    {
      ...record,
      ...relationshipDetails,
      ...multiRelationshipData
    },
    config
  );

  return (
    <CollectionDetailClient config={config} record={hydrated} />
  );
}
