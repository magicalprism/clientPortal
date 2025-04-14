'use client';

import { useEffect, useState } from 'react';
import { Container, Typography } from '@mui/material';
import { project } from '@/collections/project';
import { CollectionFilters } from '@/components/CollectionFilters';
import { CollectionTable } from '@/components/CollectionTable';
import { createClient } from '@/lib/supabase/browser';
import { CollectionSelectionProvider } from '@/components/CollectionSelectionContext';
import { useCollectionSelection } from '@/components/CollectionSelectionContext';


const supabase = createClient();

export default function ProjectPage() {
  const [filters, setFilters] = useState({});
  const [sortDir, setSortDir] = useState('desc'); // ✅ DECLARE THIS!
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      let query = supabase.from(project.name).select('*');

      if (filters.status) query = query.eq('status', filters.status);
      if (filters.title) query = query.ilike('title', `%${filters.title}%`);

      if (sortDir === 'asc') {
        query = query.order('created', { ascending: true });
      } else {
        query = query.order('created', { ascending: false });
      }

      const { data, error } = await query;
      if (!error) setData(data);
    };

    fetchData();
  }, [filters, sortDir]);

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        {project.label}
      </Typography>

      <CollectionSelectionProvider ids={data.map((d) => d.id)}>
        <CollectionFilters
          config={project}
          filters={filters}
          onChange={setFilters}
          sortDir={sortDir}
          onSortChange={setSortDir}
        />

        <CollectionTable
          config={project}
          rows={data}
          selectionHook={useCollectionSelection()}
        />
</CollectionSelectionProvider>
    </Container>
  );
}
