'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Tabs, Tab, Divider, Stack, Button, Typography, Select, MenuItem, TextField
} from '@mui/material';
import { FilterButton, FilterPopover, useFilterContext } from '@/components/core/filter-button';
import { useCollectionSelection } from '@/components/views/components/CollectionSelectionContext';
import { DeleteSelectedButton } from '@/components/core/delete-selected-button';
import { createClient } from '@/lib/supabase/browser';
import { resolveDynamicFilter } from '@/lib/utils/filters/listfilters/filters';

const supabase = createClient();

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

      console.log('[Relationship Filter] Starting fetch for:', filter.name);
      
      setLoading(true);
      setError(null);
      
      try {
        let query = supabase.from(filter.relation.table).select(`id, ${filter.relation.labelField}`);
        console.log(`[Relationship Filter] Base query: SELECT id, ${filter.relation.labelField} FROM ${filter.relation.table}`);
        
        // Apply any dynamic filters
        if (filter.relation.filter) {
          console.log(`[Relationship Filter] Has relation filter:`, filter.relation.filter);
          const resolvedFilter = resolveDynamicFilter(filter.relation.filter, { record: filters });
          console.log(`[Relationship Filter] Resolved filter:`, resolvedFilter);
          
          Object.entries(resolvedFilter).forEach(([key, val]) => {
            if (val) {
              console.log(`[Relationship Filter] Adding filter: ${key} = ${val}`);
              query = query.eq(key, val);
            }
          });
        }

        console.log('[Relationship Filter] Executing query...');
        const { data, error } = await query;
        console.log(`[Relationship Filter] Query result:`, { data, error, dataLength: data?.length });
        
        if (error) {
          console.error(`[Relationship Filter] Query error:`, error);
          setError(error.message);
          setOptions([]);
        } else if (data) {
          const labelField = filter.relation.labelField;
          console.log(`[Relationship Filter] Using labelField: ${labelField}`);
          console.log(`[Relationship Filter] Sample data:`, data.slice(0, 3));
          
          const sortedData = [...data].sort((a, b) =>
            (a[labelField] || '').localeCompare(b[labelField] || '')
          );
          setOptions(sortedData);
          console.log(`[Relationship Filter] Set ${sortedData.length} options`);
        } else {
          console.log('[Relationship Filter] No data returned');
          setOptions([]);
        }
      } catch (err) {
        console.error(`[Relationship Filter] Fetch error:`, err);
        setError(err.message);
        setOptions([]);
      }
      setLoading(false);
    };

    fetchOptions();
  }, [filterKey]); // Only depend on the memoized filterKey, not the entire filters object

  // Relationship filter
  if (filter.type === 'relationship' && filter.relation) {
    const isMultiple = filter.multiple || false;
    const currentValue = isMultiple ? (Array.isArray(value) ? value : []) : value;
    
    console.log('[Relationship Filter] Rendering relationship select:', {
      isMultiple,
      currentValue,
      optionsLength: options.length,
      loading,
      error
    });

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
          console.log('[Relationship Filter] Select onChange:', e.target.value);
          setValue(e.target.value);
        }}
        displayEmpty
        size="small"
        disabled={loading}
        renderValue={(selected) => {
          console.log('[Relationship Filter] renderValue called with:', selected);
          if (isMultiple && Array.isArray(selected)) {
            if (selected.length === 0) return 'All';
            const labels = selected.map(id => {
              const option = options.find(opt => opt.id === id);
              const label = option ? option[filter.relation.labelField] : `ID: ${id}`;
              console.log(`[Relationship Filter] Label lookup: ${id} -> ${label}`);
              return label;
            });
            return labels.join(', ');
          } else if (selected) {
            const option = options.find(opt => opt.id === selected);
            const label = option ? option[filter.relation.labelField] : `ID: ${selected}`;
            console.log(`[Relationship Filter] Single label lookup: ${selected} -> ${label}`);
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
            console.log('[Relationship Filter] Rendering option:', opt);
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
    
    console.log('[Regular Filter] Rendering regular select:', {
      isMultiple,
      currentValue,
      optionsLength: filter.options.length
    });
    
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
  console.log('[Text Filter] Rendering text field');
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
    if (filter.multiple) {
      // For multi-select, ensure we start with an array
      setValue(Array.isArray(initialValue) ? initialValue : (initialValue ? [initialValue] : []));
    } else {
      // For single-select, use the value as-is
      setValue(initialValue ?? '');
    }
  }, [initialValue, filter.multiple]);

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
    <div 
      
    >
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
  const value = filters[filter.name] || (filter.multiple ? [] : '');
  let displayValue = '';

  console.log(`[Display Debug] ${filter.name}:`, { 
    value, 
    isArray: Array.isArray(value), 
    multiple: filter.multiple,
    type: typeof value,
    filterType: filter.type 
  });

  // Handle multi-select arrays
  if (filter.multiple && Array.isArray(value)) {
    if (value.length === 0) {
      displayValue = '';
    } else if (filter.type === 'select' && filter.options) {
      // Regular select options
      const labels = value.map(val => {
        const option = filter.options.find(opt => (opt.value || opt) === val);
        const label = option ? (option.label || option) : val;
        console.log(`[Label Lookup] ${val} -> ${label}`);
        return label;
      });
      displayValue = labels.join(', ');
    } else if (filter.type === 'relationship' && filter.relation) {
      // Relationship options - we need to fetch these or cache them
      // For now, show IDs - you might want to implement a lookup cache
      displayValue = value.map(id => `ID: ${id}`).join(', ');
      console.log(`[Relationship Display] Showing IDs for now:`, displayValue);
    } else {
      displayValue = value.join(', ');
    }
  } 
  // Handle single-select values
  else if (!filter.multiple && filter.type === 'select' && filter.options) {
    const selectedOption = filter.options.find(opt => (opt.value || opt) === value);
    displayValue = selectedOption ? (selectedOption.label || selectedOption) : value;
  }
  // Handle single relationship values
  else if (!filter.multiple && filter.type === 'relationship' && value) {
    // For single relationship, show ID for now
    displayValue = `ID: ${value}`;
    console.log(`[Single Relationship Display] Showing ID for now:`, displayValue);
  }
  // Handle string values that should be arrays (fallback)
  else if (filter.multiple && typeof value === 'string' && value.includes(',')) {
    console.log(`[Fallback] Converting string to array: ${value}`);
    const arrayValue = value.split(',').map(v => v.trim());
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
    displayValue = value;
  }

  // Truncate long display values
  const maxDisplayLength = 30;
  const truncatedDisplayValue = displayValue && displayValue.length > maxDisplayLength 
    ? displayValue.substring(0, maxDisplayLength) + '...' 
    : displayValue;

  console.log(`[Final Display] ${filter.name}: "${truncatedDisplayValue}"`);

  return (
    <FilterButton
      key={filter.name}
      displayValue={truncatedDisplayValue}
      label={filter.label}
      value={value}
      onFilterApply={(newValue) => {
        console.log(`[Filter Apply] ${filter.name}:`, newValue);
        onChange({ ...filters, [filter.name]: newValue });
      }}
      onFilterDelete={() => {
        console.log(`[Filter Delete] ${filter.name}`);
        onChange({ ...filters, [filter.name]: filter.multiple ? [] : '' });
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