import { createClient } from '@/lib/supabase/browser';

const PIVOT_MAP = {
  element: [{ table: 'element_section', foreignKey: 'element_id' }],
  section: [
    { table: 'element_section', foreignKey: 'section_id' },
    { table: 'media_section', foreignKey: 'section_id' }
  ],
  comment: [{ table: 'comment_contact', foreignKey: 'comment_id' }],
  contact: [{ table: 'comment_contact', foreignKey: 'contact_id' }],
  media: [{ table: 'media_section', foreignKey: 'media_id' }],
  contract: [{ table: 'contract_payment', foreignKey: 'contract_id' }],
  payment: [{ table: 'contract_payment', foreignKey: 'payment_id' }]
};

export async function deleteWithDependencies(tableName, ids = []) {
  const supabase = createClient();

  try {
    const dependencies = PIVOT_MAP[tableName] || [];

    // Step 1: Delete from all pivot tables referencing this entity
    for (const dep of dependencies) {
      const { error: pivotError } = await supabase
        .from(dep.table)
        .delete()
        .in(dep.foreignKey, ids);
      if (pivotError) throw new Error(`Failed to delete from ${dep.table}: ${pivotError.message}`);
    }

    // Step 2: Delete from the main table
    const { error: deleteError } = await supabase.from(tableName).delete().in('id', ids);
    if (deleteError) throw new Error(`Failed to delete from ${tableName}: ${deleteError.message}`);

    return { success: true };
  } catch (err) {
    console.error('[Cascade Delete Error]', err);
    return { success: false, error: err.message };
  }
}
