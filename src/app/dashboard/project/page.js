'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  Container,
  Stack,
  Typography,
} from '@mui/material';
import { Plus as PlusIcon } from "@phosphor-icons/react/dist/ssr/Plus";

import { project } from '@/collections/project';
import { createClient } from '@/lib/supabase/browser';
import { CollectionFilters } from '@/components/CollectionFilters';
import { CollectionTable } from '@/components/CollectionTable';
import { CollectionSelectionProvider } from '@/components/CollectionSelectionContext';

const supabase = createClient();

export default function ProjectPage() {
  const [filters, setFilters] = useState({});
  const [sortDir, setSortDir] = useState('desc');
  const [data, setData] = useState([]);
  const [refreshFlag, setRefreshFlag] = useState(0);
  const router = useRouter();

  const refresh = () => setRefreshFlag((prev) => prev + 1);

  const fetchData = async () => {
    let query = supabase.from(project.name).select('*');

    if (filters.status) query = query.eq('status', filters.status);
    if (filters.title) query = query.ilike('title', `%${filters.title}%`);

    query = query.order('created', { ascending: sortDir === 'asc' });

    const { data, error } = await query;

    if (!error) {
      const normalizedData = data.map((row) => ({
        ...row,
        id: row.id ?? row.project_id,
      }));
      setData(normalizedData);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters, sortDir, refreshFlag]);

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h4">{project.label}</Typography>

        <Button
          variant="contained"
          startIcon={<PlusIcon />}
          onClick={() => router.push('/project/create')}
        >
          Add Project
        </Button>
      </Stack>

      <CollectionSelectionProvider ids={data.map((d) => d.id)}>
        <CollectionFilters
          config={project}
          filters={filters}
          onChange={setFilters}
          sortDir={sortDir}
          onSortChange={setSortDir}
          onDeleteSuccess={refresh}
        />

        <CollectionTable config={project} rows={data} />
      </CollectionSelectionProvider>
    </Container>
  );
}
