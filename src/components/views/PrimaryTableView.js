'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography
} from '@mui/material';

import { createClient } from '@/lib/supabase/browser';
import { CollectionTable } from '@/components/CollectionTable';
import { buildNestedRows } from '@/lib/utils/buildNestedRows';
import { CollectionLayout } from '@/components/views/CollectionLayout';

export default function PrimaryTableView({
  config,
  filters = {},
  setFilters,
  sortDir,
  refreshFlag,
  onIdsChange,
  page,
  rowsPerPage,
  setTotalCount,
  totalCount,
}) {
  const supabase = createClient();
  const router = useRouter();
  const [expandedRowIds, setExpandedRowIds] = useState(new Set());
  const [data, setData] = useState([]);
  const [currentView, setCurrentView] = useState(config.defaultView);

  const refresh = () => setRefreshFlag((prev) => prev + 1);

  const fetchData = async () => {
    const relatedFields = config.fields
      .filter(f => f.type === 'relationship' && f.relation?.labelField)
      .map(f => {
        const relationTableAlias = f.name.replace('_id', '');
        return `${relationTableAlias}:${f.name}(${f.relation.labelField})`;
      });

    const selectClause = ['*', ...relatedFields].join(', ');

    const sortValue = filters.sort ?? config.filters?.find(f => f.name === 'sort')?.defaultValue ?? 'created_at:desc';
    let [field, direction] = sortValue.split(':');
    const ascending = direction === 'asc';
    const columnExists = config.fields.some(f => f.name === field);

    const defaultFilters = Object.fromEntries(
        (config.filters || [])
          .filter(f => f.defaultValue !== undefined)
          .map(f => [f.name, f.defaultValue])
      );

      const forcedFilters = config?.forcedFilters || {};

      const effectiveFilters = {
        ...defaultFilters,
        ...filters,         // From user interaction (e.g. dropdown)
        ...forcedFilters    // From parent view like ProjectItemPage
      };
console.log('[Effective Filters]', effectiveFilters);

    const start = page * rowsPerPage;
    const end = start + rowsPerPage - 1;

       // Count query to get total number of parents
    const { count, error: countError } = await supabase
      .from(config.name)
      .select('*', { count: 'exact', head: true })
      .is('parent_id', null);
    if (countError) {
      console.error('Count error:', countError);
    } else if (setTotalCount) {
      setTotalCount(count || 0);
    }


    if (start >= totalCount) {
  console.warn('Page out of bounds — skipping fetch:', { page, start, totalCount });
  setData([]);
  return;
}

    let parentQuery = supabase
      .from(config.name)
      .select(selectClause, { count: 'exact' })
      .is('parent_id', null)
      .range(start, end)
      .order(field, { ascending, nullsLast: true })

    if (columnExists) {
      parentQuery = parentQuery.order(field, { ascending, nullsLast: true });
    } else {
      parentQuery = parentQuery.order('created_at', { ascending: false, nullsLast: true });
    }

    for (const filter of config.filters || []) {
      if (filter.name === 'sort') continue;
      const value = filters?.[filter.name];
      if (!value) continue;
      if (['select', 'relationship'].includes(filter.type)) {
        parentQuery = parentQuery.eq(filter.name, value);
      } else if (filter.type === 'text') {
        parentQuery = parentQuery.ilike(filter.name, `%${value}%`);
      }
    }

    for (const [key, value] of Object.entries(effectiveFilters)) {
  const alreadyHandled = (config.filters || []).some(f => f.name === key);
  if (!alreadyHandled && value !== undefined && value !== '') {
    console.log(`[Forced Filter Applied] ${key} = ${value}`);
    parentQuery = parentQuery.eq(key, value);
  }
}

    const { data: parents, error: parentError } = await parentQuery;
    if (setTotalCount) setTotalCount(count || 0);

    if (parentError) {
      console.error('Error fetching parent records:', parentError);
      return;
    }

    const parentIds = parents.map(row => row.id);
    let childQuery = supabase
  .from(config.name)
  .select(selectClause)
  .in('parent_id', parentIds);

if (columnExists) {
  childQuery = childQuery.order(field, { ascending, nullsLast: true });
}

const { data: children, error: childError } = await childQuery;


    if (childError) {
      console.error('Error fetching child records:', childError);
      return;
    }

    const combined = [...parents, ...(children || [])];
    const flatRows = combined.map(row => ({
      ...row,
      id: row.id ?? row[`${config.name}_id`],
    }));

    const nestedRows = buildNestedRows(flatRows);
    setData(nestedRows);

    // Auto-expand parents of children
    const autoExpanded = new Set();
    (children || []).forEach(child => {
      if (child.parent_id) autoExpanded.add(child.parent_id);
    });
    setExpandedRowIds(autoExpanded);
  };

  useEffect(() => {
    fetchData();
  }, [filters, sortDir, refreshFlag, page, rowsPerPage]);

  

  useEffect(() => {
    if (onIdsChange) {
      onIdsChange(data.map((d) => d.id));
    }
  }, [data]);



  return (
    <Box sx={{ px: 0 }}>
      <Typography sx={{ py: 3 }} variant="h5" gutterBottom>
        {(config?.singularLabel || config?.label || 'Untitled') + ' Lists'}
      </Typography>

      <CollectionTable
        config={config}
        rows={data}
        expandedRowIds={expandedRowIds}
        rowSx={{
          '& .MuiTableCell-root': { borderBottom: '1px solid #e0e0e0' },
          '& .MuiTableCell-root > .MuiBox-root': { p: '0 !important', m: 0 }
        }}
        childRenderer={(row) => {
          if (!row.children || !row.children.length) return null;
          return (
            <Box sx={{ pl: 4 }}>
              <CollectionLayout
                config={config}
                currentView={currentView}
                onViewChange={(v) => {
                  setCurrentView(v);
                  router.push(`?view=${v}`);
                }}
                filters={filters}
                onFilterChange={setFilters}
                onDeleteSuccess={refresh}
              />
              <CollectionTable
                config={config}
                rows={row.children}
                hideHead
                fieldContext={{ relation: { tableFields: ['title', 'status'] } }}
              />
            </Box>
          );
        }}
      />
    </Box>
  );
}