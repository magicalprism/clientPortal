'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/browser';

export const useMultiRelationOptions = ({ field }) => {
  const supabase = createClient();
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);

  const labelField = field.relation?.labelField || 'title';

  useEffect(() => {
    const loadOptions = async () => {
      const { table, filter = {} } = field.relation || {};
      if (!table || !labelField) return;

      let query = supabase.from(table).select(`id, ${labelField}, parent_id`);
      Object.entries(filter).forEach(([key, val]) => {
        query = query.eq(key, val);
      });

      const { data, error } = await query;

      if (error) {
        console.error('[MultiRelationOptions] Failed to load:', error);
      } else {
        const tree = buildTree(data);
        const flat = flattenTreeWithIndent(tree, 0);

        // Deduplicate by `id`
        const deduplicated = Array.from(new Map(flat.map(item => [item.id, item])).values());
        setOptions(deduplicated);
      }

      setLoading(false);
    };

    loadOptions();
  }, [field]);

  const buildTree = (items) => {
    const map = new Map();
    const roots = [];

    items.forEach(item => map.set(item.id, { ...item, children: [] }));
    map.forEach(item => {
      if (item.parent_id && map.has(item.parent_id)) {
        map.get(item.parent_id).children.push(item);
      } else {
        roots.push(item);
      }
    });

    return roots;
  };

  const flattenTreeWithIndent = (nodes, depth = 0) => {
    const sortedNodes = [...nodes].sort((a, b) =>
      (a[labelField] || '').localeCompare(b[labelField] || '')
    );

    return sortedNodes.flatMap(node => {
      const label = node[labelField]?.trim() || 'Untitled';
      const prefix = '—'.repeat(depth);
      const formatted = { ...node, indentedLabel: `${prefix} ${label}`.trim() };
      return [formatted, ...flattenTreeWithIndent(node.children || [], depth + 1)];
    });
  };

  return { options, loading, setOptions };
};
