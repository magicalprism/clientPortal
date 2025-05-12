'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { CollectionLayout } from '@/components/views/CollectionLayout';
import ChecklistView from '@/components/views/ChecklistView';
import PrimaryTableView from '@/components/views/PrimaryTableView';
import { CollectionSelectionProvider } from '@/components/CollectionSelectionContext';
import CalendarView from './CalendarView';

const componentMap = {
  ChecklistView,
  PrimaryTableView,
  CalendarView,
};

export default function CollectionView({ config }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [viewKey, setViewKey] = useState(config.defaultView);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };
  
  const [totalCount, setTotalCount] = useState(0);

  const defaultFilters = (config.filters || []).reduce((acc, filter) => {
    if (filter.defaultValue !== undefined) {
      acc[filter.name] = filter.defaultValue;
    }
    return acc;
  }, {});
  
  const [filters, setFilters] = useState(defaultFilters);

  const [refreshFlag, setRefreshFlag] = useState(0);
  const [selectionIds, setSelectionIds] = useState([]);


  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    setViewKey(viewParam || config.defaultView);
  }, [typeof window !== 'undefined' && window.location.search]);

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
  

  return (
    <CollectionSelectionProvider ids={selectionIds}>
      <CollectionLayout
        config={config}
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
      >
        <ViewComponent
          config={config}
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
  );
}
