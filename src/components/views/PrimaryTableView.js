'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Container,
  hideHead
} from '@mui/material';
import { Plus as PlusIcon } from '@phosphor-icons/react';

import { createClient } from '@/lib/supabase/browser';
import { CollectionFilters } from '@/components/CollectionFilters';
import { CollectionTable } from '@/components/CollectionTable';
import { CollectionSelectionProvider } from '@/components/CollectionSelectionContext';
import { ViewSwitcher } from '@/components/ViewSwitcher';
import { hasChildRows } from '@/lib/utils/hasChildRows'; // if you extracted it
import { buildNestedRows } from '@/lib/utils/buildNestedRows';



export default function PrimaryTableView({ config }) {
  const supabase = createClient();
  const router = useRouter();
  const [expandedRowIds, setExpandedRowIds] = useState(new Set());

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
    const relatedFields = config.fields
      .filter(f => f.type === 'relationship' && f.relation?.labelField)
      .map(f => {
        const relationTableAlias = f.name.replace('_id', '');
        return `${relationTableAlias}:${f.name}(${f.relation.labelField})`;
      });
  
    const selectClause = ['*', ...relatedFields].join(', ');
  
    let query = supabase.from(config.name).select(selectClause);
  
  
    query = query.order('created_at', { ascending: sortDir === 'asc' });
  
    const { data, error } = await query;
  
    if (error) {
      console.error('❌ Supabase fetch error:', error);
      return;
    }
  
    const flatRows = data.map((row) => ({
      ...row,
      id: row.id ?? row[`${config.name}_id`],
    }));
    
    // ✅ New logic: include parents of matching children
    const matchedSet = new Set(flatRows.map(row => row.id));
    
    // Function to find all ancestors of a given row
    const collectAncestors = (row, allRows, keepSet) => {
      let current = row;
      while (current?.parent_id) {
        const parent = allRows.find(r => r.id === current.parent_id);
        if (parent && !keepSet.has(parent.id)) {
          keepSet.add(parent.id);
          current = parent;
        } else {
          break;
        }
      }
    };
    
    // Step 1: Filter rows based on search filters
    let matchingRows = flatRows.filter(row => {
      return (config.filters || []).every(filter => {
        const val = filters[filter.name];
        if (!val) return true;
    
        if (['select', 'relationship'].includes(filter.type)) {
          return row[filter.name] === val;
        } else if (filter.type === 'text') {
          return row[filter.name]?.toLowerCase().includes(val.toLowerCase());
        }
        return true;
      });
    });
    
    // Step 2: Collect ancestors for each match
    const keepIds = new Set();
    matchingRows.forEach(row => {
      keepIds.add(row.id);
      collectAncestors(row, flatRows, keepIds);
    });

    // Expand all parents of matching children
const autoExpanded = new Set();
matchingRows.forEach(row => {
  let current = row;
  while (current?.parent_id) {
    autoExpanded.add(current.parent_id);
    current = flatRows.find(r => r.id === current.parent_id);
  }
});
setExpandedRowIds(autoExpanded);

    
    // Step 3: Only keep matching rows and their ancestors
    const filteredRows = flatRows.filter(row => keepIds.has(row.id));
    
  
    const nestedRows = buildNestedRows(filteredRows);
  
    console.log('🧱 Fully nested data:', nestedRows);
    setData(nestedRows);
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




<CollectionTable
  config={config}
  rows={data} 
  expandedRowIds={expandedRowIds}
  rowSx={{
    '& .MuiTableCell-root': {
      pl: '0 !important',
      pr: '0 !important',
      py: 1,
      borderBottom: '1px solid #e0e0e0',
    },
    '& .MuiTableCell-root > .MuiBox-root': {
      p: '0 !important',
      m: 0,
    }
  }}
  childRenderer={(row) => {
    if (!row.children || !row.children.length) return null;

    const [expandedRows, setExpandedRows] = React.useState(new Set());

const toggleRow = (id) => {
  setExpandedRows((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
};


    return (
      <Box sx={{ pl: 4 }}>
        <CollectionTable
          config={config}
          rows={row.children}
          hideHead
          fieldContext={{ relation: { tableFields: ['title', 'status'] } }}
        />
      </Box>
    );
  }}
/>



      </CollectionSelectionProvider>
    </Container>
  );
}
