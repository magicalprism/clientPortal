'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/browser';

export const useRelatedRecords = ({ parentId, field }) => {
  const [records, setRecords] = useState([]);
  const supabase = createClient();

  useEffect(() => {
    if (!parentId || !field?.relation) return;

    const {
      table,
      labelField = 'title',
      tableFields = [],
      sourceKey,
      junctionTable,
      targetKey
    } = field.relation;

    // Defensive checks
    if (!table || !sourceKey || (junctionTable && !targetKey)) {
      console.error('[useRelatedRecords] Missing config values:', { table, sourceKey, targetKey });
      return;
    }

    const fetch = async () => {
      try {
        if (junctionTable && targetKey) {
          // MANY-TO-MANY (via junction table)
          const fields = Array.from(new Set(['id', labelField, ...tableFields]));
          const selectedFields = fields.join(', ');

          const { data, error } = await supabase
            .from(junctionTable)
            .select(`
              ${targetKey},
              related:${table}(
                ${selectedFields}
              )
            `)
            .eq(sourceKey, parentId);

          if (error) {
            console.error('[useRelatedRecords] junction error:', error);
            return;
          }

          const related = (data || []).map(row => ({
            ...row.related,
            id: row[targetKey] // ensure we retain the ID from the junction
          }));

          setRecords(related);
        } else {
          // ONE-TO-MANY (foreign key on child)
          const fields = Array.from(new Set(['id', labelField, ...tableFields]));
          const selectedFields = fields.join(', ');

          const { data, error } = await supabase
            .from(table)
            .select(selectedFields)
            .eq(sourceKey, parentId);

          if (error) {
            console.error('[useRelatedRecords] direct mode error:', error);
            return;
          }

          setRecords(data);
        }
      } catch (err) {
        console.error('[useRelatedRecords] unexpected error:', err);
      }
    };

    fetch();
  }, [parentId, field]);

  return records;
};
