'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Container,
} from '@mui/material';
import { Plus as PlusIcon } from '@phosphor-icons/react';

import { createClient } from '@/lib/supabase/browser';
import { CollectionFilters } from '@/components/CollectionFilters';
import { CollectionTable } from '@/components/CollectionTable';
import { CollectionSelectionProvider } from '@/components/CollectionSelectionContext';
import { ViewSwitcher } from '@/components/ViewSwitcher';

export default function PrimaryTableView({ config }) {
  const supabase = createClient();
  const router = useRouter();

  const defaultFilters = (config.filters || []).reduce((acc, filter) => {
    if (filter.defaultValue !== undefined) {
      acc[filter.name] = filter.defaultValue;
    }
    return acc;
  }, {});
  

  const [filters, setFilters] = useState(defaultFilters);
  const [sortDir, setSortDir] = useState('desc');
  const [data, setData] = useState([]);
  const [refreshFlag, setRefreshFlag] = useState(0);
  const [currentView, setCurrentView] = useState(config.defaultView);
  

  const refresh = () => setRefreshFlag((prev) => prev + 1);

  const fetchData = async () => {
    // Dynamically build select clause including relationships
    const relatedFields = config.fields
      .filter(f => f.type === 'relationship' && f.relation?.labelField)
      .map(f => {
        const relationTableAlias = f.name.replace('_id', '');
        return `${relationTableAlias}:${f.name}(${f.relation.labelField})`;
      });

    const selectClause = ['*', ...relatedFields].join(', ');

    let query = supabase.from(config.name).select(selectClause);

    for (const filter of config.filters || []) {
      const val = filters[filter.name];
      if (!val) continue;

      if (['select', 'relationship'].includes(filter.type)) {
        query = query.eq(filter.name, val);
      } else if (filter.type === 'text') {
        query = query.ilike(filter.name, `%${val}%`);
      }
    }

    query = query.order('created_at', { ascending: sortDir === 'asc' });

    const { data, error } = await query;

    if (!error) {
      setData(
        data.map((row) => ({
          ...row,
          id: row.id ?? row[`${config.name}_id`],
        }))
      );
    } else {
      console.error('Supabase fetch error:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters, sortDir, refreshFlag]);

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <CollectionSelectionProvider ids={data.map((d) => d.id)}>
        {config.views && Object.keys(config.views).length > 1 ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              px: 3,
              py: 2,
              mb: 2,
              flexWrap: 'wrap',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 0,
                flexGrow: 1,
              }}
            >
              <ViewSwitcher
                currentView={currentView}
                onChange={setCurrentView}
                views={config.views}
                noLabel
              />

              <CollectionFilters
                config={config}
                filters={filters}
                onChange={setFilters}
                sortDir={sortDir}
                onSortChange={setSortDir}
                onDeleteSuccess={refresh}
              />
            </Box>

            <Button
              variant="contained"
              startIcon={<PlusIcon />}
              onClick={() => router.push(`/dashboard/${config.name}/create`)}
              sx={{ height: 40 }}
            >
              Add {config.label?.slice(0, -1)}
            </Button>
          </Box>
        ) : (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              px: 0,
              py: 2,
              mb: 2,
              flexWrap: 'wrap',
            }}
          >
            <CollectionFilters
              config={config}
              filters={filters}
              onChange={setFilters}
              sortDir={sortDir}
              onSortChange={setSortDir}
              onDeleteSuccess={refresh}
            />

            <Button
              variant="contained"
              startIcon={<PlusIcon />}
              onClick={() => router.push(`/dashboard/${config.name}/create`)}
              sx={{ height: 40 }}
            >
              Add {config.label?.slice(0, -1)}
            </Button>
          </Box>
        )}

        <CollectionTable config={config} rows={data} />
      </CollectionSelectionProvider>
    </Container>
  );
}
