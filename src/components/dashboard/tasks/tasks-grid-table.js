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
import { useTasksSelection } from "./tasks-selection-context"; // optional, similar to companies-selection-context

const columns = [
  {
    name: "title",
    title: "Title",
    width: "300px",
    formatter: (row) => (
      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
        <Avatar src={row.author?.avatar || ""} />
        <div>
          <Link
            color="inherit"
            component={RouterLink}
            href={`/dashboard/tasks/${row.id}`}
 // make sure this route exists
            sx={{ whiteSpace: "nowrap" }}
            variant="subtitle2"
          >
            {row.title}
          </Link>
          <Typography color="text.secondary" variant="body2">
            {row.description || "No description"}
          </Typography>
        </div>
      </Stack>
    ),
  },
  {
    name: "status",
    title: "Status",
    width: "140px",
    formatter: (row) => {
      const status =
        row.columnId === "COL-001"
          ? "Todo"
          : row.columnId === "COL-002"
          ? "In Progress"
          : "Done";
      return <Typography variant="body2">{status}</Typography>;
    },
  },
  {
    name: "due_date",
    title: "Due Date",
    width: "140px",
    formatter: (row) =>
      row.due_date ? (
        <Typography variant="body2">{row.due_date.toLocaleDateString()}</Typography>
      ) : (
        "—"
      ),
  },
  {
    name: "assignees",
    title: "Assignees",
    width: "200px",
    formatter: (row) =>
      row.assignees?.length > 0 ? (
        <Typography variant="body2">
          {row.assignees.map((a) => a.name || a.email).join(", ")}
        </Typography>
      ) : (
        "—"
      ),
  },
  {
    name: "actions",
    title: "Actions",
    hideName: true,
    width: "80px",
    align: "right",
    formatter: (row) => (
      <IconButton
        component={RouterLink}
        href={`/dashboard/tasks/${row.id}`}
 // Edit page route
        aria-label="Edit task"
      >
        <PencilSimpleIcon />
      </IconButton>
    ),
  },
];

export function TasksGridTable({ rows }) {
  // Optional selection context — only if you want bulk selection
  const {
    selected,
    selectOne,
    deselectOne,
    selectAll,
    deselectAll,
  } = useTasksSelection?.() || {};

  return (
    <>
      <DataTable
        columns={columns}
        rows={rows}
        selectable={!!selectAll}
        selected={selected}
        onSelectOne={(_, row) => selectOne?.(row.id)}
        onDeselectOne={(_, row) => deselectOne?.(row.id)}
        onSelectAll={selectAll}
        onDeselectAll={deselectAll}
        uniqueRowId={(row) => row.id}
      />
      {rows.length === 0 && (
        <Box sx={{ p: 3 }}>
          <Typography color="text.secondary" sx={{ textAlign: "center" }} variant="body2">
            No tasks found
          </Typography>
        </Box>
      )}
    </>
  );
}
