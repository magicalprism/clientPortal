'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Tabs, Tab, Divider, Stack, Button, Typography, Select, MenuItem, TextField, FormControlLabel, Switch
} from '@mui/material';
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
          options.map((opt) => {
    
            return (
              <MenuItem key={opt.id} value={opt.id}>
                {opt[filter.relation.labelField] || `Untitled (${opt.id})`}
              </MenuItem>
            );
          })
        )}
      </Select>
    );
  }

  // Regular select filter
  if (filter.options) {
    const isMultiple = filter.multiple || false;
    const currentValue = isMultiple ? (Array.isArray(value) ? value : []) : value;
    

    
    return (
      <Select
        fullWidth
        multiple={isMultiple}
        value={currentValue}
        onChange={(e) => setValue(e.target.value)}
        displayEmpty
        size="small"
        renderValue={(selected) => {
          if (isMultiple && Array.isArray(selected)) {
            if (selected.length === 0) return 'All';
            const labels = selected.map(val => {
              const option = filter.options.find(opt => (opt.value || opt) === val);
              return option ? (option.label || option) : val;
            });
            return labels.join(', ');
          }
          return selected || 'All';
        }}
      >
        {!isMultiple && <MenuItem value="">All</MenuItem>}
        {filter.options.map(opt => (
          <MenuItem key={opt.value || opt} value={opt.value || opt}>
            {opt.label || opt}
          </MenuItem>
        ))}
      </Select>
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

export function CollectionFilters({ config, filters, onChange, sortDir, onSortChange, onDeleteSuccess }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selection = useCollectionSelection();

  const handleClearFilters = () => {
    onChange({});
  };

  const tabFilter = config.filters?.find((f) => f.type === 'tab');
  const otherFilters = (config.filters || []).filter((f) => f.type !== 'tab');
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

      <Stack direction="row" spacing={2} sx={{ px: 0, py: 0, alignItems: 'center', flexWrap: 'wrap' }}>
        <Stack direction="row" spacing={2} sx={{ flex: '1 1 auto', flexWrap: 'wrap' }}>
        
          {otherFilters.map((filter) => {
            const filterValue = filters[filter.name] || (filter.multiple ? [] : '');
            let displayValue = '';

            // Handle boolean filters
            if (filter.type === 'boolean') {
              displayValue = filterValue === true ? 'Yes' : filterValue === false ? 'No' : '';
            }
            // Handle multi-select arrays
            else if (filter.multiple && Array.isArray(filterValue)) {
              if (filterValue.length === 0) {
                displayValue = '';
              } else if (filter.type === 'select' && filter.options) {
                // Regular select options
                const labels = filterValue.map(val => {
                  const option = filter.options.find(opt => (opt.value || opt) === val);
                  const label = option ? (option.label || option) : val;
                  return label;
                });
                displayValue = labels.join(', ');
              } else if (filter.type === 'relationship' && filter.relation) {
                // Relationship options - we need to fetch these or cache them
                // For now, show IDs - you might want to implement a lookup cache
                displayValue = filterValue.map(id => `ID: ${id}`).join(', ');
         
              } else {
                displayValue = filterValue.join(', ');
              }
            } 
            // Handle single-select values
            else if (!filter.multiple && filter.type === 'select' && filter.options) {
              const selectedOption = filter.options.find(opt => (opt.value || opt) === filterValue);
              displayValue = selectedOption ? (selectedOption.label || selectedOption) : filterValue;
            }
            // Handle single relationship values
            else if (!filter.multiple && filter.type === 'relationship' && filterValue) {
              // For single relationship, show ID for now
              displayValue = `ID: ${filterValue}`;
             
            }
            // Handle string values that should be arrays (fallback)
            else if (filter.multiple && typeof filterValue === 'string' && filterValue.includes(',')) {
   
              const arrayValue = filterValue.split(',').map(v => v.trim());
              if (filter.type === 'select' && filter.options) {
                const labels = arrayValue.map(val => {
                  const option = filter.options.find(opt => (opt.value || opt) === val);
                  return option ? (option.label || option) : val;
                });
                displayValue = labels.join(', ');
              } else {
                displayValue = arrayValue.join(', ');
              }
            }
            // Default case
            else {
              displayValue = filterValue;
            }

            // Truncate long display values
            const maxDisplayLength = 30;
            const truncatedDisplayValue = displayValue && displayValue.length > maxDisplayLength 
              ? displayValue.substring(0, maxDisplayLength) + '...' 
              : displayValue;

            return (
              <FilterButton
                key={filter.name}
                displayValue={truncatedDisplayValue}
                label={filter.label}
                value={filterValue}
                onFilterApply={(newValue) => {
               
                  onChange(prev => ({ ...prev, [filter.name]: newValue }));
                }}
                onFilterDelete={() => {
           
                  onChange({
                    ...filters,
                    [filter.name]: filter.type === 'boolean'
                      ? undefined
                      : (filter.multiple ? [] : '')
                  });
                }}
                popover={<TextFilterPopover label={filter.label} filter={filter} />}
              />
            );
          })}

          {hasFilters && <Button onClick={handleClearFilters}>Clear filters</Button>}
        </Stack>

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
    </div>
  );
}