'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Container,
  Grid,
  Box,
  Typography,
  Alert,
  Fade,
  useTheme,
  alpha
} from '@mui/material';
import { useAdvancedSearch } from '@/components/dashboard/search/useAdvancedSearch';
import {
  SearchHeader,
  CollectionTabs,
  FilterSidebar,
  ResultsGrid,
  EmptySearchState
} from '@/components/dashboard/search/SearchComponents';

// Main collections to search - Updated to include task, product, event, contract, and proposal
const DEFAULT_COLLECTIONS = ['project', 'company', 'contact', 'resource', 'media', 'task', 'product', 'event', 'contract', 'proposal'];

/**
 * Modern Advanced Search Page with improved design
 */
export default function StreamlinedSearchPage({ 
  collections = DEFAULT_COLLECTIONS,
  title = "Advanced Search",
  subtitle = "Search across all your data with powerful filtering options"
}) {
  const theme = useTheme();
  
  // Search hook
  const {
    searchQuery,
    setSearchQuery,
    filters,
    updateFilter,
    clearAllFilters,
    results,
    loading,
    resultCounts,
    error,
    totalResults,
    hasActiveFilters,
    isSearching,
    targetCollections,
    loadAllFilterOptions,
    searchAllCollections
  } = useAdvancedSearch(collections);

  // UI state
  const [activeTab, setActiveTab] = useState(0);
  const [filterOptions, setFilterOptions] = useState({});
  const [filterOptionsLoading, setFilterOptionsLoading] = useState(true);

  // Sort collections alphabetically by their label for consistent ordering
  const sortedCollections = useMemo(() => {
    return [...targetCollections].sort((a, b) => {
      const labelA = collections[a]?.label || a;
      const labelB = collections[b]?.label || b;
      return labelA.localeCompare(labelB);
    });
  }, [targetCollections]);

  // Get current collection from sorted array
  const currentCollection = sortedCollections[activeTab];
  const currentResults = results[currentCollection] || [];
  const currentLoading = loading[currentCollection] || false;

  // Load filter options on mount
  useEffect(() => {
    const loadOptions = async () => {
      setFilterOptionsLoading(true);
      try {
        const options = await loadAllFilterOptions();
        setFilterOptions(options);
      } catch (error) {
        console.error('Error loading filter options:', error);
      } finally {
        setFilterOptionsLoading(false);
      }
    };

    loadOptions();
  }, [loadAllFilterOptions]);

  // Handle tab change
  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
  };

  // Handle search query change
  const handleSearchChange = (newQuery) => {
    setSearchQuery(newQuery);
  };

  // Handle filter change
  const handleFilterChange = (collectionName, fieldName, value) => {
    updateFilter(collectionName, fieldName, value);
  };

  // Handle clear all filters
  const handleClearAllFilters = () => {
    clearAllFilters();
  };

  // Handle refresh after record deletion or update
  const handleRefresh = (deletedId) => {
    // If we have a deletedId, update the results state immediately for responsive UI
    if (deletedId && results) {
      // Create a new results object with the deleted item filtered out
      const updatedResults = { ...results };
      
      // Update each collection's results
      Object.keys(updatedResults).forEach(collectionKey => {
        if (Array.isArray(updatedResults[collectionKey])) {
          updatedResults[collectionKey] = updatedResults[collectionKey].filter(
            item => item.id !== deletedId
          );
        }
      });
      
      // Update the results state immediately for responsive UI
      setResults(updatedResults);
    }
    
    // Then refresh the data from the server
    searchAllCollections();
  };

  // Check if we should show empty state
  const showEmptyState = !isSearching && totalResults === 0;
  const hasSearchQuery = searchQuery.trim().length > 0;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(theme.palette.secondary.main, 0.01)} 50%, ${alpha('#ffffff', 1)} 100%)`,
        py: 3
      }}
    >
      <Container maxWidth="xl">
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography 
            variant="h3" 
            gutterBottom
            color="text.primary"
            sx={{ 
              fontWeight: 700,
              
              mb: 1
            }}
          >
            {title}
          </Typography>
          <Typography 
            variant="h6" 
            color="text.secondary"
            sx={{ fontWeight: 400, opacity: 0.8 }}
          >
            {subtitle}
          </Typography>
          
          {/* Stats */}
          {targetCollections.length > 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Searching across {targetCollections.length} collection{targetCollections.length !== 1 ? 's' : ''}
            </Typography>
          )}
        </Box>

        {/* Error Alert */}
        {error && (
          <Fade in={Boolean(error)}>
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3,
                borderRadius: 2,
                '& .MuiAlert-message': {
                  fontWeight: 500
                }
              }} 
              onClose={() => {}}
            >
              {error}
            </Alert>
          </Fade>
        )}

        {/* Main Search Header */}
        <SearchHeader
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          totalResults={totalResults}
          isSearching={isSearching}
          placeholder={`Search across ${targetCollections.length} collection${targetCollections.length !== 1 ? 's' : ''}...`}
        />

        <Grid container spacing={4}>
          {/* Filters Sidebar */}
          <Grid item xs={12} md={3}>
            <FilterSidebar
              collections={sortedCollections}
              filters={filters}
              onFilterChange={handleFilterChange}
              onClearAll={handleClearAllFilters}
              filterOptions={filterOptions}
              loading={filterOptionsLoading}
              onTabChange={handleTabChange} // Add onTabChange prop
            />
          </Grid>

          {/* Results Area */}
          <Grid item xs={12} md={9}>
            {showEmptyState ? (
              <EmptySearchState
                hasQuery={hasSearchQuery}
                hasFilters={hasActiveFilters}
                onClearFilters={handleClearAllFilters}
              />
            ) : (
              <>
                {/* Collection Tabs */}
                <CollectionTabs
                  collections={sortedCollections}
                  activeTab={activeTab}
                  onTabChange={handleTabChange}
                  resultCounts={resultCounts}
                />

                {/* Results Grid for Current Collection */}
                <ResultsGrid
                  collectionName={currentCollection}
                  results={currentResults}
                  loading={currentLoading}
                  emptyMessage={`No ${currentCollection} results found`}
                  onRefresh={handleRefresh}
                />

                {/* Search Statistics */}
                {totalResults > 0 && (
                  <Box 
                    sx={{ 
                      mt: 4, 
                      p: 3, 
                      bgcolor: alpha('#ffffff', 0.6),
                      backdropFilter: 'blur(10px)',
                      borderRadius: 2,
                      border: `1px solid ${alpha('#fbfbfd', 0.1)}`,
                      textAlign: 'center'
                    }}
                  >
                    <Typography variant="body1" color="text.secondary">
                      Showing <strong>{currentResults.length}</strong> of <strong>{resultCounts[currentCollection] || 0}</strong> {currentCollection} results
                      {totalResults > resultCounts[currentCollection] && 
                        ` • ${totalResults} total results across all collections`
                      }
                    </Typography>
                  </Box>
                )}
              </>
            )}
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

/**
 * Search page with custom collections
 * Example: <CustomSearchPage collections={['company', 'project']} />
 */
export function CustomSearchPage({ 
  collections = ['company', 'contact'], 
  ...props 
}) {
  return (
    <StreamlinedSearchPage 
      collections={collections}
      {...props}
    />
  );
}

/**
 * Company-focused search page
 */
export function CompanySearchPage() {
  return (
    <StreamlinedSearchPage
      collections={['company', 'contact', 'project']}
      title="Company Search"
      subtitle="Search companies, contacts, and related projects"
    />
  );
}

/**
 * Project-focused search page
 */
export function ProjectSearchPage() {
  return (
    <StreamlinedSearchPage
      collections={['project', 'task', 'element', 'resource']}
      title="Project Search" 
      subtitle="Search projects, tasks, elements, and resources"
    />
  );
}

/**
 * Media-focused search page
 */
export function MediaSearchPage() {
  return (
    <StreamlinedSearchPage
      collections={['media', 'brand', 'resource']}
      title="Media & Brand Search"
      subtitle="Search media files, brand assets, and resources"
    />
  );
}

/**
 * All Collections search page
 */
export function AllCollectionsSearchPage() {
  return (
    <StreamlinedSearchPage
      collections={['company', 'contact', 'project', 'resource', 'media', 'task', 'contract', 'brand']}
      title="Universal Search"
      subtitle="Search across all your collections and data"
    />
  );
}