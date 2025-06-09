// src/components/dashboard/search/index.js

// Main search components
export { default as StreamlinedSearchPage } from '@/components/dashboard/search/StreamlinedSearchPage';
export { 
  CompanySearchPage,
  ProjectSearchPage, 
  MediaSearchPage,
  CustomSearchPage,
  AllCollectionsSearchPage
} from '@/components/dashboard/search/StreamlinedSearchPage';

// Search UI components
export {
  SearchHeader,
  CollectionTabs,
  FilterSidebar,
  ResultsGrid,
  EmptySearchState,
  COLLECTION_ICONS,
  COLLECTION_COLORS
} from './SearchComponents';

// Search button and utilities
export { default as SearchButton, useSearch } from '@/components/dashboard/search/components/SearchButton';

// Search hook
export { default as useAdvancedSearch } from '@components/dashboard/search/useAdvancedSearch';

// Search utilities
export * from '@components/dashboard/search/searchUtils';