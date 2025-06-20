'use client';

import { useEffect, useState } from 'react';
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
    const relatedFields = config.fields
      .filter(f => f.type === 'relationship' && f.relation?.labelField)
      .map(f => {
        const alias = f.name.replace('_id', '');
        if (f.relation.table === 'company') {
          return `${alias}:${f.name}(${f.relation.labelField}, chip_color)`;
        }
        return `${alias}:${f.name}(${f.relation.labelField})`;
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
      ...filters,
      ...forcedFilters
    };

    console.log('[Effective Filters]', effectiveFilters);

    const start = page * rowsPerPage;
    const end = start + rowsPerPage - 1;

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

    for (const f of config.filters || []) {
      if (f.name === 'sort') continue;
      const value = filters?.[f.name];
      if (!value || value === '' || (Array.isArray(value) && value.length === 0)) continue;

      console.log(`[Parent Filter Debug] ${f.name}:`, {
        value,
        isArray: Array.isArray(value),
        multiple: f.multiple,
        filterType: f.type
      });

      if (f.name === 'search') {
        // Get all text and rich text fields to search through
        // Include fields with no type (or undefined/null type) since they default to text
        const searchableFields = config.fields
          .filter(field => 
            ['text', 'richText'].includes(field.type) || 
            !field.type || 
            field.type === undefined || 
            field.type === null
          )
          .map(field => field.name);
        
        // If no searchable fields found, fallback to title and content
        if (searchableFields.length === 0) {
          parentQuery = parentQuery.or(`title.ilike.%${value}%,content.ilike.%${value}%`);
        } else {
          // Build OR condition for all searchable fields
          const searchConditions = searchableFields
            .map(fieldName => `${fieldName}.ilike.%${value}%`)
            .join(',');
          
          parentQuery = parentQuery.or(searchConditions);
        }
      } else if (f.multiple && Array.isArray(value)) {
        if (['select', 'relationship', 'boolean'].includes(f.type)) {
          parentQuery = parentQuery.in(f.name, value);
        } else if (f.type === 'text') {
          const conditions = value.map(v => `${f.name}.ilike.%${v}%`).join(',');
          parentQuery = parentQuery.or(conditions);
        }
      } else {
        if (['select', 'relationship', 'boolean'].includes(f.type)) {
          parentQuery = parentQuery.eq(f.name, value);
        } else if (f.type === 'text') {
          parentQuery = parentQuery.ilike(f.name, `%${value}%`);
        }
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

    for (const f of config.filters || []) {
      if (f.name === 'sort') continue;
      const value = filters?.[f.name];
      if (!value || value === '' || (Array.isArray(value) && value.length === 0)) continue;



      if (f.name === 'search') {
        // Get all text and rich text fields to search through
        // Include fields with no type (or undefined/null type) since they default to text
        const searchableFields = config.fields
          .filter(field => 
            ['text', 'richText'].includes(field.type) || 
            !field.type || 
            field.type === undefined || 
            field.type === null
          )
          .map(field => field.name);
        
        // If no searchable fields found, fallback to title and content
        if (searchableFields.length === 0) {
          childQuery = childQuery.or(`title.ilike.%${value}%,content.ilike.%${value}%`);
        } else {
          // Build OR condition for all searchable fields
          const searchConditions = searchableFields
            .map(fieldName => `${fieldName}.ilike.%${value}%`)
            .join(',');
          
          childQuery = childQuery.or(searchConditions);
        }
      } else if (f.multiple && Array.isArray(value)) {
        if (['select', 'relationship', 'boolean'].includes(f.type)) {
          childQuery = childQuery.in(f.name, value);
        } else if (f.type === 'text') {
          const conditions = value.map(v => `${f.name}.ilike.%${v}%`).join(',');
          childQuery = childQuery.or(conditions);
        }
      } else {
        if (['select', 'relationship', 'boolean'].includes(f.type)) {
          childQuery = childQuery.eq(f.name, value);
        } else if (f.type === 'text') {
          childQuery = childQuery.ilike(f.name, `%${value}%`);
        }
      }
    }

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

  const handleDeleteSuccess = (deletedIds) => {
  setData(prev => prev.filter(row => !deletedIds.includes(row.id)));
};



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
                onDeleteSuccess={handleDeleteSuccess}
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
