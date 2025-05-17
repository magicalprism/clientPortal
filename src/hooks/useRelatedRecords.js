// hooks/useRelatedRecords.js
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
      tableFields = [],
      sourceKey,
      junctionTable,
      targetKey
    } = field.relation;

    const fetch = async () => {
      if (junctionTable && targetKey) {
        // PIVOT MODE (many-to-many)
        const { data, error } = await supabase
          .from(junctionTable)
          .select(`
            ${targetKey},
            related:${table}(
              id,
              ${tableFields.join(',')},
              assigned:assigned_id(title)
            )
          `)
          .eq(sourceKey, parentId);

        if (error) {
          console.error('[useRelatedRecords] junction error:', error);
          return;
        }

        const related = data.map(row => ({
          ...row.related,
          id: row[targetKey]
        }));

        setRecords(related);
      } else {
        // DIRECT FOREIGN KEY (one-to-many)
        const { data, error } = await supabase
          .from(table)
          .select(`*, assigned:assigned_id(title)`)
          .eq(sourceKey, parentId);

        if (error) {
          console.error('[useRelatedRecords] direct mode error:', error);
          return;
        }

        setRecords(data);
      }
    };

    fetch();
  }, [parentId, field]);

  return records;
};
