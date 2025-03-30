"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import OutlinedInput from "@mui/material/OutlinedInput";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";

import { DeleteSelectedButton } from "@/components/core/delete-selected-button";
import { paths } from "@/paths";
import { FilterButton, FilterPopover, useFilterContext } from "@/components/core/filter-button";
import { Option } from "@/components/core/option";
import { useCompaniesSelection } from "./company-selection-context";

// These tab counts are static for now – consider passing dynamic counts as props
const tabs = [
  { label: "All", value: "", count: 5 },
  { label: "Maintenance", value: "maintained", count: 2 },
  { label: "Active", value: "active", count: 1 },
  { label: "External", value: "external", count: 1 },
  { label: "Archived", value: "archived", count: 1 },
];

export function CompaniesFilters({ filters = {}, sortDir = "desc" }) {
  const { title, status } = filters;
  const router = useRouter();
  const selection = useCompaniesSelection();

  const updateSearchParams = React.useCallback(
    (newFilters, newSortDir) => {
      const searchParams = new URLSearchParams();

      if (newSortDir === "asc") {
        searchParams.set("sortDir", newSortDir);
      }

      if (newFilters.title?.trim()) {
        searchParams.set("title", newFilters.title.trim());
      }

      if (newFilters.status?.trim()) {
        searchParams.set("status", newFilters.status.trim());
      }

      router.push(`${paths.dashboard.companies.list}?${searchParams.toString()}`);
    },
    [router]
  );

  const handleSortChange = React.useCallback(
    (event) => {
      updateSearchParams(filters, event.target.value);
    },
    [updateSearchParams, filters]
  );

  const handleClearFilters = React.useCallback(() => {
    updateSearchParams({}, sortDir);
  }, [updateSearchParams, sortDir]);

  const handleTitleChange = React.useCallback(
    (value = "") => {
      updateSearchParams(
        {
          title: value,
          status: filters.status || "",
        },
        sortDir
      );
    },
    [updateSearchParams, filters.status, sortDir]
  );

  const handleStatusChange = React.useCallback(
    (value = "") => {
      updateSearchParams(
        {
          title: filters.title || "",
          status: value,
        },
        sortDir
      );
    },
    [updateSearchParams, filters.title, sortDir]
  );

  const hasFilters = !!title || !!status;

  return (
    <div>
      <Tabs
        sx={{ px: 3 }}
        value={status ?? ""}
        onChange={(event, value) => handleStatusChange(value)}
        variant="scrollable"
      >
        {tabs.map((tab) => (
          <Tab
            key={tab.value}
            value={tab.value}
            label={tab.label}
            icon={<Chip label={tab.count} size="small" variant="soft" />}
            iconPosition="end"
            sx={{ minHeight: "auto" }}
          />
        ))}
      </Tabs>

      <Divider />

      <Stack
        direction="row"
        spacing={2}
        sx={{ alignItems: "center", flexWrap: "wrap", px: 3, py: 2 }}
      >
        <Stack
          direction="row"
          spacing={2}
          sx={{ alignItems: "center", flex: "1 1 auto", flexWrap: "wrap" }}
        >
          <FilterButton
            displayValue={title}
            label="Name"
            onFilterApply={(value) => handleTitleChange(value)}
            onFilterDelete={() => handleTitleChange()}
            popover={<TitleFilterPopover />}
            value={title}
          />

          {hasFilters ? <Button onClick={handleClearFilters}>Clear filters</Button> : null}
        </Stack>

        {selection.selectedAny ? (
          <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
            <Typography color="text.secondary" variant="body2">
              {selection.selected.size} selected
            </Typography>
            <DeleteSelectedButton
              selection={selection}
              tableName="company"
              entityLabel="company"
            />
          </Stack>
        ) : null}

        <Select
          title="sort"
          onChange={handleSortChange}
          sx={{ maxWidth: "100%", width: "120px" }}
          value={sortDir}
        >
          <Option value="desc">Newest</Option>
          <Option value="asc">Oldest</Option>
        </Select>
      </Stack>
    </div>
  );
}

function TitleFilterPopover() {
  const { anchorEl, onApply, onClose, open, value: initialValue } = useFilterContext();
  const [value, setValue] = React.useState("");

  React.useEffect(() => {
    setValue(initialValue ?? "");
  }, [initialValue]);

  return (
    <FilterPopover anchorEl={anchorEl} onClose={onClose} open={open} title="Filter by title">
      <FormControl>
        <OutlinedInput
          onChange={(event) => setValue(event.target.value)}
          onKeyUp={(event) => {
            if (event.key === "Enter") {
              onApply(value);
            }
          }}
          value={value}
        />
      </FormControl>
      <Button onClick={() => onApply(value)} variant="contained">
        Apply
      </Button>
    </FilterPopover>
  );
}
