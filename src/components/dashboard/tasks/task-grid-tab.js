"use client";

import * as React from "react";

import { TasksSelectionProvider } from "@/components/dashboard/tasks/task-selection-context";
import { TasksFilters } from "@/components/dashboard/tasks/task-filters";
import { TasksTable } from "@/components/dashboard/tasks/tasks-grid-table";
import { TasksPagination } from "@/components/dashboard/tasks/task-pagination";
import { Card, Divider, Box } from "@mui/material";

export function TaskGridTab({ tasks, filters, sortDir }) {
  return (
    <TasksSelectionProvider tasks={tasks}>
      <Card>
        <TasksFilters filters={filters} sortDir={sortDir} />
        <Divider />
        <Box sx={{ overflowX: "auto" }}>
          <TasksTable rows={tasks} />
        </Box>
        <Divider />
        <TasksPagination count={tasks.length} page={0} />
      </Card>
    </TasksSelectionProvider>
  );
}
