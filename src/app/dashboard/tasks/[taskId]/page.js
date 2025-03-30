"use client";

import * as React from "react";
import RouterLink from "next/link";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  IconButton,
  Link,
  Stack,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/Grid2";

import {
  ArrowLeft as ArrowLeftIcon,
  CaretDown as CaretDownIcon,
  CheckCircle as CheckCircleIcon,
  PencilSimple as PencilSimpleIcon,
  Plus as PlusIcon,
  ShieldWarning as ShieldWarningIcon,
  User as UserIcon,
} from "@phosphor-icons/react/dist/ssr";

import { appConfig } from "@/config/app";
import { paths } from "@/paths";
import { createClient } from "@/lib/supabase/server";

import { PropertyItem } from "@/components/core/property-item";
import { PropertyList } from "@/components/core/property-list";

export const metadata = {
  title: `Details | Tasks | Dashboard | ${appConfig.title}`,
};

export default async function Page({ params }) {
  const { id: taskId } = params;
  const supabase = await createClient();

  const { data: task, error } = await supabase
    .from("task")
    .select(`
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
    `)
    .eq("id", taskId)
    .maybeSingle();

  if (error) console.error("Error loading task:", error.message);
  if (!task) {
    return (
      <Box p={4}>
        <Typography variant="h6">Task not found.</Typography>
      </Box>
    );
  }

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
        <Stack spacing={3}>
          <div>
            <Link
              color="text.primary"
              component={RouterLink}
              href={paths.dashboard.tasks.list || "/dashboard/tasks"}
              sx={{ alignItems: "center", display: "inline-flex", gap: 1 }}
              variant="subtitle2"
            >
              <ArrowLeftIcon fontSize="var(--icon-fontSize-md)" />
              Tasks
            </Link>
          </div>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={3} sx={{ alignItems: "flex-start" }}>
            <Stack direction="row" spacing={2} sx={{ alignItems: "center", flex: "1 1 auto" }}>
              <Avatar sx={{ "--Avatar-size": "64px" }}>{task.title?.[0]}</Avatar>
              <div>
                <Stack direction="row" spacing={2} sx={{ alignItems: "center", flexWrap: "wrap" }}>
                  <Typography variant="h4">{task.title}</Typography>
                  <Chip
                    icon={<CheckCircleIcon color="var(--mui-palette-success-main)" weight="fill" />}
                    label={task.status || "Todo"}
                    size="small"
                    variant="outlined"
                  />
                </Stack>
                <Typography color="text.secondary" variant="body1">
                  {task.author?.name}
                </Typography>
              </div>
            </Stack>
            <div>
              <Button endIcon={<CaretDownIcon />} variant="contained">
                Action
              </Button>
            </div>
          </Stack>
        </Stack>

        <Grid container spacing={4}>
          <Grid xs={12} lg={4}>
            <Stack spacing={4}>
              <Card>
                <CardHeader
                  action={<IconButton><PencilSimpleIcon /></IconButton>}
                  avatar={<Avatar><UserIcon fontSize="var(--Icon-fontSize)" /></Avatar>}
                  title="Basic details"
                />
                <PropertyList
                  divider={<Divider />}
                  orientation="vertical"
                  sx={{ "--PropertyItem-padding": "12px 24px" }}
                >
                  <PropertyItem title="Task ID" value={<Chip label={task.id} size="small" variant="soft" />} />
                  <PropertyItem title="Name" value={task.title} />
                  <PropertyItem title="Description" value={task.description || "-"} />
                  <PropertyItem title="Due Date" value={task.due_date || "-"} />
                  {task.assignees?.length > 0 && (
                    <PropertyItem
                      title="Assignees"
                      value={
                        <Stack direction="row" spacing={1}>
                          {task.assignees.map((a) => (
                            <Chip key={a.contact.id} label={a.contact.name} size="small" />
                          ))}
                        </Stack>
                      }
                    />
                  )}
                </PropertyList>
              </Card>

              <Card>
                <CardHeader
                  avatar={<Avatar><ShieldWarningIcon fontSize="var(--Icon-fontSize)" /></Avatar>}
                  title="Danger Zone"
                />
                <CardContent>
                  <Stack spacing={1}>
                    <Button color="error" variant="contained">
                      Delete Task
                    </Button>
                    <Typography color="text.secondary" variant="body2">
                      This action cannot be undone. All subtasks and comments will be deleted.
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          </Grid>

          <Grid xs={12} lg={8}>
            <Stack spacing={4}>
              <Card>
                <CardHeader title="Subtasks" />
                <CardContent>
                  {task.subtasks?.length > 0 ? (
                    <Stack spacing={2}>
                      {task.subtasks.map((subtask, i) => (
                        <Typography key={i} variant="body2">• {subtask.title || subtask}</Typography>
                      ))}
                    </Stack>
                  ) : (
                    <Typography>No subtasks available.</Typography>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader
                  action={<Button color="secondary" startIcon={<PlusIcon />}>Add Comment</Button>}
                  title="Comments"
                />
                <CardContent>
                  {task.comments?.length > 0 ? (
                    task.comments.map((comment) => (
                      <Box key={comment.id} mb={2}>
                        <Typography variant="subtitle2">{comment.author?.name}</Typography>
                        <Typography variant="body2">{comment.content}</Typography>
                      </Box>
                    ))
                  ) : (
                    <Typography variant="body2">No comments available.</Typography>
                  )}
                </CardContent>
              </Card>
            </Stack>
          </Grid>
        </Grid>
      </Stack>
    </Box>
  );
}
