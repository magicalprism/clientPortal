'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Tabs, Tab, Divider, Stack, Button, Typography, Select, MenuItem, TextField, 
  FormControlLabel, Switch, InputAdornment, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, Box, Radio, Checkbox, Grid, Accordion,
  AccordionSummary, AccordionDetails
} from '@mui/material';
import { MagnifyingGlass as MagnifyingGlassIcon, FunnelSimple as FilterIcon, CaretDown as CaretDownIcon } from '@phosphor-icons/react';
import { FilterButton, FilterPopover, useFilterContext } from '@/components/core/filter-button';
import { useCollectionSelection } from '@/components/views/components/CollectionSelectionContext';
import { DeleteSelectedButton } from '@/components/core/delete-selected-button';
import { createClient } from '@/lib/supabase/browser';
import { resolveDynamicFilter } from '@/lib/utils/filters/listfilters/filters';
import { fetchRelationshipOptions } from '@/lib/supabase/queries/utils/relationshipOptions';

const supabase = createClient(); // Keep for auth and other operations

function FilterPopoverContent({ filter, value, setValue, filters = {} }) {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Memoize the filter key to prevent infinite loops
  const filterKey = useMemo(() => {
    if (filter.type !== 'relationship' || !filter.relation) return null;
    return JSON.stringify({
      table: filter.relation.table,
      labelField: filter.relation.labelField,
      filter: filter.relation.filter
    });
  }, [filter]);

  useEffect(() => {
    const fetchOptions = async () => {
      if (!filterKey) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Use centralized query function instead of direct Supabase query
        const resolvedFilter = filter.relation.filter 
          ? resolveDynamicFilter(filter.relation.filter, { record: filters }) 
          : {};
        
        // Only include filters with values
        const filtersToApply = {};
        Object.entries(resolvedFilter).forEach(([key, val]) => {
          if (val !== undefined && val !== null) {
            filtersToApply[key] = val;
          }
        });
        
        const { data, error } = await fetchRelationshipOptions(
          filter.relation.table, 
          filter.relation.labelField,
          filtersToApply
        );
        
        if (error) {
          setError(error.message);
          setOptions([]);
        } else if (data) {
          // Data is already sorted by the query function
          setOptions(data);
        } else {
          setOptions([]);
        }
      } catch (err) {
        setError(err.message);
        setOptions([]);
      }
      setLoading(false);
    };

    fetchOptions();
  }, [filterKey]); // Only depend on the memoized filterKey, not the entire filters object

  // Boolean filter
  if (filter.type === 'boolean') {
    return (
      <FormControlLabel
        control={
          <Switch
            checked={Boolean(value)}
            onChange={(e) => {
              const nextValue = e.target.checked;
              setValue(nextValue);
            }}
          />
        }
        label={filter.label}
      />
    );
  }

  // Relationship filter
  if (filter.type === 'relationship' && filter.relation) {
    const isMultiple = filter.multiple || false;
    const currentValue = isMultiple ? (Array.isArray(value) ? value : []) : value;
    
    if (error) {
      return (
        <div style={{ padding: '16px', color: 'red' }}>
          Error loading options: {error}
        </div>
      );
    }

    return (
      <Select
        fullWidth
        multiple={isMultiple}
        value={currentValue}
        onChange={(e) => {
          setValue(e.target.value);
        }}
        displayEmpty
        size="small"
        disabled={loading}
        renderValue={(selected) => {
          if (isMultiple && Array.isArray(selected)) {
            if (selected.length === 0) return 'All';
            const labels = selected.map(id => {
              const option = options.find(opt => opt.id === id);
              const label = option ? option[filter.relation.labelField] : `ID: ${id}`;
              return label;
            });
            return labels.join(', ');
          } else if (selected) {
            const option = options.find(opt => opt.id === selected);
            const label = option ? option[filter.relation.labelField] : `ID: ${selected}`;
            return label;
          }
          return 'All';
        }}
      >
        {!isMultiple && <MenuItem value="">All</MenuItem>}
        {loading ? (
          <MenuItem disabled>Loading...</MenuItem>
        ) : options.length === 0 ? (
          <MenuItem disabled>No options available</MenuItem>
        ) : (
          options.map((opt) => (
            <MenuItem key={opt.id} value={opt.id}>
              {opt[filter.relation.labelField] || `Untitled (${opt.id})`}
            </MenuItem>
          ))
        )}
      </Select>
    );
  }

  // Regular select filter
  if (filter.options) {
    const isMultiple = filter.multiple || false;
    // Ensure value is always an array for multi-select
    const currentValue = isMultiple ? (Array.isArray(value) ? value : (value ? [value] : [])) : value;
    
    // For multi-select filters, use checkboxes
    if (isMultiple) {
      return (
        <Stack spacing={1}>
          {/* "All" option */}
          <FormControlLabel
            control={
              <Checkbox
                checked={currentValue.length === 0}
                onChange={() => setValue([])}
                size="small"
              />
            }
            label="All"
          />
          
          {/* Filter options */}
          {filter.options.map(opt => {
            const optValue = opt.value || opt;
            const optLabel = opt.label || opt;
            const isChecked = currentValue.includes(optValue);
            
            return (
              <FormControlLabel
                key={optValue}
                control={
                  <Checkbox
                    checked={isChecked}
                    onChange={(e) => {
                      if (e.target.checked) {
                        // Add to selection
                        setValue([...currentValue, optValue]);
                      } else {
                        // Remove from selection
                        setValue(currentValue.filter(val => val !== optValue));
                      }
                    }}
                    size="small"
                  />
                }
                label={optLabel}
              />
            );
          })}
        </Stack>
      );
    }
    
    // For single-select filters, use radio buttons
    return (
      <Stack spacing={1}>
        <FormControlLabel
          control={
            <Radio
              checked={currentValue === ''}
              onChange={() => setValue('')}
              size="small"
            />
          }
          label="All"
        />
        
        {filter.options.map(opt => {
          const optValue = opt.value || opt;
          const optLabel = opt.label || opt;
          
          return (
            <FormControlLabel
              key={optValue}
              control={
                <Radio
                  checked={currentValue === optValue}
                  onChange={() => setValue(optValue)}
                  size="small"
                />
              }
              label={optLabel}
            />
          );
        })}
      </Stack>
    );
  }

  // Text filter
  return (
    <TextField
      fullWidth
      size="small"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder={`Filter by ${filter.label}`}
    />
  );
}

function TextFilterPopover({ label, filter }) {
  const { anchorEl, onApply, onClose, open, value: initialValue } = useFilterContext();
  const [value, setValue] = useState('');

  useEffect(() => {
    if (filter.type === 'boolean') {
      setValue(initialValue === undefined ? false : Boolean(initialValue));
    } else if (filter.multiple) {
      setValue(Array.isArray(initialValue) ? initialValue : (initialValue ? [initialValue] : []));
    } else {
      setValue(initialValue ?? '');
    }
  }, [initialValue, filter.multiple, filter.type]);

  return (
    <FilterPopover anchorEl={anchorEl} onClose={onClose} open={open} title={`Filter by ${label}`}>
      <Stack spacing={2}>
        <FilterPopoverContent 
          filter={filter} 
          value={value} 
          setValue={setValue} 
        />
        <Button variant="contained" onClick={() => onApply(value)}>
          Apply
        </Button>
      </Stack>
    </FilterPopover>
  );
}

function SortFilterPopover() {
  const { anchorEl, onApply, onClose, open, value: initialValue } = useFilterContext();
  const [value, setValue] = useState('');
  
  // Get the current context
  const context = React.useContext(React.createContext({}));
  
  // Get the sortOptions from context if they exist
  const sortOptions = context?.config?.sortOptions || [];

  useEffect(() => {
    setValue(initialValue ?? '');
  }, [initialValue]);

  return (
    <FilterPopover anchorEl={anchorEl} onClose={onClose} open={open} title="Sort by">
      <Stack spacing={2}>
        <Select
          fullWidth
          value={value}
          onChange={(e) => setValue(e.target.value)}
          displayEmpty
          size="small"
        >
          <MenuItem value="">Sort by</MenuItem>
          {sortOptions.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </Select>
        <Button variant="contained" onClick={() => onApply(value)}>Apply</Button>
      </Stack>
    </FilterPopover>
  );
}

// Relationship filter with checkbox/radio
function RelationshipFilterContent({ filter, value, setValue, options, loading, error }) {
  const isMultiple = filter.multiple || false;
  const currentValue = isMultiple ? (Array.isArray(value) ? value : (value ? [value] : [])) : value;
  
  if (error) {
    return (
      <div style={{ padding: '8px', color: 'red' }}>
        Error loading options: {error}
      </div>
    );
  }
  
  if (loading) {
    return (
      <Typography variant="body2" sx={{ p: 1 }}>Loading...</Typography>
    );
  }
  
  if (options.length === 0) {
    return (
      <Typography variant="body2" sx={{ p: 1 }}>No options available</Typography>
    );
  }
  
  // For multi-select relationship filters, use checkboxes
  if (isMultiple) {
    return (
      <Grid container spacing={1}>
        {/* "All" option */}
        <Grid item xs={6}>
          <FormControlLabel
            sx={{ alignItems: 'flex-start' }}
            control={
              <Checkbox
                checked={currentValue.length === 0}
                onChange={() => setValue([])}
                size="small"
              />
            }
            label="All"
          />
        </Grid>
        
        {/* Relationship options */}
        {options.map((opt) => {
          const optValue = opt.id;
          const optLabel = opt[filter.relation.labelField] || `Untitled (${opt.id})`;
          const isChecked = currentValue.includes(optValue);
          
          return (
            <Grid item xs={6} key={optValue}>
              <FormControlLabel
                sx={{ alignItems: 'flex-start' }}
                control={
                  <Checkbox
                    checked={isChecked}
                    onChange={(e) => {
                      if (e.target.checked) {
                        // Add to selection
                        setValue([...currentValue, optValue]);
                      } else {
                        // Remove from selection
                        setValue(currentValue.filter(val => val !== optValue));
                      }
                    }}
                    size="small"
                  />
                }
                label={optLabel}
              />
            </Grid>
          );
        })}
      </Grid>
    );
  }
  
  // For single-select relationship filters, use radio buttons
  return (
    <Grid container spacing={1}>
      {/* "All" option */}
      <Grid item xs={6}>
        <FormControlLabel
          sx={{ alignItems: 'flex-start' }}
          control={
            <Radio
              checked={!currentValue}
              onChange={() => setValue('')}
              size="small"
            />
          }
          label="All"
        />
      </Grid>
      
      {/* Relationship options */}
      {options.map((opt) => {
        const optValue = opt.id;
        const optLabel = opt[filter.relation.labelField] || `Untitled (${opt.id})`;
        
        return (
          <Grid item xs={6} key={optValue}>
            <FormControlLabel
              sx={{ alignItems: 'flex-start' }}
              control={
                <Radio
                  checked={currentValue === optValue}
                  onChange={() => setValue(optValue)}
                  size="small"
                />
              }
              label={optLabel}
            />
          </Grid>
        );
      })}
    </Grid>
  );
}

// Component to display relationship filter labels
function RelationshipFilterLabel({ filter, value }) {
  const [label, setLabel] = useState('Loading...');
  
  useEffect(() => {
    const fetchLabel = async () => {
      if (!filter.relation || !value) {
        setLabel(value ? String(value) : '');
        return;
      }
      
      try {
        const { data, error } = await fetchRelationshipOptions(
          filter.relation.table,
          filter.relation.labelField,
          { id: value }
        );
        
        if (error || !data || data.length === 0) {
          setLabel(`ID: ${value}`);
        } else {
          setLabel(data[0][filter.relation.labelField] || `Untitled (${value})`);
        }
      } catch (err) {
        console.error('Error fetching relationship label:', err);
        setLabel(`ID: ${value}`);
      }
    };
    
    fetchLabel();
  }, [filter, value]);
  
  return (
    <Typography variant="body2" color="primary.main">
      {label}
    </Typography>
  );
}

// Relationship filter with options fetching
function RelationshipFilterWithOptions({ filter, value, setValue, filters = {} }) {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch options on mount
  useEffect(() => {
    const fetchOptions = async () => {
      if (!filter.relation) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Use centralized query function instead of direct Supabase query
        const resolvedFilter = filter.relation.filter 
          ? resolveDynamicFilter(filter.relation.filter, { record: filters }) 
          : {};
        
        // Only include filters with values
        const filtersToApply = {};
        Object.entries(resolvedFilter).forEach(([key, val]) => {
          if (val !== undefined && val !== null) {
            filtersToApply[key] = val;
          }
        });
        
        const { data, error } = await fetchRelationshipOptions(
          filter.relation.table, 
          filter.relation.labelField,
          filtersToApply
        );
        
        if (error) {
          setError(error.message);
          setOptions([]);
        } else if (data) {
          // Data is already sorted by the query function
          setOptions(data);
        } else {
          setOptions([]);
        }
      } catch (err) {
        setError(err.message);
        setOptions([]);
      }
      setLoading(false);
    };

    fetchOptions();
  }, [filter.relation, filters]);

  return (
    <RelationshipFilterContent 
      filter={filter} 
      value={value}
      setValue={setValue}
      options={options}
      loading={loading}
      error={error}
    />
  );
}

// Filter Modal Component
function FilterModal({ open, onClose, config, filters, onChange, hasFilters, handleClearFilters }) {
  // Initialize with first two accordions open
  const [expanded, setExpanded] = useState(() => {
    const initialExpanded = { 'boolean': true };
    
    // Find the first non-boolean filter
    const firstNonBooleanFilter = config.filters?.find(
      filter => filter.type !== 'boolean' && filter.type !== 'tab' && filter.name !== 'search'
    );
    
    if (firstNonBooleanFilter) {
      initialExpanded[firstNonBooleanFilter.name] = true;
    }
    
    return initialExpanded;
  });
  
  const handleAccordionChange = (filterName) => (event, isExpanded) => {
    setExpanded({ ...expanded, [filterName]: isExpanded });
  };
  
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      fullWidth
      maxWidth="xs"
    >
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Filters</Typography>
          {hasFilters && (
            <Button size="small" onClick={handleClearFilters}>
              Clear all
            </Button>
          )}
        </Stack>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 1 }}>
        <Stack spacing={1} sx={{ px: 1 }}>
          {/* Boolean filters */}
          <Accordion 
            expanded={expanded['boolean'] === true}
            onChange={handleAccordionChange('boolean')}
            disableGutters
            elevation={0}
            sx={{ 
              boxShadow: 'none', 
              border: 'none',
              '&:before': {
                display: 'none',
              }
            }}
          >
            <AccordionSummary
              expandIcon={<CaretDownIcon size={16} />}
              sx={{ 
                minHeight: 48,
                p: 0,
                pl: 1
              }}
            >
              <Typography variant="subtitle2">Toggle Filters</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 1, pl: 2 }}>
              <Grid container spacing={1}>
                {config.filters
                  ?.filter(filter => filter.type === 'boolean')
                  .map((filter) => {
                    const filterValue = filters[filter.name] || false;
                    
                    return (
                      <Grid item xs={6} key={filter.name}>
                        <FormControlLabel 
                          sx={{ 
                            alignItems: 'flex-start',
                            '& .MuiSwitch-root': { mr: 1.5 }
                          }}
                          control={
                            <Switch
                              checked={Boolean(filterValue)}
                              onChange={(e) => {
                                const newValue = e.target.checked;
                                onChange({
                                  ...filters,
                                  [filter.name]: newValue
                                });
                              }}
                              size="small"
                            />
                          }
                          label={filter.label}
                        />
                      </Grid>
                    );
                  })}
              </Grid>
            </AccordionDetails>
          </Accordion>
          
          {/* Other filters */}
          {config.filters
            ?.filter(filter => filter.type !== 'boolean' && filter.type !== 'tab' && filter.name !== 'search')
            .map((filter) => {
              const filterValue = filters[filter.name] || (filter.multiple ? [] : '');
              
              return (
                <Accordion 
                  key={filter.name}
                  expanded={expanded[filter.name] === true}
                  onChange={handleAccordionChange(filter.name)}
                  disableGutters
                  elevation={0}
                  sx={{ 
                    boxShadow: 'none', 
                    border: 'none',
                    '&:before': {
                      display: 'none',
                    }
                  }}
                >
                  <AccordionSummary
                    expandIcon={<CaretDownIcon size={16} />}
                    sx={{ 
                      minHeight: 48,
                      p: 0,
                      pl: 1
                    }}
                  >
                    <Typography variant="subtitle2">{filter.label}</Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 1, pl: 2 }}>
                    {/* For relationship filters, use our custom component */}
                    {filter.type === 'relationship' && filter.relation ? (
                      <RelationshipFilterWithOptions 
                        filter={filter} 
                        value={filterValue}
                        setValue={(newValue) => {
                          onChange({
                            ...filters,
                            [filter.name]: newValue
                          });
                        }}
                        filters={filters}
                      />
                    ) : filter.options ? (
                      // For regular select filters with options, use two-column layout
                      <Grid container spacing={1}>
                        {filter.multiple ? (
                          // Multi-select with checkboxes in two columns
                          <>
                            {/* "All" option */}
                            <Grid item xs={6}>
                              <FormControlLabel
                                sx={{ alignItems: 'flex-start' }}
                                control={
                                  <Checkbox
                                    checked={Array.isArray(filterValue) && filterValue.length === 0}
                                    onChange={() => onChange({
                                      ...filters,
                                      [filter.name]: []
                                    })}
                                    size="small"
                                  />
                                }
                                label="All"
                              />
                            </Grid>
                            
                            {/* Filter options */}
                            {filter.options.map(opt => {
                              const optValue = opt.value || opt;
                              const optLabel = opt.label || opt;
                              const isChecked = Array.isArray(filterValue) && filterValue.includes(optValue);
                              
                              return (
                                <Grid item xs={6} key={optValue}>
                                  <FormControlLabel
                                    sx={{ alignItems: 'flex-start' }}
                                    control={
                                      <Checkbox
                                        checked={isChecked}
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            // Add to selection
                                            onChange({
                                              ...filters,
                                              [filter.name]: [...filterValue, optValue]
                                            });
                                          } else {
                                            // Remove from selection
                                            onChange({
                                              ...filters,
                                              [filter.name]: filterValue.filter(val => val !== optValue)
                                            });
                                          }
                                        }}
                                        size="small"
                                      />
                                    }
                                    label={optLabel}
                                  />
                                </Grid>
                              );
                            })}
                          </>
                        ) : (
                          // Single-select with radio buttons in two columns
                          <>
                            {/* "All" option */}
                            <Grid item xs={6}>
                              <FormControlLabel
                                sx={{ alignItems: 'flex-start' }}
                                control={
                                  <Radio
                                    checked={filterValue === ''}
                                    onChange={() => onChange({
                                      ...filters,
                                      [filter.name]: ''
                                    })}
                                    size="small"
                                  />
                                }
                                label="All"
                              />
                            </Grid>
                            
                            {/* Filter options */}
                            {filter.options.map(opt => {
                              const optValue = opt.value || opt;
                              const optLabel = opt.label || opt;
                              
                              return (
                                <Grid item xs={6} key={optValue}>
                                  <FormControlLabel
                                    sx={{ alignItems: 'flex-start' }}
                                    control={
                                      <Radio
                                        checked={filterValue === optValue}
                                        onChange={() => onChange({
                                          ...filters,
                                          [filter.name]: optValue
                                        })}
                                        size="small"
                                      />
                                    }
                                    label={optLabel}
                                  />
                                </Grid>
                              );
                            })}
                          </>
                        )}
                      </Grid>
                    ) : (
                      // For text filters, use the existing component
                      <FilterPopoverContent 
                        filter={filter} 
                        value={filterValue}
                        setValue={(newValue) => {
                          onChange({
                            ...filters,
                            [filter.name]: newValue
                          });
                        }}
                        filters={filters}
                      />
                    )}
                  </AccordionDetails>
                </Accordion>
              );
            })}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Done</Button>
      </DialogActions>
    </Dialog>
  );
}

export function CollectionFilters({ 
  config, 
  filters, 
  onChange, 
  sortDir, 
  onSortChange, 
  onDeleteSuccess,
  showFilterIcon = true,
  showSearchOnly = false,
  showActiveFiltersOnly = false,
  filterModalOpen: externalModalOpen,
  setFilterModalOpen: externalSetModalOpen
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selection = useCollectionSelection();

  const handleClearFilters = () => {
    onChange({});
  };

  // Local state for filter modal if not provided from props
  const [localModalOpen, setLocalModalOpen] = useState(false);
  
  // Use props if provided, otherwise use local state
  const filterModalOpen = externalModalOpen !== undefined ? externalModalOpen : localModalOpen;
  const setFilterModalOpen = externalSetModalOpen || setLocalModalOpen;
  
  const tabFilter = config.filters?.find((f) => f.type === 'tab');
  const hasFilters = Object.values(filters).some(Boolean);
  const tabValue = filters[tabFilter?.name] ?? tabFilter?.options?.[0]?.value ?? '';

  return (
    <div>
      {tabFilter && (
        <>
          <Tabs
            sx={{ px: 3 }}
            value={tabValue}
            onChange={(e, value) => onChange({ ...filters, [tabFilter.name]: value })}
            variant="scrollable"
          >
            {tabFilter.options.map((tab) => (
              <Tab key={tab.value} value={tab.value} label={tab.label} />
            ))}
          </Tabs>
          <Divider />
        </>
      )}

      <Box>
        {/* Top row with filter icon and search - only show if not showActiveFiltersOnly */}
        {!showActiveFiltersOnly && (
          <Stack 
            direction="row" 
            spacing={1} 
            sx={{ 
              px: 0, 
              py: 0, 
              alignItems: 'center',
              flexWrap: 'wrap', 
              gap: 1,
            }}
          >
            {/* Filter icon button - only show if showFilterIcon is true */}
            {showFilterIcon && (
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
            
            {/* Search field */}
            {config.filters
              ?.filter(filter => filter.name === 'search')
              .map((filter) => {
                const filterValue = filters[filter.name] || '';
                
                return (
                  <TextField
                    key={filter.name}
                    size="small"
                    placeholder={`Search ${config.label || 'items'}`}
                    value={filterValue}
                    onChange={(e) => {
                      onChange({
                        ...filters,
                        [filter.name]: e.target.value
                      });
                    }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <MagnifyingGlassIcon size={20} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ 
                      minWidth: 180,
                      maxWidth: 300,
                      '& .MuiInputBase-root': {
                        height: 40
                      }
                    }}
                  />
                );
              })}
            
            {/* Selection indicator */}
            {selection.selectedAny && (
              <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                <Typography color="text.secondary" variant="body2">
                  {selection.selected.size} selected
                </Typography>
                <DeleteSelectedButton
                  selection={selection}
                  tableName={config.name}
                  entityLabel={config.label?.toLowerCase() || config.name}
                  onDeleteSuccess={onDeleteSuccess}
                />
              </Stack>
            )}
          </Stack>
        )}
        
        {/* Active filters display - always show if hasFilters, regardless of showSearchOnly */}
        {hasFilters && (showActiveFiltersOnly || !showSearchOnly) && (
          <Stack 
            direction="row" 
            spacing={1} 
            sx={{ 
              mt: 1, 
              flexWrap: 'wrap',
              alignItems: 'center',
              width: '100%'
            }}
          >
            {Object.entries(filters).map(([key, value]) => {
              if (!value || key === 'search' || (Array.isArray(value) && value.length === 0)) return null;
              
              const filterConfig = config.filters?.find(f => f.name === key);
              if (!filterConfig) return null;
              
              // Get display value based on filter type
              let displayValue = '';
              
              // Boolean filters
              if (filterConfig.type === 'boolean') {
                displayValue = value ? 'Yes' : 'No';
              } 
              // Array values (multi-select)
              else if (Array.isArray(value)) {
                if (value.length === 0) return null;
                
                // For select filters with options
                if (filterConfig.options) {
                  const labels = value.map(val => {
                    const option = filterConfig.options.find(opt => (opt.value || opt) === val);
                    return option ? (option.label || option) : val;
                  });
                  displayValue = labels.join(', ');
                }
                // For relationship filters
                else if (filterConfig.type === 'relationship' && filterConfig.relation) {
                  // Just show count for now since we don't have the actual data
                  // In a real implementation, you'd fetch the labels
                  displayValue = `${value.length} selected`;
                }
                // Fallback
                else {
                  displayValue = value.join(', ');
                }
              } 
              // Single values
              else {
                // For select filters with options
                if (filterConfig.options) {
                  const option = filterConfig.options.find(opt => (opt.value || opt) === value);
                  displayValue = option ? (option.label || option) : value;
                }
                // For relationship filters
                else if (filterConfig.type === 'relationship' && filterConfig.relation) {
                  // Use a component that will fetch and display the label
                  return (
                    <Stack 
                      key={key} 
                      direction="row" 
                      spacing={0.5} 
                      alignItems="center"
                      sx={{ mr: 2 }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        {filterConfig.label}:
                      </Typography>
                      <RelationshipFilterLabel 
                        filter={filterConfig} 
                        value={value} 
                      />
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ 
                          cursor: 'pointer',
                          '&:hover': {
                            color: 'error.main'
                          }
                        }}
                        onClick={() => {
                          const newFilters = { ...filters };
                          delete newFilters[key];
                          onChange(newFilters);
                        }}
                      >
                        ×
                      </Typography>
                    </Stack>
                  );
                }
                // Fallback for text and other filters
                else {
                  displayValue = String(value);
                }
              }
              
              return (
                <Stack 
                  key={key} 
                  direction="row" 
                  spacing={0.5} 
                  alignItems="center"
                  sx={{ mr: 2 }}
                >
                  <Typography variant="body2" color="text.secondary">
                    {filterConfig.label}:
                  </Typography>
                  <Typography variant="body2" color="primary.main">
                    {displayValue}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': {
                        color: 'error.main'
                      }
                    }}
                    onClick={() => {
                      const newFilters = { ...filters };
                      delete newFilters[key];
                      onChange(newFilters);
                    }}
                  >
                    ×
                  </Typography>
                </Stack>
              );
            })}
            
            <Button 
              variant="text" 
              color="primary" 
              size="small" 
              onClick={handleClearFilters}
              sx={{ 
                minWidth: 'auto', 
                p: 0,
                fontSize: '0.75rem',
                textTransform: 'none'
              }}
            >
              Clear
            </Button>
          </Stack>
        )}
      </Box>
      
      {/* Filter Modal */}
      <FilterModal
        open={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        config={config}
        filters={filters}
        onChange={onChange}
        hasFilters={hasFilters}
        handleClearFilters={handleClearFilters}
      />
    </div>
  );
}