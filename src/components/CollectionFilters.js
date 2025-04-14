'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Tabs, Tab, Divider, Stack, Button, Typography, Select, MenuItem
} from '@mui/material';
import { FilterButton, FilterPopover, useFilterContext } from '@/components/core/filter-button';
import { Option } from '@/components/core/option';
import { useCollectionSelection } from '@/components/CollectionSelectionContext';
import { DeleteSelectedButton } from '@/components/core/delete-selected-button';


function TextFilterPopover({ label }) {
  const { anchorEl, onApply, onClose, open, value: initialValue } = useFilterContext();
  const [value, setValue] = React.useState('');

  React.useEffect(() => {
    setValue(initialValue ?? '');
  }, [initialValue]);

  return (
    <FilterPopover anchorEl={anchorEl} onClose={onClose} open={open} title={`Filter by ${label}`}>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyUp={(e) => e.key === 'Enter' && onApply(value)}
      />
      <Button onClick={() => onApply(value)} variant="contained">Apply</Button>
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

  const tabFilter = config.filters.find((f) => f.type === 'tab');
  const otherFilters = config.filters.filter((f) => f.type !== 'tab');
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

      <Stack direction="row" spacing={2} sx={{ px: 3, py: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <Stack direction="row" spacing={2} sx={{ flex: '1 1 auto', flexWrap: 'wrap' }}>
          {otherFilters.map((filter) => (
            <FilterButton
              key={filter.name}
              displayValue={filters[filter.name]}
              label={filter.label}
              value={filters[filter.name]}
              onFilterApply={(value) => onChange({ ...filters, [filter.name]: value })}
              onFilterDelete={() => onChange({ ...filters, [filter.name]: '' })}
              popover={<TextFilterPopover label={filter.label} />}
            />
          ))}

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

        {config.sortOptions?.length > 0 && (
          <Select
            value={sortDir}
            onChange={(e) => onSortChange?.(e.target.value)}
            size="small"
            sx={{ width: 140 }}
          >
            {config.sortOptions.map((opt) => (
              <Option key={opt.value} value={opt.value}>
                {opt.label}
              </Option>
            ))}
          </Select>
        )}
      </Stack>

    </div>
  );
}
