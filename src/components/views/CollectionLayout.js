'use client';

import { Box, Button, Stack, Typography, Container, IconButton } from '@mui/material';
import { Plus as PlusIcon, FunnelSimple as FilterIcon } from '@phosphor-icons/react';
import { useRouter, usePathname } from 'next/navigation';
import { ViewSwitcher } from '@/components/views/ViewSwitcher';
import { CollectionFilters } from '@/components/views/components/CollectionFilters';
import { TablePagination } from '@mui/material';
import { useModal } from '@/components/modals/ModalContext';
import * as collections from '@/collections';

import { useState } from 'react';

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
  page,
  onPageChange,
  rowsPerPage,
  totalCount,
  onRowsPerPageChange,
  onClearFilters,
  setIgnoreDefaults,
  setDefaultValues
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { openModal } = useModal();
  
  // State for filter modal
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  
  // ✅ Check if current view should hide filters
  const currentViewConfig = config.views?.[currentView];
  const shouldHideFilters = currentViewConfig?.hideFilters === true;
  
  // Check if any filters are active
  const hasFilters = Object.values(filters || {}).some(Boolean);
  
  const handleDefaultAdd = () => {
    router.push(`/dashboard/${config.name}/create`);
  };

  const handleOpenCreateModal = () => {
    const fullConfig = collections[config.name] || config;
    openModal('create', { config: fullConfig });
  };

  return (
    <Box 
      sx={{
        paddingLeft: 0,
      }}
    >
      {/* Header row: Filter icon, View switcher, search, and Add button */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          px: 0,
          mb: 2,
        }}
      >
        {/* Left side: Filter icon, View switcher and search */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            flexGrow: 1,
          }}
        >
          {/* Filter icon button */}
          {!shouldHideFilters && (
            <IconButton 
              onClick={() => setFilterModalOpen(true)}
              disableRipple
              sx={{
                height: 40, 
                width: 40,
                padding: 1,
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1
              }}
            >
              <FilterIcon 
                size={20} 
                weight="regular"
                style={{ 
                  color: hasFilters ? 'var(--mui-palette-primary-main)' : 'var(--mui-palette-text-secondary)',
                  backgroundColor: 'transparent'
                }}
              />
            </IconButton>
          )}
          
          {/* View switcher */}
          {config.views && Object.keys(config.views).length > 1 && (
            <ViewSwitcher
              currentView={currentView}
              onChange={onViewChange}
              views={config.views}
              noLabel
            />
          )}
          
          {/* Search field */}
          {!shouldHideFilters && (
            <CollectionFilters
              config={config}
              filters={filters}
              onChange={onFilterChange}
              sortDir={sortDir}
              onSortChange={onSortChange}
              onDeleteSuccess={onDeleteSuccess}
              onClearFilters={onClearFilters}
              setIgnoreDefaults={setIgnoreDefaults}
              setDefaultValues={setDefaultValues}
              showFilterIcon={false} // Don't show filter icon in CollectionFilters
              showSearchOnly={true} // Only show search in CollectionFilters
              filterModalOpen={filterModalOpen} // Pass filter modal state
              setFilterModalOpen={setFilterModalOpen} // Pass filter modal handler
            />
          )}
        </Box>

        {/* Right side: Add button */}
        <Button
          variant="contained"
          startIcon={<PlusIcon />}
          onClick={onAddClick || handleOpenCreateModal}
          sx={{ height: 40 }}
        >
          Add {config.singularLabel}
        </Button>
      </Box>

      {/* Active filters display */}
      {!shouldHideFilters && hasFilters && (
        <Box sx={{ mb: 2 }}>
          <CollectionFilters
            config={config}
            filters={filters}
            onChange={onFilterChange}
            sortDir={sortDir}
            onSortChange={onSortChange}
            onDeleteSuccess={onDeleteSuccess}
            onClearFilters={onClearFilters}
            setIgnoreDefaults={setIgnoreDefaults}
            setDefaultValues={setDefaultValues}
            showFilterIcon={false}
            showSearchOnly={false}
            showActiveFiltersOnly={true}
            filterModalOpen={filterModalOpen}
            setFilterModalOpen={setFilterModalOpen}
          />
        </Box>
      )}
      
      {children}
      
      <Box sx={{ px: 3, pt: 2 }}>
        <TablePagination
          component="div"
          count={totalCount || 0}
          page={page}
          onPageChange={onPageChange}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={onRowsPerPageChange}
          rowsPerPageOptions={[10, 25, 50]}
        />
      </Box>
    </Box>
  );
};