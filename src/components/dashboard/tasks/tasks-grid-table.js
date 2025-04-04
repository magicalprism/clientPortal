"use client";

import * as React from "react";
import RouterLink from "next/link";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import LinearProgress from "@mui/material/LinearProgress";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { CheckCircle as CheckCircleIcon } from "@phosphor-icons/react/dist/ssr/CheckCircle";
import { Clock as ClockIcon } from "@phosphor-icons/react/dist/ssr/Clock";
import { Minus as MinusIcon } from "@phosphor-icons/react/dist/ssr/Minus";
import { PencilSimple as PencilSimpleIcon } from "@phosphor-icons/react/dist/ssr/PencilSimple";
import Switch from "@mui/material/Switch";
import { createClient } from "@/lib/supabase/browser";

import { paths } from "@/paths";
import { dayjs } from "@/lib/dayjs";
import { DataTable } from "@/components/core/data-table";

import { useTasksSelection } from "./task-selection-context";

const columns = [
  {
    formatter: (row) => (
      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
        <Avatar src={row.avatar} />
        <div>
          <Link
            color="inherit"
            component={RouterLink}
            href={paths.dashboard.tasks.details(row.id)}
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
    field: "title",
    title: "Name",
    width: "250px",
  },
  {
    field: "due_date",
    title: "Due Date",
    width: "150px",
    formatter: (row) => {
      if (!row.due_date) {
        return (
          <Typography variant="body2" color="text.secondary">
            No due date
          </Typography>
        );
      }
  
      const date = dayjs(row.due_date);
      return (
        <Typography variant="body2">
          {date.format("MMM D, YYYY")}
        </Typography>
      );
    },
  },

  
  {
    formatter: (row) => {
        console.log("STATUS DEBUG:", row.status); // <-- add this
      
        const mapping = {
          todo: {
            label: "To Do",
            icon: <CheckCircleIcon color="var(--mui-palette-success-main)" weight="fill" />,
          },
          in_progress: {
            label: "In Progress",
            icon: <CheckCircleIcon color="var(--mui-palette-warning-main)" weight="fill" />,
          },
          complete: {
            label: "Complete",
            icon: <MinusIcon color="var(--mui-palette-error-main)" />,
          },
        };
      
        const { label, icon } = mapping[row.status] ?? { label: "Unknown", icon: null };
      
        return <Chip icon={icon} label={label} size="small" variant="outlined" />;
      
      },
      
    field: "status",
    title: "Status",
    width: "150px",
  },
  {
    title: "Done",
    field: "status_toggle",
    width: "75px",
    formatter: (row) => {
      const supabase = createClient();
      const [checked, setChecked] = React.useState(row.status === "complete");
      const [loading, setLoading] = React.useState(false);
  
      const handleToggle = async () => {
        setLoading(true);
  
        const newStatus = checked ? "todo" : "complete"; // 👈 back to "todo" if unchecked
        setChecked(!checked);
  
        const { error } = await supabase
          .from("task")
          .update({ status: newStatus })
          .eq("id", row.id);
  
        if (error) {
          console.error("Failed to update task status:", error.message);
          setChecked(checked); // revert on error
        }
  
        setLoading(false);
      };
  
      return (
        <Switch
          checked={checked}
          onChange={handleToggle}
          color="success"
          disabled={loading}
          size="small"
        />
      );
    },
  },
  {
    formatter: (row) => (
      <IconButton
        component={RouterLink}
        href={paths.dashboard.tasks.details(row.id)}
      >
        <PencilSimpleIcon />
      </IconButton>
    ),
    title: "Edit",
    width: "100px",
    align: "right",
  },
  
];

export function TasksTable({ rows }) {
  const { deselectAll, deselectOne, selectAll, selectOne, selected } =
    useTasksSelection();

  return (
    <React.Fragment>
      <DataTable
        columns={columns}
        onDeselectAll={deselectAll}
        onDeselectOne={(_, row) => {
          deselectOne(row.id);
        }}
        onSelectAll={selectAll}
        onSelectOne={(_, row) => {
          selectOne(row.id);
        }}
        rows={rows}
        selectable
        selected={selected}
      />
      {rows.length === 0 ? (
        <Box sx={{ p: 3 }}>
          <Typography
            color="text.secondary"
            sx={{ textAlign: "center" }}
            variant="body2"
          >
            No tasks found
          </Typography>
        </Box>
      ) : null}
    </React.Fragment>
  );
}
