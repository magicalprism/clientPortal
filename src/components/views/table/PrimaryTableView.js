'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography
} from '@mui/material';

import { createClient } from '@/lib/supabase/browser';
import { CollectionTable } from '@/components/views/table/CollectionTable';
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
  // Update the related fields selection to include chip_color for company relationships
  const relatedFields = config.fields
    .filter(f => f.type === 'relationship' && f.relation?.labelField)
    .map(f => {
      const relationTableAlias = f.name.replace('_id', '');
      
      // Special handling for company relationships to include chip_color
      if (f.relation.table === 'company') {
        return `${relationTableAlias}:${f.name}(${f.relation.labelField}, chip_color)`;
      }
      
      // Regular relationship fields
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
      .range(start, end);

    if (columnExists) {
      parentQuery = parentQuery.order(field, { ascending, nullsLast: true });
    } else {
      parentQuery = parentQuery.order('created_at', { ascending: false, nullsLast: true });
    }

    // Apply filters to parent query
    for (const filter of config.filters || []) {
      if (filter.name === 'sort') continue;
      const value = filters?.[filter.name];
      
      // Skip if no value, empty string, or empty array
      if (!value || value === '' || (Array.isArray(value) && value.length === 0)) continue;
      
      console.log(`[Parent Filter Debug] ${filter.name}:`, { 
        value, 
        isArray: Array.isArray(value), 
        multiple: filter.multiple,
        filterType: filter.type 
      });
      
      if (filter.multiple && Array.isArray(value) && value.length > 0) {
        // Handle multi-select filters - "contains any of these values"
        console.log(`[Multi Filter] Applying .in(${filter.name}, [${value.join(', ')}])`);
        if (['select', 'relationship'].includes(filter.type)) {
          parentQuery = parentQuery.in(filter.name, value);
        } else if (filter.type === 'text') {
          // For text filters with multiple values, use OR logic
          const textConditions = value.map(v => `${filter.name}.ilike.%${v}%`).join(',');
          parentQuery = parentQuery.or(textConditions);
        }
      } else if (!Array.isArray(value) && value !== '' && value !== null && value !== undefined) {
        // Handle single-select filters (existing logic)
        console.log(`[Single Filter] Applying .eq(${filter.name}, ${value})`);
        if (['select', 'relationship'].includes(filter.type)) {
          parentQuery = parentQuery.eq(filter.name, value);
        } else if (filter.type === 'text') {
          parentQuery = parentQuery.ilike(filter.name, `%${value}%`);
        }
      }
    }

    // Apply forced filters to parent query
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

    // Now create and apply filters to child query
    const parentIds = parents.map(row => row.id);
    let childQuery = supabase
      .from(config.name)
      .select(selectClause)
      .in('parent_id', parentIds);

    if (columnExists) {
      childQuery = childQuery.order(field, { ascending, nullsLast: true });
    }

    // Apply the same filters to child query
    for (const filter of config.filters || []) {
      if (filter.name === 'sort') continue;
      const value = filters?.[filter.name];
      
      if (!value || value === '' || (Array.isArray(value) && value.length === 0)) continue;
      
      console.log(`[Child Filter Debug] ${filter.name}:`, { 
        value, 
        isArray: Array.isArray(value), 
        multiple: filter.multiple 
      });
      
      if (filter.multiple && Array.isArray(value) && value.length > 0) {
        if (['select', 'relationship'].includes(filter.type)) {
          childQuery = childQuery.in(filter.name, value);
        } else if (filter.type === 'text') {
          const textConditions = value.map(v => `${filter.name}.ilike.%${v}%`).join(',');
          childQuery = childQuery.or(textConditions);
        }
      } else if (!Array.isArray(value) && value !== '' && value !== null && value !== undefined) {
        if (['select', 'relationship'].includes(filter.type)) {
          childQuery = childQuery.eq(filter.name, value);
        } else if (filter.type === 'text') {
          childQuery = childQuery.ilike(filter.name, `%${value}%`);
        }
      }
    }

    // Apply forced filters to child query
    for (const [key, value] of Object.entries(effectiveFilters)) {
      const alreadyHandled = (config.filters || []).some(f => f.name === key);
      if (!alreadyHandled && value !== undefined && value !== '') {
        childQuery = childQuery.eq(key, value);
      }
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