"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Button from "@mui/material/Button"
import Chip from "@mui/material/Chip"
import Divider from "@mui/material/Divider"
import FormControl from "@mui/material/FormControl"
import OutlinedInput from "@mui/material/OutlinedInput"
import Select from "@mui/material/Select"
import Stack from "@mui/material/Stack"
import Tab from "@mui/material/Tab"
import Tabs from "@mui/material/Tabs"
import Typography from "@mui/material/Typography"

import { paths } from "@/paths"
import { Option } from "@/components/core/option"
import { FilterButton, FilterPopover, useFilterContext } from "@/components/core/filter-button"

const tabs = [
  { label: "All", value: "", count: 5 },
  { label: "HR", value: "hr", count: 2 },
  { label: "Tech", value: "tech", count: 1 },
  { label: "Admin", value: "admin", count: 1 },
  { label: "Archived", value: "archived", count: 1 },
]

export function OnboardingFilters({ filters = {}, sortDir = "desc" }) {
  const { fieldName, title, project } = filters
  const router = useRouter()

  const updateSearchParams = React.useCallback(
    (newFilters, newSortDir) => {
      const searchParams = new URLSearchParams()

      if (newSortDir === "asc") {
        searchParams.set("sortDir", newSortDir)
      }

      if (newFilters.fieldName?.trim()) {
        searchParams.set("field", newFilters.fieldName.trim())
      }

      if (newFilters.title?.trim()) {
        searchParams.set("title", newFilters.title.trim())
      }

      if (newFilters.project?.trim()) {
        searchParams.set("project_id", newFilters.project.trim())
      }

      router.push(`${paths.dashboard.onboarding.list}?${searchParams.toString()}`)
    },
    [router]
  )

  const handleSortChange = (event) => {
    updateSearchParams(filters, event.target.value)
  }

  const handleClearFilters = () => {
    updateSearchParams({}, sortDir)
  }

  const handleChange = (key, value = "") => {
    updateSearchParams(
      {
        ...filters,
        [key]: value,
      },
      sortDir
    )
  }

  const hasFilters = !!fieldName || !!title || !!project

  return (
    <div>
      <Tabs
        sx={{ px: 3 }}
        value={filters.status ?? ""}
        onChange={(e, value) => handleChange("status", value)}
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

      <Stack direction="row" spacing={2} sx={{ alignItems: "center", flexWrap: "wrap", px: 3, py: 2 }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: "center", flex: "1 1 auto", flexWrap: "wrap" }}>
          <FilterButton
            displayValue={fieldName}
            label="Field"
            onFilterApply={(value) => handleChange("fieldName", value)}
            onFilterDelete={() => handleChange("fieldName")}
            popover={<TextFilterPopover label="Field" />}
            value={fieldName}
          />

          <FilterButton
            displayValue={title}
            label="Title"
            onFilterApply={(value) => handleChange("title", value)}
            onFilterDelete={() => handleChange("title")}
            popover={<TextFilterPopover label="Title" />}
            value={title}
          />

          <FilterButton
            displayValue={project}
            label="Project"
            onFilterApply={(value) => handleChange("project", value)}
            onFilterDelete={() => handleChange("project")}
            popover={<TextFilterPopover label="Project" />}
            value={project}
          />

          {hasFilters && <Button onClick={handleClearFilters}>Clear filters</Button>}
        </Stack>

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
  )
}

function TextFilterPopover({ label }) {
  const { anchorEl, onApply, onClose, open, value: initialValue } = useFilterContext()
  const [value, setValue] = React.useState("")

  React.useEffect(() => {
    setValue(initialValue ?? "")
  }, [initialValue])

  return (
    <FilterPopover anchorEl={anchorEl} onClose={onClose} open={open} title={`Filter by ${label}`}>
      <FormControl>
        <OutlinedInput
          onChange={(event) => setValue(event.target.value)}
          onKeyUp={(event) => {
            if (event.key === "Enter") {
              onApply(value)
            }
          }}
          value={value}
        />
      </FormControl>
      <Button onClick={() => onApply(value)} variant="contained">
        Apply
      </Button>
    </FilterPopover>
  )
}
