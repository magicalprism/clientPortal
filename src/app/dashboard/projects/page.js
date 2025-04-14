'use client';

import { useEffect, useState } from 'react';
import { Container, Typography } from '@mui/material';
import { project } from '@/collections/project';
import { CollectionFilters } from '@/components/CollectionFilters';
import { CollectionTable } from '@/components/CollectionTable';
import { createClient } from '@/lib/supabase/browser';
import { CollectionSelectionProvider } from '@/components/CollectionSelectionContext';

const supabase = createClient();

export default function ProjectPage() {
  const [filters, setFilters] = useState({});
  const [sortDir, setSortDir] = useState('desc');
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      let query = supabase.from(project.name).select('*');

      if (filters.status) query = query.eq('status', filters.status);
      if (filters.title) query = query.ilike('title', `%${filters.title}%`);

      query = query.order('created', { ascending: sortDir === 'asc' });

      const { data, error } = await query;

      if (!error) {
        const normalizedData = data.map((row) => ({
          ...row,
          id: row.id ?? row.uuid ?? row.project_id // ✅ normalize ID
        }));
        setData(normalizedData);
      }
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
        />
      </CollectionSelectionProvider>
    </Container>
  );
}
