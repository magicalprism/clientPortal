'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { CollectionLayout } from '@/components/views/CollectionLayout';
import ChecklistView from '@/components/views/ChecklistView';
import PrimaryTableView from '@/components/views/PrimaryTableView';
import { CollectionSelectionProvider } from '@/components/CollectionSelectionContext';

const componentMap = {
  ChecklistView,
  PrimaryTableView
};

export default function CollectionView({ config }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [viewKey, setViewKey] = useState(config.defaultView);
  const [filters, setFilters] = useState({});
  const [sortDir, setSortDir] = useState(null);
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

  return (
    <CollectionSelectionProvider ids={selectionIds}>
      <CollectionLayout
        config={config}
        currentView={viewKey}
        onViewChange={handleViewChange}
        filters={filters}
        onFilterChange={setFilters}
        sortDir={sortDir}
        onSortChange={setSortDir}
        onDeleteSuccess={refresh}
      >
        <ViewComponent
          config={config}
          filters={filters}
          sortDir={sortDir}
          refreshFlag={refreshFlag}
          onRefresh={refresh}
          onIdsChange={setSelectionIds}
        />
      </CollectionLayout>
    </CollectionSelectionProvider>
  );
}
