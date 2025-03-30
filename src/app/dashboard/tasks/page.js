"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import { Plus as PlusIcon } from "@phosphor-icons/react/dist/ssr/Plus";

import { createClient } from "@/lib/supabase/browser";
import { dayjs } from "@/lib/dayjs";

import { TasksProvider } from "@/components/dashboard/tasks/tasks-context";
import { TasksView } from "@/components/dashboard/tasks/tasks-view";
import { TasksGridTable } from "@/components/dashboard/tasks/tasks-grid-table"; // <-- ✅ Add this

export default function Page() {
  const searchParams = useSearchParams();
  const title = searchParams.get("title") || "";
  const status = searchParams.get("status") || "";
  const sortDir = searchParams.get("sortDir") || "desc";

  const [tabIndex, setTabIndex] = useState(0); // 0 = Kanban, 1 = Grid
  const [tasks, setTasks] = useState([]);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);

      const supabase = createClient();

      const { data: tasksRaw, error } = await supabase.from("task").select(`
        id,
        title,
        description,
        status,
        due_date,
        createdAt,
        author:contact!task_authorId_fkey(*),
        assignees:contact_task(contact:contact!contact_task_assignedId_fkey(*)),
        subtasks,
        attachments,
        comments:comment(*, author:contact(*))
      `);

      if (error) {
        console.error("Error loading tasks:", error.message);
        setTasks([]);
        setColumns([]);
        return;
      }

      const baseColumns = [
        { id: "COL-001", name: "Todo", taskIds: [] },
        { id: "COL-002", name: "Progress", taskIds: [] },
        { id: "COL-003", name: "Done", taskIds: [] },
      ];

      const enrichedTasks = (tasksRaw || []).map((task) => {
        const columnId =
          task.status === "Todo"
            ? "COL-001"
            : task.status === "Progress"
            ? "COL-002"
            : "COL-003";

        const assignees = (task.assignees || []).map((entry) => entry.contact);

        const col = baseColumns.find((col) => col.id === columnId);
        if (col) col.taskIds.push(task.id);

        return {
          id: task.id,
          title: task.title,
          description: task.description,
          columnId,
          createdAt: dayjs(task.createdAt ?? task.created_at).toDate(),
          due_date: task.due_date ? dayjs(task.due_date).toDate() : null,
          author: task.author,
          assignees,
          labels: [],
          subscribed: false,
          subtasks: task.subtasks || [],
          attachments: task.attachments || [],
          comments: (task.comments || []).map((c) => ({
            id: c.id,
            content: c.content,
            createdAt: dayjs(c.created_at).toDate(),
            author: c.author,
          })),
        };
      });

      const sorted = applySort(enrichedTasks, sortDir);
      const filtered = applyFilters(sorted, { title, status });

      setTasks(filtered);
      setColumns(baseColumns);
      setLoading(false);
    };

    fetchTasks();
  }, [title, status, sortDir]);

  return (
    <Box
      sx={{
        maxWidth: "var(--Content-maxWidth)",
        m: "var(--Content-margin)",
        p: "var(--Content-padding)",
        width: "var(--Content-width)",
      }}
    >
      <Stack spacing={4}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={3} sx={{ alignItems: "flex-start" }}>
          <Box sx={{ flex: "1 1 auto" }}>
            <Typography variant="h4">Tasks</Typography>
          </Box>
          <Box>
            <Button
              component={Link}
              href="/dashboard/tasks/create"
              startIcon={<PlusIcon />}
              variant="contained"
            >
              Add Task
            </Button>
          </Box>
        </Stack>

        {/* Tabs */}
        <Tabs value={tabIndex} onChange={handleTabChange}>
          <Tab label="Kanban View" />
          <Tab label="Grid View" />
        </Tabs>

        {!loading && (
          <TasksProvider columns={columns} tasks={tasks}>
            {tabIndex === 0 ? (
              <TasksView />
            ) : (
              <Card>
                <Box sx={{ overflowX: "auto" }}>
                  <TasksGridTable rows={tasks} />
                </Box>
              </Card>
            )}
          </TasksProvider>
        )}
      </Stack>
    </Box>
  );
}

// Sorting logic
function applySort(rows, sortDir) {
  return rows.sort((a, b) => {
    if (sortDir === "asc") {
      return a.createdAt.getTime() - b.createdAt.getTime();
    }
    return b.createdAt.getTime() - a.createdAt.getTime();
  });
}

// Filtering logic
function applyFilters(rows, { title, status }) {
  return rows.filter((item) => {
    if (title && !item.title?.toLowerCase().includes(title.toLowerCase())) return false;
    if (status && item.status?.toLowerCase() !== status.toLowerCase()) return false;
    return true;
  });
}
