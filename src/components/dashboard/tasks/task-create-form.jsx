"use client";

import * as React from "react";
import RouterLink from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z as zod } from "zod";

import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Divider,
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  OutlinedInput,
  Select,
  Stack,
  Typography,
} from "@mui/material";

import { Option } from "@/components/core/option";
import { toast } from "@/components/core/toaster";
import { paths } from "@/paths";
import { createClient } from "@/lib/supabase/browser";
import { logger } from "@/lib/default-logger";

const schema = zod.object({
  title: zod.string().min(1, "Title is required"),
  description: zod.string().optional(),
  status: zod.string().min(1, "Status is required"),
  due_date: zod.string().optional(),
  checklist_id: zod.string().optional(),
  urgency: zod.coerce.number().min(0).max(5).optional(),
  type: zod.enum(["Task", "Meeting", "Appointment", "Reminder"], {
    type: zod.enum(["Task", "Meeting", "Appointment", "Reminder"], {
        errorMap: () => ({ message: "Type is required" }),
      }),
}),
})

const defaultValues = {
  title: "",
  description: "",
  status: "Todo",
  due_date: "",
  urgency: 1,
  type: "Task",
  checklist_id: null,
};

export function TaskCreateForm() {
  const router = useRouter();
  const supabase = createClient();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues,
    resolver: zodResolver(schema),
  });

  const onSubmit = async (formData) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
  
      const { data, error } = await supabase
        .from("task")
        .insert({
          title: formData.title,
          description: formData.description,
          status: formData.status,
          due_date: formData.due_date || null,
          urgency: formData.urgency,
          type: formData.type,
          author_id: user?.id,
          checklist_id: formData.checklist_id || null, // optional
        })
        .select()
        .single();
  

      if (error || !data?.id) {
        throw new Error(error?.message || "Task creation failed");
      }

      toast.success("Task created");
      router.push(paths.dashboard.tasks.details(data.id));
    } catch (err) {
      console.error("Error creating task:", err);
      logger.error(err.message);
      toast.error("Failed to create task");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardContent>
          <Stack divider={<Divider />} spacing={4}>
            <Typography variant="h6">Task Details</Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Controller
                  control={control}
                  name="title"
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.title}>
                      <InputLabel required>Title</InputLabel>
                      <OutlinedInput {...field} />
                      {errors.title && <FormHelperText>{errors.title.message}</FormHelperText>}
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.status}>
                      <InputLabel required>Status</InputLabel>
                      <Select {...field}>
                        <Option value="Todo">Todo</Option>
                        <Option value="Progress">Progress</Option>
                        <Option value="Done">Done</Option>
                      </Select>
                      {errors.status && <FormHelperText>{errors.status.message}</FormHelperText>}
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Controller
                  control={control}
                  name="description"
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Description</InputLabel>
                      <OutlinedInput {...field} multiline rows={4} />
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  control={control}
                  name="due_date"
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel shrink>Due Date</InputLabel>
                      <OutlinedInput {...field} type="date" />
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  control={control}
                  name="urgency"
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Urgency (0–5)</InputLabel>
                      <OutlinedInput {...field} type="number" inputProps={{ min: 0, max: 5 }} />
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                    control={control}
                    name="type"
                    render={({ field }) => (
                    <FormControl fullWidth error={!!errors.type}>
                        <InputLabel required>Type</InputLabel>
                        <Select {...field} label="Type">
                        <Option value="Task">Task</Option>
                        <Option value="Meeting">Meeting</Option>
                        <Option value="Appointment">Appointment</Option>
                        <Option value="Reminder">Reminder</Option>
                        </Select>
                        {errors.type && <FormHelperText>{errors.type.message}</FormHelperText>}
                    </FormControl>
                    )}
                />
                </Grid>

            </Grid>
          </Stack>
        </CardContent>

        <CardActions sx={{ justifyContent: "flex-end" }}>
          <Button color="secondary" component={RouterLink} href={paths.dashboard.tasks.list}>
            Cancel
          </Button>
          <Button type="submit" variant="contained">
            Create Task
          </Button>
        </CardActions>
      </Card>
    </form>
  );
}
