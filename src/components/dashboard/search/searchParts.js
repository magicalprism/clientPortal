'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Avatar,
  Grid,
  Paper,
  CircularProgress,
  Stack,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Divider,
  Badge,
  Tabs,
  Tab
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  OpenInNew as OpenInNewIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  Assignment as ProjectIcon,
  Description as ResourceIcon,
  Link as LinkIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Language as WebsiteIcon,
  Clear as ClearIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import * as collections from '@/collections';
import { useRouter } from 'next/navigation';
import { ViewButtons } from '@/components/buttons/ViewButtons';
import { useModal } from '@/components/modals/ModalContext';

// Collection Icons and Colors
export const COLLECTION_ICONS = {
  company: BusinessIcon,
  contact: PersonIcon,
  project: ProjectIcon,
  resource: ResourceIcon,
  task: ProjectIcon,
  contract: ResourceIcon,
  brand: BusinessIcon,
  media: ResourceIcon,
  product: ProjectIcon,
  element: ProjectIcon
};

export const COLLECTION_COLORS = {
  company: '#1976d2',
  contact: '#388e3c', 
  project: '#f57c00',
  resource: '#7b1fa2',
  task: '#d32f2f',
  contract: '#795548',
  brand: '#9c27b0',
  media: '#607d8b',
  product: '#ff5722',
  element: '#3f51b5'
};

/**
 * Search Header Component with main search bar
 */
export function SearchHeader({ 
  searchQuery, 
  onSearchChange, 
  placeholder = "Search across all collections...",
  totalResults = 0,
  isSearching = false 
}) {
  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <TextField
        fullWidth
        placeholder={placeholder}
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        InputProps={{
          startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
          endAdornment: isSearching ? <CircularProgress size={20} /> : null
        }}
        sx={{ 
          '& .MuiOutlinedInput-root': { borderRadius: 2 },
          mb: 1
        }}
      />
      
      {totalResults > 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Found {totalResults} result{totalResults !== 1 ? 's' : ''}
          {searchQuery && ` for "${searchQuery}"`}
        </Typography>
      )}
    </Paper>
  );
}

/**
 * Collection Tabs Component
 */
export function CollectionTabs({ 
  collections: targetCollections, 
  activeTab, 
  onTabChange, 
  resultCounts = {} 
}) {
  return (
    <Paper sx={{ mb: 2 }}>
      <Tabs
        value={activeTab}
        onChange={(e, newValue) => onTabChange(newValue)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        {targetCollections.map((collectionName, index) => {
          const config = collections[collectionName];
          const IconComponent = COLLECTION_ICONS[collectionName] || ResourceIcon;
          const count = resultCounts[collectionName] || 0;
          
          return (
            <Tab
              key={collectionName}
              icon={<IconComponent />}
              label={
                <Badge badgeContent={count} color="primary" max={99}>
                  <span>{config?.label || collectionName}</span>
                </Badge>
              }
              iconPosition="start"
            />
          );
        })}
      </Tabs>
    </Paper>
  );
}

/**
 * Filter Sidebar Component
 */
export function FilterSidebar({ 
  collections: targetCollections, 
  filters, 
  onFilterChange, 
  onClearAll,
  filterOptions = {},
  loading = false 
}) {
  const hasActiveFilters = Object.values(filters).some(collectionFilters =>
    Object.values(collectionFilters || {}).some(value => 
      value !== null && value !== undefined && value !== '' && value !== 'all'
    )
  );

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Filters</Typography>
        {hasActiveFilters && (
          <Button 
            size="small" 
            onClick={onClearAll}
            startIcon={<ClearIcon />}
          >
            Clear All
          </Button>
        )}
      </Box>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress size={24} />
        </Box>
      )}

      {targetCollections.map(collectionName => {
        const config = collections[collectionName];
        if (!config) return null;

        const collectionFilters = filters[collectionName] || {};
        const hasActiveFilters = Object.keys(collectionFilters).some(key => 
          collectionFilters[key] && collectionFilters[key] !== 'all'
        );

        return (
          <Accordion key={collectionName} defaultExpanded={hasActiveFilters}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {React.createElement(COLLECTION_ICONS[collectionName] || ResourceIcon, { 
                  fontSize: 'small',
                  sx: { color: COLLECTION_COLORS[collectionName] }
                })}
                <Typography variant="subtitle2">{config.label}</Typography>
                {hasActiveFilters && (
                  <Chip size="small" label="Active" color="primary" />
                )}
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <CollectionFilters
                config={config}
                collectionName={collectionName}
                filters={collectionFilters}
                onFilterChange={onFilterChange}
                options={filterOptions[collectionName] || {}}
              />
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Paper>
  );
}

/**
 * Collection-specific Filters Component
 */
function CollectionFilters({ config, collectionName, filters, onFilterChange, options }) {
  // Get filterable fields (select, status, relationship)
  const filterableFields = config.fields?.filter(field =>
    field.type === 'select' || 
    field.type === 'status' || 
    field.type === 'relationship'
  ).slice(0, 6) || []; // Limit to 6 filters per collection

  return (
    <Stack spacing={2}>
      {filterableFields.map(field => (
        <FilterField
          key={field.name}
          field={field}
          value={filters[field.name] || ''}
          onChange={(value) => onFilterChange(collectionName, field.name, value)}
          options={options[field.name] || []}
        />
      ))}
    </Stack>
  );
}

/**
 * Individual Filter Field Component
 */
function FilterField({ field, value, onChange, options }) {
  if (field.type === 'select' || field.type === 'status') {
    return (
      <FormControl fullWidth size="small">
        <InputLabel>{field.label}</InputLabel>
        <Select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          label={field.label}
        >
          <MenuItem value="">All</MenuItem>
          {field.options?.map(option => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    );
  }

  if (field.type === 'relationship') {
    return (
      <FormControl fullWidth size="small">
        <InputLabel>{field.label}</InputLabel>
        <Select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          label={field.label}
        >
          <MenuItem value="">All</MenuItem>
          {options.map(option => (
            <MenuItem key={option.id} value={option.id}>
              {option[field.relation?.labelField || 'title']}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    );
  }

  return null;
}

/**
 * Results Grid Component
 */
export function ResultsGrid({ 
  collectionName, 
  results = [], 
  loading = false,
  emptyMessage = "No results found"
}) {
  const router = useRouter();
  const config = collections[collectionName];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!results.length) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          {emptyMessage}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Try adjusting your search terms or filters
        </Typography>
      </Paper>
    );
  }

  return (
    <Grid container spacing={2}>
      {results.map(item => (
        <Grid item xs={12} sm={6} lg={4} key={item.id}>
          <ResultCard
            item={item}
            config={config}
            collectionName={collectionName}
            router={router}
          />
        </Grid>
      ))}
    </Grid>
  );
}

/**
 * Individual Result Card Component
 */

export function ResultCard({ item, config, collectionName, router }) {
  const quickView = config?.quickView || {};
  const color = COLLECTION_COLORS[collectionName] || '#666';

  const title = item[quickView.titleField || 'title'] || item.name || 'Untitled';
  const subtitle = item[quickView.subtitleField] || item.status || '';
  const description = item[quickView.descriptionField] || item.description || '';

  const getAvatarSrc = () => {
    const imageField = quickView.imageField;
    if (imageField) {
      if (item[imageField]) return item[imageField];
      if (item[`${imageField}_details`]?.url) return item[`${imageField}_details`].url;
    }
    if (item.thumbnail_id) return item.thumbnail_id;
    if (collectionName === 'media' && item.url) return item.url;
    return null;
  };

  const avatarSrc = getAvatarSrc();

  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        borderTop: 3,
        borderTopColor: color,
        transition: 'all 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 4
        }
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
          <Avatar 
            src={avatarSrc} 
            sx={{ 
              width: 48, 
              height: 48, 
              bgcolor: color,
              '& img': { objectFit: 'cover' }
            }}
          >
            {React.createElement(COLLECTION_ICONS[collectionName] || ResourceIcon)}
          </Avatar>
          
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontSize: '1rem',
                fontWeight: 600,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {title}
            </Typography>
            {subtitle && (
              <Chip 
                label={subtitle} 
                size="small" 
                variant="outlined"
                sx={{ mt: 0.5 }}
              />
            )}
          </Box>
        </Box>

        {description && (
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ 
              mb: 2,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical'
            }}
          >
            {description}
          </Typography>
        )}

      </CardContent>

      <Divider />
      <Box sx={{ p: 1, display: 'flex', justifyContent: 'center' }}>
        <ViewButtons 
          config={{ ...config, key: collectionName }}
          id={item.id}
          record={item}
          showDelete={false}
        />
      </Box>
    </Card>
  );
}



/**
 * Get display value for a field
 */
function getFieldDisplayValue(item, fieldName, fieldConfig) {
  // Direct field value
  if (item[fieldName] && typeof item[fieldName] === 'string') {
    return item[fieldName];
  }
  
  // Relationship field details
  if (item[`${fieldName}_details`]) {
    const details = item[`${fieldName}_details`];
    return details[fieldConfig?.relation?.labelField || 'title'] || details.title || details.name;
  }
  
  // Handle arrays (for multiRelationship fields)
  if (Array.isArray(item[fieldName]) && item[fieldName].length > 0) {
    return `${item[fieldName].length} item${item[fieldName].length !== 1 ? 's' : ''}`;
  }
  
  return null;
}

/**
 * Empty State Component
 */
export function EmptySearchState({ 
  hasQuery = false, 
  hasFilters = false,
  onClearFilters 
}) {
  return (
    <Paper sx={{ p: 6, textAlign: 'center' }}>
      <SearchIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
      
      <Typography variant="h5" gutterBottom color="text.secondary">
        {hasQuery || hasFilters ? 'No results found' : 'Start searching'}
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        {hasQuery || hasFilters 
          ? 'Try adjusting your search terms or filters'
          : 'Enter a search term to find items across all collections'
        }
      </Typography>
      
      {hasFilters && (
        <Button 
          variant="outlined" 
          onClick={onClearFilters}
          startIcon={<ClearIcon />}
        >
          Clear Filters
        </Button>
      )}
    </Paper>
  );
}