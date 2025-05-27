'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { CollectionLayout } from '@/components/views/CollectionLayout';
import ChecklistView from '@/components/views/checklists/ChecklistView';
import PrimaryTableView from '@/components/views/table/PrimaryTableView';
import { CollectionSelectionProvider } from '@/components/views/components/CollectionSelectionContext';
import CalendarView from '@/components/views/calendar/CalendarView';
import { createClient } from '@/lib/supabase/browser';
import { getCurrentContactId } from '@/lib/utils/getCurrentContactId';
import { Box } from '@mui/material';




const componentMap = {
  ChecklistView,
  PrimaryTableView,
  CalendarView,
};

export default function CollectionView({ config, event, forcedFilters = {}, variant = 'default' }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [viewKey, setViewKey] = useState(config.defaultView);
  const [ignoreDefaults, setIgnoreDefaults] = useState(false);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  const handleClearFilters = () => {
  setDefaultValues({});
  setFilters({});
};

	
  const handlePageChange = (event, newPage) => {
  console.log('[Pagination] Changing page to:', newPage);
  setPage(newPage);
    setPage(newPage);
};

  
  const [totalCount, setTotalCount] = useState(0);
  const activeFilters = (config.filters || []).filter((f) => {
    if (f.excludeFromViews?.includes(viewKey)) return false;
    if (f.includeInViews && !f.includeInViews.includes(viewKey)) return false;
    return true;
  });




const [defaultValues, setDefaultValues] = useState({});
const [loadingUser, setLoadingUser] = useState(true);

const [filters, setFilters] = useState({});
useEffect(() => {
  if (!loadingUser && defaultValues) {
    setFilters(defaultValues);
  }
}, [loadingUser, defaultValues]);

useEffect(() => {
  const fetchDefaults = async () => {
    const contactId = await getCurrentContactId();
    console.log('[fetchDefaults] contactId:', contactId);
    
    const fieldDefaults = (config.fields || []).reduce((acc, field) => {
      if (field.defaultToCurrentUser && contactId) {
        console.log(`[fetchDefaults] setting field ${field.name} to contactId: ${contactId}`);
        acc[field.name] = contactId;
      } else if (field.defaultValue !== undefined) {
        console.log(`[fetchDefaults] setting field ${field.name} to defaultValue: ${field.defaultValue}`);
        acc[field.name] = field.defaultValue;
      }
      return acc;
    }, {});
    
    const filterDefaults = (config.filters || []).reduce((acc, filter) => {
      if (filter.defaultToCurrentUser && contactId) {
        console.log(`[fetchDefaults] setting filter ${filter.name} to contactId: ${contactId}`);
        acc[filter.name] = filter.multiple ? [contactId] : contactId;
      } else if (filter.defaultValue !== undefined) {
        console.log(`[fetchDefaults] setting filter ${filter.name} to defaultValue:`, filter.defaultValue);
        // ✅ Don't modify the defaultValue - use it as-is since it should already be the correct type
        acc[filter.name] = filter.defaultValue;
      } else if (filter.multiple) {
        // Initialize multi-select filters as empty arrays
        acc[filter.name] = [];
      }
      return acc;
    }, {});
    
    const mergedDefaults = { ...fieldDefaults, ...filterDefaults };
    console.log('[fetchDefaults] final default values:', mergedDefaults);
    setDefaultValues(mergedDefaults);
    setLoadingUser(false);
  };
  fetchDefaults();
}, [config]);
  

  const [refreshFlag, setRefreshFlag] = useState(0);
  const [selectionIds, setSelectionIds] = useState([]);


useEffect(() => {
  if (typeof window === 'undefined') return;

  const params = new URLSearchParams(window.location.search);
  const viewParam = params.get('view');
  if (viewParam && viewParam !== viewKey) {
    		
    setViewKey(viewParam || config.defaultView);
  }
  }, [typeof window !== 'undefined' && window.location.search]);

useEffect(() => {
  setPage(0);
}, [filters]);


  const viewConfig = config.views?.[viewKey];
  const ViewComponent = componentMap[viewConfig?.component] || PrimaryTableView;

  const handleViewChange = (v) => {
    setViewKey(v);
    const params = new URLSearchParams(searchParams.toString());
    params.set('view', v);
    router.push(`?${params.toString()}`);
  };

  const refresh = () => setRefreshFlag((prev) => prev + 1);
  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0); // reset to first page
  };



const containerSx = {
  default: { 
              p: 9, 
            },
  details: { 
              p: 0, 
              boxShadow: 'none', 
              backgroundColor: 'transparent' 
            },
}[variant] || {};

  return (
    <Box sx={containerSx}>
    <CollectionSelectionProvider ids={selectionIds}>
      <CollectionLayout
        config={{ ...config, filters: activeFilters }}
        currentView={viewKey}
        onViewChange={handleViewChange}
        filters={filters}
        onFilterChange={setFilters}
        onDeleteSuccess={refresh}
        page={page}
        onPageChange={handlePageChange}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleRowsPerPageChange}
        totalCount={totalCount}
        onClearFilters={handleClearFilters}
        setIgnoreDefaults={setIgnoreDefaults}
        setDefaultValues={setDefaultValues}
      >
        <ViewComponent
          config={{ ...config, filters: activeFilters }}
          filters={filters}
          setFilters={setFilters}
          refreshFlag={refreshFlag}
          onRefresh={refresh}
          onIdsChange={setSelectionIds}
          page={page}
          rowsPerPage={rowsPerPage}
          setTotalCount={setTotalCount}
        />
      </CollectionLayout>
    </CollectionSelectionProvider>
    </Box>
  );
}
