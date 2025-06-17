import { deleteWithDependencies as deleteWithDeps } from '@/lib/supabase/queries/operations/deleteOps';

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
  try {
    const dependencies = PIVOT_MAP[tableName] || [];
    
    // Use the query function instead of direct Supabase queries
    return await deleteWithDeps(tableName, ids, dependencies);
  } catch (err) {
    console.error('[Cascade Delete Error]', err);
    return { success: false, error: err.message };
  }
}
