"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import { Plus as PlusIcon } from "@phosphor-icons/react/dist/ssr/Plus";

import { createClient } from "@/lib/supabase/browser";
import { dayjs } from "@/lib/dayjs";

import { TasksProvider } from "@/components/dashboard/tasks/tasks-context";
import { TaskGridTab } from "@/components/dashboard/tasks/task-grid-tab";
import { TaskKanbanTab } from "@/components/dashboard/tasks/task-kanban-tab";

export default function Page() {
  const searchParams = useSearchParams();
  const title = searchParams.get("title") || "";
  const status = searchParams.get("status") || "";
  const sortDir = searchParams.get("sortDir") || "desc";

  const [tabIndex, setTabIndex] = useState(0);
  const [tasks, setTasks] = useState([]);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  function getTaskFiltersFromStatus(status) {
    const now = dayjs();
    const startOfToday = now.startOf("day").toISOString();
    const startOfTomorrow = now.add(1, "day").startOf("day").toISOString();

    switch (status) {
      case "today":
        return { due_date: { lt: startOfTomorrow }, status: { neq: "complete" } };
      case "soon":
        return { due_date: { gte: startOfToday }, status: { neq: "complete" } };
      case "all":
        return { status: { neq: "complete" } };
      case "archived":
        return { status: { eq: "complete" } };
      default:
        return {};
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const supabase = createClient();
      const taskFilters = getTaskFiltersFromStatus(status);

      console.log("🔄 Fetching checklists...");
      const { data: checklistData, error: checklistError } = await supabase.from("checklist").select("*");
      if (checklistError) {
        console.error("❌ Error loading checklists:", checklistError.message);
        setTasks([]);
        setColumns([]);
        setLoading(false);
        return;
      }
      console.log("✅ Checklists loaded:", checklistData);

      console.log("🔄 Fetching tasks...");
      const { data: tasksRaw, error: taskError } = await supabase.from("task").select(`
        id,
        title,
        description,
        status,
        due_date,
        created,
        checklist_id,
        author:contact!task_author_id_fkey(*),
        assignees:contact_task(contact:contact!contact_task_assigned_id_fkey(*)),
        subtasks,
        attachments,
        comments:comment(*, author:contact(*))
      `);

      if (taskError) {
        console.error("❌ Error loading tasks:", taskError.message);
        setTasks([]);
        setColumns([]);
        setLoading(false);
        return;
      }
      console.log("✅ Tasks loaded:", tasksRaw);

      const checklistMap = {};
      (checklistData || []).forEach((checklist) => {
        checklistMap[checklist.id] = {
          id: checklist.id,
          title: checklist.title || `Checklist ${checklist.id}`,
          taskIds: [],
        };
      });
      console.log("📌 Checklist map initialized:", checklistMap);

      const filteredTasks = (tasksRaw || []).filter((task) => {
        if (title && !task.title.toLowerCase().includes(title.toLowerCase())) return false;
        if (taskFilters.status?.eq && task.status !== taskFilters.status.eq) return false;
        if (taskFilters.status?.neq && task.status === taskFilters.status.neq) return false;
        if (taskFilters.due_date?.lt && task.due_date >= taskFilters.due_date.lt) return false;
        if (taskFilters.due_date?.gte && task.due_date < taskFilters.due_date.gte) return false;
        return true;
      });
      console.log("✅ Filtered tasks:", filteredTasks);

      const enrichedTasks = filteredTasks.map((task) => {
        const columnId = task.checklist_id;
        const assignees = (task.assignees || []).map((entry) => ({
          ...entry.contact,
          title: entry.contact.title,
          thumbnail: entry.contact.thumbnail,
        }));

        if (checklistMap[columnId]) {
          checklistMap[columnId].taskIds.push(task.id);
        }

        return {
          id: task.id,
          title: task.title,
          description: task.description,
          columnId: task.checklist_id,
          status: task.status,
          created: dayjs(task.created).toDate(),
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
            created: dayjs(c.created).toDate(),
            author: c.author,
          })),
        };
      });
      console.log("✅ Enriched tasks:", enrichedTasks);

      const sorted = applySort(enrichedTasks, sortDir);
      const generatedColumns = Object.values(checklistMap);

      console.log("✅ Sorted tasks:", sorted);
      console.log("✅ Generated columns:", generatedColumns);

      setTasks(sorted);
      setColumns(generatedColumns);
      setLoading(false);
    };

    fetchData();
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
            <Button component={Link} href="/dashboard/tasks/create" startIcon={<PlusIcon />} variant="contained">
              Add Task
            </Button>
          </Box>
        </Stack>

        <Tabs value={tabIndex} onChange={handleTabChange}>
          <Tab label="Kanban View" />
          <Tab label="Grid View" />
        </Tabs>

        {!loading && (
          <TasksProvider columns={columns} tasks={tasks}>
            {tabIndex === 0 ? (
              <TaskKanbanTab />
            ) : (
              <TaskGridTab tasks={tasks} filters={{ title, status }} sortDir={sortDir} />
            )}
          </TasksProvider>
        )}
      </Stack>
    </Box>
  );
}

function applySort(rows, sortDir) {
  return rows.sort((a, b) => {
    return sortDir === "asc"
      ? a.created.getTime() - b.created.getTime()
      : b.created.getTime() - a.created.getTime();
  });
}
