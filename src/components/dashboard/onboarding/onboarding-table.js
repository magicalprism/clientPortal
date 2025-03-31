"use client"

import * as React from "react"
import RouterLink from "next/link"
import Avatar from "@mui/material/Avatar"
import Box from "@mui/material/Box"
import Chip from "@mui/material/Chip"
import IconButton from "@mui/material/IconButton"
import Typography from "@mui/material/Typography"
import Stack from "@mui/material/Stack"
import Link from "@mui/material/Link"

import { PencilSimple as PencilSimpleIcon } from "@phosphor-icons/react/dist/ssr/PencilSimple"
import { CheckCircle as CheckCircleIcon } from "@phosphor-icons/react/dist/ssr/CheckCircle"
import { Minus as MinusIcon } from "@phosphor-icons/react/dist/ssr/Minus"

import { paths } from "@/paths"
import { DataTable } from "@/components/core/data-table"
import { useOnboardingSelection } from "../onboarding/onboarding-selection-context" // Consider renaming to useOnboardingSelection
import { dayjs } from "@/lib/dayjs"

const columns = [
  {
    formatter: (row) => (
      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
        <Avatar>{row.title?.[0]}</Avatar>
        <div>
          <Link
            color="inherit"
            component={RouterLink}
            href={paths.dashboard.onboarding.details(row.id)}
            sx={{ whiteSpace: "nowrap" }}
            variant="subtitle2"
          >
            {row.title}
          </Link>
          <Typography color="text.secondary" variant="body2">
            {row.value}
          </Typography>
        </div>
      </Stack>
    ),
    title: "Onboarding Form",
    width: "300px",
  },
  {
    field: "title",
    title: "Form Title",
    width: "200px",
  },
  {
    field: "project_id",
    title: "Project",
    width: "150px",
  },
 
  {
    formatter: (row) => {
      const statusMap = {
        active: {
          label: "Approved",
          icon: <CheckCircleIcon color="var(--mui-palette-success-main)" weight="fill" />,
        },
        archived: {
          label: "In Progress",
          icon: <MinusIcon color="var(--mui-palette-error-main)" />,
        },
      }

      const fallback = { label: "Unknown", icon: null }
      const { label, icon } = statusMap[row.status] ?? fallback

      return <Chip icon={icon} label={label} size="small" variant="outlined" />
    },
    field: "status",
    title: "Status",
    width: "150px",
  },
  {
    formatter: (row) => (
      <IconButton
        component={RouterLink}
        href={paths.dashboard.onboarding.details(row.id)}
      >
        <PencilSimpleIcon />
      </IconButton>
    ),
    title: "Actions",
    hideName: true,
    width: "100px",
    align: "right",
  },
]

export function OnboardingTable({ rows }) {
  const {
    deselectAll,
    deselectOne,
    selectAll,
    selectOne,
    selected,
  } = useOnboardingSelection() // Can rename to useOnboardingSelection for clarity

  return (
    <>
      <DataTable
        columns={columns}
        rows={rows}
        selectable
        selected={selected}
        onSelectAll={selectAll}
        onSelectOne={(_, row) => selectOne(row.id)}
        onDeselectAll={deselectAll}
        onDeselectOne={(_, row) => deselectOne(row.id)}
      />
      {rows.length === 0 && (
        <Box sx={{ p: 3 }}>
          <Typography color="text.secondary" sx={{ textAlign: "center" }} variant="body2">
            No onboarding entries found
          </Typography>
        </Box>
      )}
    </>
  )
}
