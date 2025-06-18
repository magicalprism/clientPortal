// Updated SearchComponents.js - Key fixes for FilterField

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
  Tab,
  InputAdornment,
  alpha,
  useTheme
} from '@mui/material';
import {
  CaretDown as ExpandMoreIcon,
  ArrowSquareOut as OpenInNewIcon,
  PencilSimple as EditIcon,
  Eye as VisibilityIcon,
  Buildings as BusinessIcon,
  User as PersonIcon,
  Folder as ProjectIcon,
  File as ResourceIcon,
  LinkSimple as LinkIcon,
  Envelope as EmailIcon,
  Phone as PhoneIcon,
  Globe as WebsiteIcon,
  X as ClearIcon,
  MagnifyingGlass as SearchIcon,
  FolderOpen as MediaIcon,
  Briefcase as ContractIcon,
  Tag as BrandIcon,
  Package as ProductIcon,
  Buildings,
  User,
  Folder,
  File,
  LinkSimple,
  Envelope,
  Phone,
  Globe,
  MagnifyingGlass,
  CaretDown,
  ArrowSquareOut,
  PencilSimple,
  Eye,
  X,
  FolderOpen,
  Briefcase,
  Tag,
  Package
} from '@phosphor-icons/react';
import * as collections from '@/collections';
import { useRouter } from 'next/navigation';
import { ViewButtons } from '@/components/buttons/ViewButtons';
import { useModal } from '@/components/modals/ModalContext';

// Collection Icons and Colors - Updated with all collections
export const COLLECTION_ICONS = {
  company: Buildings,
  contact: User,
  project: Folder,
  resource: File,
  task: Folder,
  contract: Briefcase,
  brand: Tag,
  media: FolderOpen,
  product: Package,
  element: File,
  contractpart: File,
  deliverable: Package,
  payment: Briefcase,
  event: File, // Using File as fallback for event
  proposal: Briefcase // Using Briefcase for proposal
};

export const COLLECTION_COLORS = {
  company: '#ef4444',
  contact: '#ec4899', 
  project: '#8b5cf6',
  resource: '#3b82f6',
  task: '#d32f2f',
  contract: '#9ca3af',
  brand: '#9c27b0',
  media: '#9ca3af',
  product: '#ff5722',
  element: '#3f51b5',
  contractpart: '#8bc34a',
  deliverable: '#ff9800',
  payment: '#4caf50',
  event: '#2196f3' // Blue color for event
};

/**
 * Modern Search Header Component with glass-morphism design
 */
export function SearchHeader({ 
  searchQuery, 
  onSearchChange, 
  placeholder = "Search across all collections...",
  totalResults = 0,
  isSearching = false 
}) {
  const theme = useTheme();
  
  return (
    <Paper 
      sx={{ 
        p: 3, 
        mb: 3,
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
        backdropFilter: 'blur(10px)',
        border: `1px solid ${alpha('#fbfbfb', 0.1)}`,
        borderRadius: 3,
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
      }}
    >
      <TextField
        fullWidth
        placeholder={placeholder}
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <MagnifyingGlass size={24} style={{ color: theme.palette.primary.main }} />
            </InputAdornment>
          ),
          endAdornment: isSearching ? (
            <InputAdornment position="end">
              <CircularProgress size={20} />
            </InputAdornment>
          ) : null
        }}
        sx={{ 
          '& .MuiOutlinedInput-root': { 
            borderRadius: 2,
            fontSize: '1.1rem',
            backgroundColor: alpha('#ffffff', 0.8),
            '&:hover': {
              backgroundColor: alpha('#ffffff', 0.9),
            },
            '&.Mui-focused': {
              backgroundColor: '#ffffff',
            }
          },
          mb: 2
        }}
      />
      
      {totalResults > 0 && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Found <strong>{totalResults}</strong> result{totalResults !== 1 ? 's' : ''}
            {searchQuery && ` for "${searchQuery}"`}
          </Typography>
          <Chip 
            label={`${totalResults} results`}
            size="small"
            color="primary"
            variant="outlined"
          />
        </Box>
      )}
    </Paper>
  );
}

/**
 * Modern Collection Tabs Component
 */
export function CollectionTabs({ 
  collections: targetCollections, 
  activeTab, 
  onTabChange, 
  resultCounts = {} 
}) {
  const theme = useTheme();
  
  return (
    <Paper 
      sx={{ 
        mb: 3,
        borderRadius: 2,
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        padding: 2,
      }}
    >
      <Tabs
        value={activeTab}
        onChange={(e, newValue) => onTabChange(newValue)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ 
          '& .MuiTab-root': {
            minHeight: 50,
            textTransform: 'none',
            fontSize: '1rem',
            fontWeight: 500,
            color: theme.palette.text.secondary,
            '&.Mui-selected': {
              color: theme.palette.primary.main,
              fontWeight: 600
            }
          },
          '& .MuiTabs-indicator': {
            height: 2,
            borderRadius: '0'
          }
        }}
      >
        {targetCollections.map((collectionName, index) => {
          const config = collections[collectionName];
          const IconComponent = COLLECTION_ICONS[collectionName] || File;
          const count = resultCounts[collectionName] || 0;
          const color = COLLECTION_COLORS[collectionName] || '#666'; // Add fallback color to prevent alpha error
          
          return (
            <Tab
              key={collectionName}
              icon={
                (() => {
                  const badgeContent = count > 50 ? "50+" : count.toString();
                  return (
                    <Badge 
                      badgeContent={badgeContent} 
                      color="primary" 
                      sx={{
                        '& .MuiBadge-badge': {
                          fontSize: '0.6rem',
                          minWidth: '22px', // Increased from 16px to ensure + sign is visible
                          height: '16px',
                          padding: '0 4px' // Add padding to ensure text has room
                        }
                      }}
                    >
                      <IconComponent 
                        size={20} 
                        weight="regular"
                        style={{ color: activeTab === index ? color : undefined }}
                      />
                    </Badge>
                  );
                })()
              }
              label={config?.label || collectionName}
              iconPosition="start"
              sx={{
                '&.Mui-selected .MuiBadge-root svg': {
                  color: color
                }
              }}
            />
          );
        })}
      </Tabs>
    </Paper>
  );
}

/**
 * Modern Filter Sidebar Component
 */
export function FilterSidebar({ 
  collections: targetCollections, 
  filters, 
  onFilterChange, 
  onClearAll,
  filterOptions = {},
  loading = false,
  onTabChange // Add onTabChange prop
}) {
  // State to track expanded accordions - initialize to null to ensure all accordions are closed on page load
  const [expandedAccordion, setExpandedAccordion] = useState(null);
  
  // Reset expanded accordion when collections change
  useEffect(() => {
    setExpandedAccordion(null);
  }, [targetCollections]);
  
  // Handle accordion change
  const handleAccordionChange = (collectionName) => (event, isExpanded) => {
    // Update expanded state
    setExpandedAccordion(isExpanded ? collectionName : null);
    
    // If accordion is expanded, switch to the corresponding tab
    if (isExpanded && typeof onTabChange === 'function') {
      const tabIndex = targetCollections.findIndex(name => name === collectionName);
      if (tabIndex !== -1) {
        onTabChange(tabIndex);
      }
    }
  };
  const theme = useTheme();
  
  const hasActiveFilters = Object.values(filters).some(collectionFilters =>
    Object.values(collectionFilters || {}).some(value => 
      value !== null && value !== undefined && value !== '' && value !== 'all'
    )
  );

  return (
    <Paper 
      sx={{ 
        p: 2,
        borderRadius: 2,
        background: `linear-gradient(135deg, ${alpha('#ffffff', 0.8)} 0%, ${alpha('#ffffff', 0.4)} 100%)`,
        border: `1px solid ${alpha('#fbfbfb', 0.1)}`,
        backdropFilter: 'blur(10px)'
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Filters
        </Typography>
        {hasActiveFilters && (
          <Button 
            size="small" 
            onClick={onClearAll}
            startIcon={<X size={16} weight="regular" />}
            variant="outlined"
            color="secondary"
            sx={{ borderRadius: 2 }}
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

      <Stack spacing={1}>
        {targetCollections.map(collectionName => {
          const config = collections[collectionName];
          if (!config) return null;

          const collectionFilters = filters[collectionName] || {};
          const hasActiveFilters = Object.keys(collectionFilters).some(key => 
            collectionFilters[key] && collectionFilters[key] !== 'all'
          );

          const IconComponent = COLLECTION_ICONS[collectionName] || File;
          const color = COLLECTION_COLORS[collectionName] || '#666'; // Add fallback color to prevent alpha error

          return (
            <Accordion 
              key={collectionName} 
              expanded={expandedAccordion === collectionName}
              onChange={handleAccordionChange(collectionName)}
              sx={{
                '&:before': { display: 'none' },
                boxShadow: 'none',
                backgroundColor: 'transparent'
              }}
            >
              <AccordionSummary 
                expandIcon={<CaretDown size={16} weight="regular" />}
                sx={{
                  borderRadius: 1,
                  backgroundColor: alpha(color, 0.05),
                  '&:hover': {
                    backgroundColor: alpha(color, 0.1)
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconComponent 
                    size={16} 
                    weight="regular"
                    style={{ color }}
                  />
                  <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
                    {config.label}
                  </Typography>
                  {expandedAccordion === collectionName && (
                    <Chip 
                      size="small" 
                      label="Active" 
                      color="primary"
                      sx={{ 
                        height: 20,
                        fontSize: '0.7rem'
                      }}
                    />
                  )}
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 1 }}>
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
      </Stack>
    </Paper>
  );
}

/**
 * Collection-specific Filters Component
 */
function CollectionFilters({ config, collectionName, filters, onFilterChange, options }) {
  // Get filterable fields (select, status, relationship)
  let filterableFields = config.fields?.filter(field =>
    field.type === 'select' || 
    field.type === 'status' || 
    field.type === 'relationship'
  ) || [];
  
  // Special handling for company collection - include filters from config.filters
  if (collectionName === 'company' && config.filters) {
    // Add filters from config.filters array, excluding 'sort' and 'search' filters
    const additionalFilters = config.filters
      .filter(filter => !['sort', 'search'].includes(filter.name)) // Exclude problematic filters
      .map(filter => ({
        ...filter,
        // Ensure the filter has all necessary properties for FilterField
        relation: filter.relation || undefined
      }));
    
    // Combine fields and filters, removing duplicates by name
    const allFields = [...filterableFields];
    
    // Add additional filters if they don't already exist in fields
    additionalFilters.forEach(filter => {
      if (!allFields.some(field => field.name === filter.name)) {
        allFields.push(filter);
      }
    });
    
    filterableFields = allFields;
  }
  
  // Limit to 8 filters per collection (increased from 6)
  filterableFields = filterableFields.slice(0, 8);

  return (
    <Stack spacing={2}>
      {filterableFields.map(field => (
        <FilterField
          key={`${collectionName}-${field.name}`}
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
 * Individual Filter Field Component - FIXED with proper key props
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
          sx={{ borderRadius: 1 }}
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
          sx={{ borderRadius: 1 }}
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

/**
 * Modern Results Grid Component
 */
export function ResultsGrid({ 
  collectionName, 
  results = [], 
  loading = false,
  emptyMessage = "No results found",
  onRefresh // Add onRefresh prop to handle record deletion
}) {
  const router = useRouter();
  const config = collections[collectionName];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={40} />
      </Box>
    );
  }

  if (!results.length) {
    return (
      <Paper 
        sx={{ 
          p: 6, 
          textAlign: 'center',
          borderRadius: 3,
          background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
          border: '1px dashed rgba(0,0,0,0.1)'
        }}
      >
        <MagnifyingGlass size={64} style={{ color: 'rgba(0,0,0,0.26)', marginBottom: 16 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          {emptyMessage}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Try adjusting your search terms or filters
        </Typography>
      </Paper>
    );
  }

  return (
    <Grid container spacing={3}>
      {results.map(item => (
        <Grid item xs={12} sm={6} lg={4} key={item.id}>
          <ModernResultCard
            item={item}
            config={config}
            collectionName={collectionName}
            router={router}
            onRefresh={onRefresh} // Pass onRefresh prop to ModernResultCard
          />
        </Grid>
      ))}
    </Grid>
  );
}

/**
 * Modern Result Card Component with improved design
 */
function ModernResultCard({ item, config, collectionName, router, onRefresh }) {
  const theme = useTheme();
  const quickView = config?.quickView || {};
  const color = COLLECTION_COLORS[collectionName] || '#666';
  const IconComponent = COLLECTION_ICONS[collectionName] || File;
  
  // Get display values
  const title = item[quickView.titleField || 'title'] || item.name || 'Untitled';
  const subtitle = item[quickView.subtitleField] || item.status || '';
  const description = item[quickView.descriptionField] || item.description || '';

  
  // Handle thumbnail/avatar with proper fallbacks
  const getAvatarSrc = () => {
    // Check for thumbnail_details first (from our improved query)
    if (item.thumbnail_details?.url) {
      return item.thumbnail_details.url;
    }
    
    // Check quickView imageField
    const imageField = quickView.imageField;
    if (imageField) {
      if (item[imageField]) return item[imageField];
      if (item[`${imageField}_details`]?.url) return item[`${imageField}_details`].url;
    }
    
    // Check for company thumbnail in relationship
    if (item.company_id_details?.thumbnail_details?.url) {
      return item.company_id_details.thumbnail_details.url;
    }
    
    // Other fallbacks
    if (item.url && collectionName === 'media') return item.url;
    
    return null;
  };

  const avatarSrc = getAvatarSrc();

  


  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        borderRadius: 3,
        background: `linear-gradient(135deg, ${alpha('#ffffff', 0.9)} 0%, ${alpha('#ffffff', 0.7)} 100%)`,
        backdropFilter: 'blur(10px)',
        border: `1px solid ${alpha(color, 0.2)}`,
        borderTop: `4px solid ${color}`,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: `0 20px 40px ${alpha(color, 0.2)}`,
          borderColor: alpha(color, 0.4)
        }
      }}
    >
      <CardContent sx={{ flexGrow: 1, p: 3 }}>
        {/* Header with avatar and title */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
          <Avatar 
            src={avatarSrc} 
            sx={{ 
              width: 56, 
              height: 56, 
              bgcolor: alpha(color, 0.1),
              border: `2px solid ${alpha(color, 0.2)}`,
              '& img': {
                objectFit: 'cover'
              }
            }}
          >
            <IconComponent size={28} weight="regular" style={{ color }} />
          </Avatar>
          
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontSize: '1.1rem',
                fontWeight: 600,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                color: theme.palette.text.primary,
                mb: 0.5
              }}
            >
              {title}
            </Typography>
            {subtitle && (
              <Chip 
                label={subtitle} 
                size="small" 
                variant="outlined"
                sx={{ 
                  borderColor: alpha(color, 0.3),
                  color: color,
                  fontSize: '0.75rem',
                  height: 24
                }}
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
              WebkitBoxOrient: 'vertical',
              lineHeight: 1.5
            }}
          >
            {description}
          </Typography>
        )}

      </CardContent>
          <Divider sx={{ borderColor: alpha(color, 0.1) }} />
          <Box sx={{ 
            p: 1.5, 
            display: 'flex', 
            justifyContent: 'center',
            backgroundColor: alpha(color, 0.02)
          }}>
            <ViewButtons 
              config={{ ...config, key: collectionName }}
              id={item.id}
              record={item}
              showDelete={true}
              onRefresh={onRefresh} // Pass onRefresh prop to ViewButtons for immediate UI updates
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
 * Modern Empty State Component
 */
export function EmptySearchState({ 
  hasQuery = false, 
  hasFilters = false,
  onClearFilters 
}) {
  const theme = useTheme();
  
  return (
    <Paper 
      sx={{ 
        p: 6, 
        textAlign: 'center',
        borderRadius: 3,
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.02)} 100%)`,
        border: `2px dashed ${alpha(theme.palette.primary.main, 0.2)}`
      }}
    >
      <MagnifyingGlass 
        size={80} 
        style={{ 
          color: alpha(theme.palette.primary.main, 0.3), 
          marginBottom: 24 
        }} 
      />
      
      <Typography variant="h4" gutterBottom color="text.secondary" sx={{ fontWeight: 300 }}>
        {hasQuery || hasFilters ? 'No results found' : 'Start your search'}
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 400, mx: 'auto' }}>
        {hasQuery || hasFilters 
          ? 'Try adjusting your search terms or filters to find what you\'re looking for'
          : 'Enter a search term above to discover content across all your collections'
        }
      </Typography>
      
      {hasFilters && (
        <Button 
          variant="contained" 
          onClick={onClearFilters}
          startIcon={<X size={18} weight="regular" />}
          sx={{ 
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 500
          }}
        >
          Clear All Filters
        </Button>
      )}
    </Paper>
  );
}