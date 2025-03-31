"use client";

import * as React from "react";
import OutlinedInput from "@mui/material/OutlinedInput";
import { CalendarContext } from "@/components/dashboard/calendar/calendar-context";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Tabs,
  Tab,
  Chip,
  Stack,
  Divider,
  Button,
} from "@mui/material";
import { FilterButton, FilterPopover, useFilterContext } from "@/components/core/filter-button";
import { Option } from "@/components/core/option";

const tabs = [
  { label: "All", value: "all" }, // you can update counts dynamically later
  { label: "Meeting", value: "Meeting" },
  { label: "Task", value: "Task" },
  { label: "Reminder", value: "Reminder" },
];

export function CalendarFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get("type") || "all";
  const title = searchParams.get("title") || "";
  const { events } = React.useContext(CalendarContext);
  const allEvents = [...events.values()];

  const typeCounts = allEvents.reduce(
    (acc, event) => {
      const type = event.type || "Other";
      acc[type] = (acc[type] || 0) + 1;
      acc["all"] += 1;
      return acc;
    },
    { all: 0 }
  );
  

  const updateSearchParams = (params = {}) => {
    const sp = new URLSearchParams();

    if (params.type) sp.set("type", params.type);
    if (params.title) sp.set("title", params.title);

    router.push(`?${sp.toString()}`);
  };

  const handleTypeChange = (event, value) => {
    updateSearchParams({ type: value, title });
  };

  const handleTitleChange = (val = "") => {
    updateSearchParams({ type, title: val });
  };

  const handleClearFilters = () => {
    updateSearchParams({ type: "all", title: "" });
  };

  const hasFilters = !!title && title.trim() !== "";

  return (
    <>
      <Tabs
        sx={{ px: 3 }}
        value={type}
        onChange={handleTypeChange}
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

      <Stack
        direction="row"
        spacing={2}
        sx={{ alignItems: "center", flexWrap: "wrap", px: 3, py: 2 }}
      >
        <FilterButton
          displayValue={title}
          label="Title"
          onFilterApply={handleTitleChange}
          onFilterDelete={() => handleTitleChange("")}
          popover={<TitleFilterPopover />}
          value={title}
        />

        {hasFilters && (
          <Button onClick={handleClearFilters}>Clear filters</Button>
        )}
      </Stack>
    </>
  );
}

function TitleFilterPopover() {
  const { anchorEl, onApply, onClose, open, value: initialValue } = useFilterContext();
  const [value, setValue] = React.useState("");

  React.useEffect(() => {
    setValue(initialValue || "");
  }, [initialValue]);

  return (
    <FilterPopover anchorEl={anchorEl} onClose={onClose} open={open} title="Filter by title">
      <OutlinedInput
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyUp={(e) => {
          if (e.key === "Enter") onApply(value);
        }}
        fullWidth
        sx={{ mb: 2 }}
      />
      <Button onClick={() => onApply(value)} variant="contained">
        Apply
      </Button>
    </FilterPopover>
  );
}
