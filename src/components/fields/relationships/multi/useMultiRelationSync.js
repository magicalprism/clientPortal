'use client';

import { createClient } from '@/lib/supabase/browser';

export const useMultiRelationSync = () => {
  const supabase = createClient();

const syncMultiRelation = async ({ field, parentId, selectedIds, options, onChange }) => {
    const { table, junctionTable, sourceKey, targetKey, labelField } = {
      ...field.relation,
      sourceKey: field.relation?.sourceKey || `${field.parentTable}_id`,
      targetKey: field.relation?.targetKey || `${field.relation?.table}_id`,
      labelField: field.relation?.labelField || 'title'
    };

    if (!parentId || !junctionTable) {
      console.warn('[useMultiRelationSync] Missing parentId or junctionTable');
      return;
    }

    try {
      await supabase.from(junctionTable).delete().eq(sourceKey, parentId);

      if (selectedIds.length > 0) {
        const newLinks = selectedIds.map(id => ({ [sourceKey]: parentId, [targetKey]: id }));
        await supabase.from(junctionTable).insert(newLinks);
      }

      const { data: linkedData, error } = await supabase
        .from(table)
        .select(`id, ${labelField}`)
        .in('id', selectedIds);

      if (error) {
        console.error('[useMultiRelationSync] Fetching updated records failed:', error);
      }

      if (onChange) {
    onChange(field, {
      ids: selectedIds.map(String),
      details: linkedData || []
    });
  }
  
  return linkedData;
    } catch (err) {
      console.error('[useMultiRelationSync] Sync error:', err);
    }
  };

  return { syncMultiRelation };
};
