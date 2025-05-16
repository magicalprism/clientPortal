'use client';

import React, { useMemo, useState } from 'react';
import {
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  IconButton,
  TextField
} from '@mui/material';
import { X } from '@phosphor-icons/react';
import CollectionItem from './CollectionItem';

const CollectionGridView = ({ items = [], field = {}, onFilterChange }) => {
  const filters = field.filters || [];
  const sortOptions = field.sortOptions || [];

  const [activeFilters, setActiveFilters] = useState({});
  const [sortValue, setSortValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const availableOptions = useMemo(() => {
    const options = {};
    filters.forEach(({ name }) => {
      const values = new Set();
      items.forEach(item => {
        const val = item?.[name];
        if (val !== undefined && val !== null) values.add(val);
      });
      options[name] = Array.from(values).sort();
    });
    return options;
  }, [items, filters]);

  const handleFilterChange = (fieldName, value) => {
    const updated = { ...activeFilters, [fieldName]: value };
    setActiveFilters(updated);
    onFilterChange?.(updated);
  };

  const filteredItems = useMemo(() => {
    let result = items;

    // apply filters
    filters.forEach(({ name }) => {
      const val = activeFilters[name];
      if (val) result = result.filter((item) => item?.[name] === val);
    });

    // apply search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((item) =>
        (item?.title || '').toLowerCase().includes(q) ||
        (item?.description || '').toLowerCase().includes(q)
      );
    }

    return result;
  }, [items, filters, activeFilters, searchQuery]);

  const sortedItems = useMemo(() => {
    if (!sortValue) return filteredItems;

    const [sortField, direction] = sortValue.split(':');
    return [...filteredItems].sort((a, b) => {
      const aVal = a?.[sortField];
      const bVal = b?.[sortField];

      if (aVal === undefined || bVal === undefined) return 0;

      if (typeof aVal === 'string') {
        return direction === 'desc'
          ? bVal.localeCompare(aVal)
          : aVal.localeCompare(bVal);
      }

      if (aVal instanceof Date || typeof aVal === 'number') {
        return direction === 'desc' ? bVal - aVal : aVal - bVal;
      }

      return 0;
    });
  }, [filteredItems, sortValue]);

  const handleClear = () => {
    setActiveFilters({});
    setSearchQuery('');
    setSortValue('');
    onFilterChange?.({});
  };

  return (
    <Box>
      {(filters.length > 0 || sortOptions.length > 0) && (
        <Stack direction="row" spacing={2} sx={{ mb: 2, flexWrap: 'wrap' }}>
          {filters.map(({ name, label }) => (
            <FormControl size="small" sx={{ minWidth: 160 }} key={name}>
              <InputLabel>{label || name}</InputLabel>
              <Select
                value={activeFilters[name] || ''}
                label={label || name}
                onChange={(e) => handleFilterChange(name, e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                {(availableOptions[name] || []).map((val) => (
                  <MenuItem key={val} value={val}>
                    {val}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ))}

          {sortOptions.length > 0 && (
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Sort</InputLabel>
              <Select
                value={sortValue}
                label="Sort"
                onChange={(e) => setSortValue(e.target.value)}
              >
                <MenuItem value="">None</MenuItem>
                {sortOptions.map(({ value, label }) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

         <FormControl size="small" sx={{ minWidth: 200 }} variant="outlined">
            <InputLabel htmlFor="search-input" shrink sx={{ mb: 1 }}>
                Search
            </InputLabel>
            <TextField
                id="search-input"
                size="small"
                variant="outlined"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type here"
                InputLabelProps={{ shrink: true }}
                fullWidth
            />
            </FormControl>

           

          {(Object.values(activeFilters).some(Boolean) || searchQuery || sortValue) && (
            <IconButton onClick={handleClear} sx={{ mt: '2px' }}>
              <X />
            </IconButton>
          )}


        </Stack>
      )}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: 2,
        }}
      >
        {sortedItems.map((item) => (
          <CollectionItem key={item.id} item={item} />
        ))}
      </Box>
    </Box>
  );
};

export default CollectionGridView;
