'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Container,
  Grid,
  Tabs,
  Tab,
  TextField,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Avatar,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Stack,
  Divider,
  Paper,
  CircularProgress,
  Badge
} from '@mui/material';
import {
  MagnifyingGlass,
  CaretDown,
  ArrowSquareOut,
  PencilSimple,
  Eye,
  Buildings,
  User,
  Folder,
  File,
  LinkSimple,
  Envelope,
  Phone,
  Globe,
  FolderOpen
} from '@phosphor-icons/react';
import { createClient } from '@/lib/supabase/browser';
import * as collections from '@/collections';
import { useRouter } from 'next/navigation';
import { ViewButtons } from '@/components/buttons/ViewButtons';
import { useModal } from '@/components/modals/ModalContext';

// Collection configurations for the main tabs
const MAIN_COLLECTIONS = ['company', 'contact', 'project', 'resource'];

const COLLECTION_ICONS = {
  company: Buildings,
  contact: User,
  project: Folder,
  resource: File
};

const COLLECTION_COLORS = {
  company: '#1976d2',
  contact: '#388e3c', 
  project: '#f57c00',
  resource: '#7b1fa2'
};

// Advanced Search Page Component
export default function AdvancedSearchPage(
  config,
  id,
  record,
  OnRefresh,
  openModal,
  closeModal
) {
  const router = useRouter();
  const supabase = createClient();
  const { openModal, closeModal } = useModal();
  
  // State management
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({});
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState({});
  const [resultCounts, setResultCounts] = useState({});
  const { openModal, closeModal } = useModal(); // Added closeModal
    const fullConfig = collections[config.name] || config;

  // Get current collection
  const currentCollection = MAIN_COLLECTIONS[activeTab];
  const currentConfig = collections[currentCollection];

  // Search and filter logic
  const performSearch = async (collectionName, query, appliedFilters) => {
    if (!collections[collectionName]) return [];

    const config = collections[collectionName];
    setLoading(prev => ({ ...prev, [collectionName]: true }));

    try {
      // Simple select query to avoid relationship errors
      let supabaseQuery = supabase.from(collectionName).select('*');

      // Apply text search across searchable fields
      if (query.trim()) {
        const searchableFields = getSearchableFields(config);
        if (searchableFields.length > 0) {
          const searchConditions = searchableFields.map(field => 
            `${field}.ilike.%${query}%`
          ).join(',');
          supabaseQuery = supabaseQuery.or(searchConditions);
        }
      }

      // Apply filters
      Object.entries(appliedFilters).forEach(([fieldName, value]) => {
        if (value && value !== '' && value !== 'all') {
          if (Array.isArray(value) && value.length > 0) {
            supabaseQuery = supabaseQuery.in(fieldName, value);
          } else {
            supabaseQuery = supabaseQuery.eq(fieldName, value);
          }
        }
      });

      // Limit results and order
      supabaseQuery = supabaseQuery
        .order('id', { ascending: false })
        .limit(50);

      const { data, error } = await supabaseQuery;

      if (error) {
        console.error(`Search error for ${collectionName}:`, error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error(`Search error for ${collectionName}:`, error);
      return [];
    } finally {
      setLoading(prev => ({ ...prev, [collectionName]: false }));
    }
  };

  // Get searchable fields from config
  const getSearchableFields = (config) => {
    return config.fields
      ?.filter(field => 
        ['text', 'richText'].includes(field.type) || 
        (!field.type && field.name === 'title')
      )
      .map(field => field.name) || ['title'];
  };

  // Search effect
  useEffect(() => {
    const searchAllCollections = async () => {
      const searchPromises = MAIN_COLLECTIONS.map(async (collectionName) => {
        const results = await performSearch(collectionName, searchQuery, filters[collectionName] || {});
        return { collectionName, results };
      });

      const allResults = await Promise.all(searchPromises);
      
      const newResults = {};
      const newCounts = {};
      
      allResults.forEach(({ collectionName, results }) => {
        newResults[collectionName] = results;
        newCounts[collectionName] = results.length;
      });

      setResults(newResults);
      setResultCounts(newCounts);
    };

    const debounceTimer = setTimeout(searchAllCollections, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, filters]);

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, }}>
        <Typography gutterBottom >
          Advanced Search
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Search across all your data with powerful filtering options
        </Typography>
      </Box>

      {/* Main Search Bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search across all collections..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: <MagnifyingGlass size={20} style={{ marginRight: 8, color: 'text.secondary' }} />,
          }}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
        />
      </Paper>

      <Grid container spacing={3}>
        {/* Filters Sidebar */}
        <Grid item xs={12} md={3}>
          <FilterSidebar
            collections={MAIN_COLLECTIONS}
            configs={collections}
            filters={filters}
            setFilters={setFilters}
            supabase={supabase}
          />
        </Grid>

        {/* Results Area */}
        <Grid item xs={12} md={9}>
          {/* Collection Tabs */}
          <Paper sx={{ mb: 2 }}>
            <Tabs
              value={activeTab}
              onChange={(e, newValue) => setActiveTab(newValue)}
              variant="fullWidth"
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              {MAIN_COLLECTIONS.map((collectionName, index) => {
                const config = collections[collectionName];
                const IconComponent = COLLECTION_ICONS[collectionName];
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

          {/* Results Grid */}
          <ResultsGrid
            collectionName={currentCollection}
            config={currentConfig}
            results={results[currentCollection] || []}
            loading={loading[currentCollection]}
            router={router}
          />
        </Grid>
      </Grid>
    </Container>
  );
}

// Filter Sidebar Component
function FilterSidebar({ collections, configs, filters, setFilters, supabase }) {
  const [filterOptions, setFilterOptions] = useState({});

  // Load filter options for relationship fields
  useEffect(() => {
    const loadFilterOptions = async () => {
      const options = {};
      
      for (const collectionName of collections) {
        const config = configs[collectionName];
        if (!config) continue;

        options[collectionName] = {};
        
        // Get filter options for relationship fields
        for (const field of config.fields || []) {
          if (field.type === 'relationship' && field.relation?.table) {
            try {
              const { data } = await supabase
                .from(field.relation.table)
                .select(`id, ${field.relation.labelField || 'title'}`)
                .limit(100);
              
              options[collectionName][field.name] = data || [];
            } catch (error) {
              console.error(`Error loading options for ${field.name}:`, error);
            }
          }
        }
      }
      
      setFilterOptions(options);
    };

    loadFilterOptions();
  }, [collections, configs, supabase]);

  const updateFilter = (collectionName, fieldName, value) => {
    setFilters(prev => ({
      ...prev,
      [collectionName]: {
        ...prev[collectionName],
        [fieldName]: value
      }
    }));
  };

  const clearAllFilters = () => {
    setFilters({});
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Filters</Typography>
        <Button size="small" onClick={clearAllFilters}>Clear All</Button>
      </Box>

      {collections.map(collectionName => {
        const config = configs[collectionName];
        if (!config) return null;

        const collectionFilters = filters[collectionName] || {};
        const hasActiveFilters = Object.keys(collectionFilters).some(key => collectionFilters[key]);
        const IconComponent = COLLECTION_ICONS[collectionName];

        return (
          <Accordion key={collectionName} defaultExpanded={hasActiveFilters}>
            <AccordionSummary expandIcon={<CaretDown size={16} weight="regular" />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {IconComponent && <IconComponent size={16} weight="regular" />}
                <Typography variant="subtitle2">{config.label}</Typography>
                {hasActiveFilters && (
                  <Chip size="small" label="Active" color="primary" />
                )}
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={2}>
                {config.fields
                  ?.filter(field => 
                    field.type === 'select' || 
                    field.type === 'relationship' ||
                    field.type === 'status'
                  )
                  .slice(0, 5) // Limit to first 5 filterable fields
                  .map(field => (
                    <FilterField
                      key={`${collectionName}-${field.name}`}
                      field={field}
                      value={collectionFilters[field.name] || ''}
                      onChange={(value) => updateFilter(collectionName, field.name, value)}
                      options={filterOptions[collectionName]?.[field.name] || []}
                    />
                  ))}
              </Stack>
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Paper>
  );
}

// Individual Filter Field Component
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
          <MenuItem key={`${field.name}-all`} value="">All</MenuItem>
          {field.options?.map(option => (
            <MenuItem key={`${field.name}-${option.value}`} value={option.value}>
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
          <MenuItem key={`${field.name}-all`} value="">All</MenuItem>
          {options.map(option => (
            <MenuItem key={`${field.name}-${option.id}`} value={option.id}>
              {option[field.relation?.labelField || 'title']}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    );
  }

  return null;
}

// Results Grid Component
function ResultsGrid({ collectionName, config, results, loading, router }) {
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
          No results found
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

// Individual Result Card Component
function ResultCard({ item, config, collectionName, router }) {
  const quickView = config.quickView || {};
  const color = COLLECTION_COLORS[collectionName];
  const IconComponent = COLLECTION_ICONS[collectionName];
  
  const title = item[quickView.titleField || 'title'] || 'Untitled';
  const subtitle = item[quickView.subtitleField] || '';
  const description = item[quickView.descriptionField] || '';
  

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
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
          <Avatar sx={{ bgcolor: color, width: 48, height: 48 }}>
            {IconComponent && <IconComponent size={24} weight="regular" />}
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

        {/* Description */}
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

      {/* Action Buttons */}
      <Divider />
      <Box sx={{ p: 1, display: 'flex', justifyContent: 'center' }}>
        <ViewButtons 
          config={{ ...config, key: collectionName }}
          id={item.id}
          record={item}
          showDelete={false}
          onRefresh={() => {}} // optionally pass refresh function
        />
      </Box>
    </Card>
  );
}
