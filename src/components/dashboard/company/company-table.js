"use client";

import * as React from "react";
import RouterLink from "next/link";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { PencilSimple as PencilSimpleIcon } from "@phosphor-icons/react/dist/ssr/PencilSimple";

import { paths } from "@/paths";
import { DataTable } from "@/components/core/data-table";
import { useCompaniesSelection } from "./company-selection-context";

const columns = [
  {
    name: "title",
    title: "Name",
    width: "250px",
    formatter: (row) => (
      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
        <Avatar src={row.avatar} />
        <div>
          <Link
            color="inherit"
            component={RouterLink}
            href={paths.dashboard.companies.details(row.id)}
            sx={{ whiteSpace: "nowrap" }}
            variant="subtitle2"
          >
            {row.title}
          </Link>
          <Typography color="text.secondary" variant="body2">
            {row.title}
          </Typography>
        </div>
      </Stack>
    ),
  },
  {
    name: "billing_email",
    field: "billing_email",
    title: "Billing Email",
    width: "200px",
  },
  {
    name: "actions",
    title: "Actions",
    hideName: true,
    width: "100px",
    align: "right",
    formatter: (row) => (
      <IconButton component={RouterLink} href={paths.dashboard.companies.details(row.id)}>
        <PencilSimpleIcon />
      </IconButton>
    ),
  },
];

export function CompaniesTable({ rows }) {
  const { deselectAll, deselectOne, selectAll, selectOne, selected } = useCompaniesSelection();

  return (
    <>
      <DataTable
        columns={columns}
        rows={rows}
        selectable
        selected={selected}
        onSelectOne={(_, row) => selectOne(row.id)}
        onDeselectOne={(_, row) => deselectOne(row.id)}
        onSelectAll={selectAll}
        onDeselectAll={deselectAll}
        uniqueRowId={(row) => row.id}
      />
      {rows.length === 0 && (
        <Box sx={{ p: 3 }}>
          <Typography color="text.secondary" sx={{ textAlign: "center" }} variant="body2">
            No companies found
          </Typography>
        </Box>
      )}
    </>
  );
}
