'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  Container,
  Stack,
  Typography,
} from '@mui/material';
import { Plus as PlusIcon } from '@phosphor-icons/react';

import { createClient } from '@/lib/supabase/browser';
import { CollectionFilters } from '@/components/CollectionFilters';
import { CollectionTable } from '@/components/CollectionTable';
import { CollectionSelectionProvider } from '@/components/CollectionSelectionContext';

export default function PrimaryCollectionTable({ config }) {
  const supabase = createClient();
  const [filters, setFilters] = useState({});
  const [sortDir, setSortDir] = useState('desc');
  const [data, setData] = useState([]);
  const [refreshFlag, setRefreshFlag] = useState(0);
  const router = useRouter();

  const refresh = () => setRefreshFlag((prev) => prev + 1);

  const fetchData = async () => {
    let query = supabase.from(config.name).select('*');

    for (const filter of config.filters || []) {
      const val = filters[filter.name];
      if (!val) continue;

      if (filter.type === 'select') {
        query = query.eq(filter.name, val);
      }
      if (filter.type === 'text') {
        query = query.ilike(filter.name, `%${val}%`);
      }
      if (filter.type === 'relationship') {
        query = query.eq(filter.name, val);
      }
    }

    query = query.order('created', { ascending: sortDir === 'asc' });

    const { data, error } = await query;
    if (!error) {
      setData(
        data.map((row) => ({
          ...row,
          id: row.id ?? row[`${config.name}_id`],
        }))
      );
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters, sortDir, refreshFlag]);

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">{config.label}</Typography>
        <Button
          variant="contained"
          startIcon={<PlusIcon />}
          onClick={() => router.push(`/dashboard/${config.name}/create`)}
        >
          Add {config.label?.slice(0, -1)}
        </Button>
      </Stack>

      <CollectionSelectionProvider ids={data.map((d) => d.id)}>
        <CollectionFilters
          config={config}
          filters={filters}
          onChange={setFilters}
          sortDir={sortDir}
          onSortChange={setSortDir}
          onDeleteSuccess={refresh}
        />
        <CollectionTable config={config} rows={data} />
      </CollectionSelectionProvider>
    </Container>
  );
}