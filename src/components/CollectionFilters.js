'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Tabs, Tab, Divider, Stack, Button, Typography, Select, MenuItem, TextField
} from '@mui/material';
import { FilterButton, FilterPopover, useFilterContext } from '@/components/core/filter-button';
import { useCollectionSelection } from '@/components/CollectionSelectionContext';
import { DeleteSelectedButton } from '@/components/core/delete-selected-button';
import { createClient } from '@/lib/supabase/browser';

const supabase = createClient();

function FilterPopoverContent({ filter, value, setValue }) {
  const [options, setOptions] = useState([]);

  useEffect(() => {
    const fetchOptions = async () => {
      if (filter.type === 'relationship' && filter.relation?.table && filter.relation?.labelField) {
        let query = supabase.from(filter.relation.table).select(`id, ${filter.relation.labelField}`);
        const relationFilter = filter.relation.filter || {};
        Object.entries(relationFilter).forEach(([key, val]) => {
          query = query.eq(key, val);
        });

        const { data, error } = await query;
        if (!error && data) {
          setOptions(data);
        }
      }
    };

    fetchOptions();
  }, [filter]);

  if (filter.type === 'relationship' && options.length) {
    return (
      <Select
        fullWidth
        value={value}
        onChange={(e) => setValue(e.target.value)}
        displayEmpty
        size="small"
      >
        <MenuItem value="">All</MenuItem>
        {options.map((opt) => (
          <MenuItem key={opt.id} value={opt.id}>
            {opt[filter.relation.labelField] || `Untitled (${opt.id})`}
          </MenuItem>
        ))}
      </Select>
    );
  }

  if (filter.options) {
    return (
      <Select
        fullWidth
        value={value}
        onChange={(e) => setValue(e.target.value)}
        displayEmpty
        size="small"
      >
        <MenuItem key="all" value="">All</MenuItem>
        {filter.options.map(opt => (
          <MenuItem key={opt.value || opt} value={opt.value || opt}>{opt.label || opt}</MenuItem>
        ))}
      </Select>
    );
  }

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
    setValue(initialValue ?? '');
  }, [initialValue]);

  return (
    <FilterPopover anchorEl={anchorEl} onClose={onClose} open={open} title={`Filter by ${label}`}>
      <Stack spacing={2}>
        <FilterPopoverContent filter={filter} value={value} setValue={setValue} />
        <Button variant="contained" onClick={() => onApply(value)}>Apply</Button>
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

      <Stack direction="row" spacing={2} sx={{ px: 3, py: 0, alignItems: 'center', flexWrap: 'wrap' }}>
        <Stack direction="row" spacing={2} sx={{ flex: '1 1 auto', flexWrap: 'wrap' }}>
        {otherFilters.map((filter) => {
  const value = filters[filter.name] || '';
  let displayValue = value;

  if (filter.type === 'select' && filter.options) {
    const selectedOption = filter.options.find(opt => opt.value === value);
    displayValue = selectedOption?.label || '';
  }

  return (
    <FilterButton
      key={filter.name}
      displayValue={displayValue}
      label={filter.label}
      value={value}
      onFilterApply={(newValue) => {
        onChange({ ...filters, [filter.name]: newValue }); // <- ALWAYS pass full string like 'due_date:desc'
      }}
      onFilterDelete={() => onChange({ ...filters, [filter.name]: '' })}
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