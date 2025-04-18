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
    const applyFilters = async () => {
      let updatedRows = [...rows];

      for (const filter of field.relation.filters || []) {
        const val = filters[filter.name];
        if (!val) continue;

        if (filter.type === 'select' || filter.type === 'relationship') {
          updatedRows = updatedRows.filter(row => String(row[filter.name]) === String(val));
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
  }, [filters, rows, field.relation.filters]);

  const displayConfig = field.relation.tableFields
    ? {
        ...config,
        fields: config.fields.filter(f => field.relation.tableFields.includes(f.name))
      }
    : config;

  return (
    <CollectionSelectionProvider ids={filteredRows.map((r) => r.id)}>
      <CollectionFilters
        key={field.name}
        config={{
          ...displayConfig,
          filters: field.relation.filters || []
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
        fieldContext={field}
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