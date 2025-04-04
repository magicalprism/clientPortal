"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Button from "@mui/material/Button";
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
import { useTasksSelection } from "./task-selection-context";

// Static tab options
const tabs = [
  { label: "Due Today", value: "today" },
  { label: "Due Soon", value: "soon" },
  { label: "All Upcoming", value: "all" },
  { label: "Archived", value: "archived" },
];

export function TasksFilters({ filters = {}, sortDir = "desc" }) {
  const { title, status } = filters;
  const router = useRouter();
  const selection = useTasksSelection();

  // Update URL query params
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

      router.push(`${paths.dashboard.tasks.list}?${searchParams.toString()}`);
    },
    [router]
  );

  const handleSortChange = (event) => {
    updateSearchParams(filters, event.target.value);
  };

  const handleClearFilters = () => {
    updateSearchParams({}, sortDir);
  };

  const handleChange = (key, value = "") => {
    updateSearchParams(
      {
        ...filters,
        [key]: value,
      },
      sortDir
    );
  };

  const hasFilters = !!title || !!status;

  // Ensure tab value is valid
  const tabValue = tabs.some((tab) => tab.value === status) ? status : tabs[0].value;

  return (
    <div>
      <Tabs
        sx={{ px: 3 }}
        value={tabValue}
        onChange={(e, value) => handleChange("status", value)}
        variant="scrollable"
      >
        {tabs.map((tab) => (
          <Tab
            key={tab.value}
            value={tab.value}
            label={tab.label}
            iconPosition="end"
            sx={{ minHeight: "auto" }}
          />
        ))}
      </Tabs>

      <Divider />

      <Stack direction="row" spacing={2} sx={{ alignItems: "center", flexWrap: "wrap", px: 3, py: 2 }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: "center", flex: "1 1 auto", flexWrap: "wrap" }}>
          <FilterButton
            displayValue={title}
            label="Name"
            onFilterApply={(value) => handleChange("title", value)}
            onFilterDelete={() => handleChange("title")}
            popover={<TextFilterPopover label="Name" />}
            value={title}
          />

          {hasFilters && <Button onClick={handleClearFilters}>Clear filters</Button>}
        </Stack>

        {selection.selectedAny && (
          <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
            <Typography color="text.secondary" variant="body2">
              {selection.selected.size} selected
            </Typography>
            <DeleteSelectedButton
              selection={selection}
              tableName="task"
              entityLabel="task"
            />
          </Stack>
        )}

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

// Generic popover filter for text input
function TextFilterPopover({ label }) {
  const { anchorEl, onApply, onClose, open, value: initialValue } = useFilterContext();
  const [value, setValue] = React.useState("");

  React.useEffect(() => {
    setValue(initialValue ?? "");
  }, [initialValue]);

  return (
    <FilterPopover anchorEl={anchorEl} onClose={onClose} open={open} title={`Filter by ${label}`}>
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
