"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Chip,
  Divider,
  Select,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";

import { paths } from "@/paths";
import { DeleteSelectedButton } from "@/components/core/delete-selected-button";
import { useOnboardingSelection } from "./onboarding-selection-context";
import { FilterButton } from "@/components/core/filter-button";

const statusTabs = [
  { label: "All", value: "", count: 5 },
  { label: "Approved", value: "approved", count: 2 },
  { label: "In Progress", value: "inProgress", count: 3 },
];

export function OnboardingFilters({ filters = {}, sortDir = "desc" }) {
  const { title, project, status } = filters;
  const router = useRouter();
  const selection = useOnboardingSelection();

  const updateSearchParams = (newFilters, newSortDir = sortDir) => {
    const params = new URLSearchParams();

    if (newSortDir === "asc") params.set("sortDir", newSortDir);
    if (newFilters.title?.trim()) params.set("title", newFilters.title.trim());
    if (newFilters.project?.trim()) params.set("project_id", newFilters.project.trim());
    if (newFilters.status?.trim()) params.set("status", newFilters.status.trim());

    router.push(`${paths.dashboard.onboarding.list}?${params.toString()}`);
  };

  const handleChange = (key, value) => {
    updateSearchParams({ ...filters, [key]: value });
  };

  const handleSortChange = (event) => {
    updateSearchParams(filters, event.target.value);
  };

  const handleClear = () => updateSearchParams({}, sortDir);

  return (
    <>
      <Tabs
        sx={{ px: 3 }}
        value={status || ""}
        onChange={(e, value) => handleChange("status", value)}
        variant="scrollable"
      >
        {statusTabs.map((tab) => (
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
          sx={{ flex: "1 1 auto", flexWrap: "wrap", alignItems: "center" }}
        >
          <FilterButton
            label="Title"
            value={title}
            displayValue={title}
            onFilterApply={(value) => handleChange("title", value)}
            onFilterDelete={() => handleChange("title", "")}
          />
          <FilterButton
            label="Project"
            value={project}
            displayValue={project}
            onFilterApply={(value) => handleChange("project", value)}
            onFilterDelete={() => handleChange("project", "")}
          />

          {(title || project || status) && (
            <Button onClick={handleClear}>Clear filters</Button>
          )}
        </Stack>

        {selection?.selectedAny && (
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="body2" color="text.secondary">
              {selection.selected.size} selected
            </Typography>
            <DeleteSelectedButton
              selection={selection}
              tableName="onboarding"
              entityLabel="entry"
            />
          </Stack>
        )}

        <Select
          value={sortDir}
          onChange={handleSortChange}
          sx={{ width: "120px" }}
        >
          <option value="desc">Newest</option>
          <option value="asc">Oldest</option>
        </Select>
      </Stack>
    </>
  );
}
