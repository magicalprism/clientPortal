'use client';

import { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { CollectionSelectionProvider } from '@/components/CollectionSelectionContext';
import { CollectionFilters } from '@/components/CollectionFilters';
import { CollectionTable } from '@/components/CollectionTable';
import { createClient } from '@/lib/supabase/browser';

export const MiniCollectionTable = ({ field, config, rows, parentId }) => {
  const supabase = createClient();
  const [filters, setFilters] = useState({});
  const [filteredRows, setFilteredRows] = useState(rows);

  useEffect(() => {
  const defaultValues = (field.filters || []).reduce((acc, filter) => {
    if (filter.defaultValue !== undefined) {
      acc[filter.name] = filter.defaultValue;
    }
    return acc;
  }, {});
  setFilters(defaultValues);
}, [field.filters]);

  useEffect(() => {
    const applyFilters = async () => {
      let updatedRows = [...rows];

      for (const filter of field.filters || []) {
        const val = filters[filter.name];
        if (!val) continue;

        if (filter.type === 'select' || filter.type === 'relationship') {
  const filterValue = typeof val === 'object' && val !== null ? val.value : val;
  updatedRows = updatedRows.filter(row => String(row[filter.name]) === String(filterValue));
}


        if (filter.type === 'text') {
          updatedRows = updatedRows.filter(row =>
            String(row[filter.name] || '').toLowerCase().includes(String(val).toLowerCase())
          );
        }
      }

      setFilteredRows(updatedRows);
    };

    applyFilters();
  }, [filters, rows, field.filters]);

  const displayConfig = field.relation.tableFields
    ? {
        ...config,
        fields: config.fields.filter(f => field.relation.tableFields.includes(f.name))
      }
    : config;

  return (
    <CollectionSelectionProvider ids={filteredRows.map((r) => r.id)}>
      <CollectionFilters
        config={{
          ...displayConfig,
          filters: field.filters || []
        }}
        filters={filters}
        onChange={setFilters}
        sortDir="asc"
        onSortChange={() => {}}
        onDeleteSuccess={() => {}}
      />

      <CollectionTable
        config={{
          ...displayConfig,
          showEditButton: false
        }}
        rows={filteredRows}
        fieldContext={{
  relation: field.relation
}}
      />

      {filteredRows.length === 0 && (
        <Box sx={{ p: 3 }}>
          <Typography color="text.secondary" sx={{ textAlign: 'center' }} variant="body2">
            No matching records.
          </Typography>
        </Box>
      )}
    </CollectionSelectionProvider>
  );
};