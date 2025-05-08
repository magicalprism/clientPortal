'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Container, Box, Typography, Paper, Button } from '@mui/material';
import { Plus } from '@phosphor-icons/react';

import { createClient } from '@/lib/supabase/browser';
import { CollectionTable } from '@/components/CollectionTable';
import { CollectionFilters } from '@/components/CollectionFilters';
import { CollectionSelectionProvider } from '@/components/CollectionSelectionContext';
import * as collections from '@/collections';

// This is a generic collection list page that works with any collection
export default function CollectionListPage({ collectionKey }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const supabase = createClient();
  
  const config = collections[collectionKey];
  if (!config) {
    return <div>Collection configuration not found for: {collectionKey}</div>;
  }
  
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  
  // Initialize filters from URL params or default filters
  const initializeFilters = () => {
    const urlFilters = {};
    const defaultFilters = config.defaultFilters || {};
    
    // Process URL parameters first
    if (searchParams) {
      for (const [key, value] of searchParams.entries()) {
        // Only add parameters that match our defined filters
        if (config.filters?.some(f => f.name === key)) {
          urlFilters[key] = value;
        }
      }
    }
    
    // Combine URL params with defaults (URL params take precedence)
    return { ...defaultFilters, ...urlFilters };
  };
  
  const [filters, setFilters] = useState(initializeFilters());
  const [sortDir, setSortDir] = useState(
    searchParams?.get('sort') || 
    (config.sortOptions?.length ? config.sortOptions[0].value : 'created:desc')
  );
  
  // Update URL when filters change
  const updateUrl = (newFilters, newSort) => {
    const url = new URL(window.location.href);
    
    // Clear existing parameters
    Array.from(url.searchParams.keys()).forEach(key => {
      url.searchParams.delete(key);
    });
    
    // Add new filter parameters
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) {
        url.searchParams.set(key, value);
      }
    });
    
    // Add sort parameter
    if (newSort) {
      url.searchParams.set('sort', newSort);
    }
    
    // Update the URL without reloading the page
    router.replace(pathname + '?' + url.searchParams.toString(), { scroll: false });
  };
  
  // Load data with current filters and sort
  const loadData = async () => {
    setLoading(true);
    
    try {
      let query = supabase.from(config.name).select('*');
      
      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          query = query.eq(key, value);
        }
      });
      
      // Apply sorting
      if (sortDir) {
        const [field, direction] = sortDir.split(':');
        query = query.order(field, { ascending: direction === 'asc' });
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error loading data:', error);
        setRows([]);
      } else {
        setRows(data || []);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle filter changes
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    updateUrl(newFilters, sortDir);
  };
  
  // Handle sort changes
  const handleSortChange = (newSort) => {
    setSortDir(newSort);
    updateUrl(filters, newSort);
  };
  
  // Load data when filters or sort change
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, sortDir]);
  
  // Set initial filters from URL or defaults when component mounts
  useEffect(() => {
    const initialFilters = initializeFilters();
    setFilters(initialFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  return (
    <CollectionSelectionProvider>
      <Container maxWidth="xl">
        <Box sx={{ py: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4">{config.label}</Typography>
          <Button
            variant="contained"
            startIcon={<Plus />}
            onClick={() => router.push(`/dashboard/${config.name}/new`)}
          >
            Add {config.label.slice(0, -1)} {/* Remove 's' from the end */}
          </Button>
        </Box>
        
        <Paper elevation={0} sx={{ mb: 3 }}>
          <CollectionFilters
            config={config}
            filters={filters}
            onChange={handleFilterChange}
            sortDir={sortDir}
            onSortChange={handleSortChange}
            onDeleteSuccess={loadData}
          />
          
          <CollectionTable
            config={config}
            rows={rows}
          />
        </Paper>
      </Container>
    </CollectionSelectionProvider>
  );
}