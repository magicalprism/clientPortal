'use client';

import { Box, Button, Stack, Typograph, Container } from '@mui/material';
import { Plus as PlusIcon } from '@phosphor-icons/react';
import { useRouter, usePathname } from 'next/navigation';
import { ViewSwitcher } from '@/components/ViewSwitcher';
import { CollectionFilters } from '@/components/CollectionFilters';

export const CollectionLayout = ({
  config,
  currentView,
  onViewChange,
  filters,
  onFilterChange,
  sortDir,
  onSortChange,
  onDeleteSuccess,
  onAddClick,
  children,
}) => {
  const router = useRouter();
  const pathname = usePathname();

  const handleDefaultAdd = () => {
    router.push(`/dashboard/${config.name}/create`);
  };

  return (
    <Box 
    sx={{
        p: 5,
        background: '#fdfcff',
    }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          px: 3,
          py: 1,
          mb: 2,
          flexWrap: 'wrap',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
            flexGrow: 1,
          }}
        >
          {config.views && Object.keys(config.views).length > 1 && (
            <ViewSwitcher
              currentView={currentView}
              onChange={onViewChange}
              views={config.views}
              noLabel
            />
          )}

          <CollectionFilters
            config={config}
            filters={filters}
            onChange={onFilterChange}
            sortDir={sortDir}
            onSortChange={onSortChange}
            onDeleteSuccess={onDeleteSuccess}
          />
        </Box>

        <Button
          variant="contained"
          startIcon={<PlusIcon />}
          onClick={onAddClick || handleDefaultAdd}
          sx={{ height: 40 }}
        >
          Add {config.label?.slice(0, -1)}
        </Button>
      </Box>

      {children}
    </Box>
  );
};
