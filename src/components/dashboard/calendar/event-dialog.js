"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Dialog from "@mui/material/Dialog";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormHelperText from "@mui/material/FormHelperText";
import IconButton from "@mui/material/IconButton";
import InputLabel from "@mui/material/InputLabel";
import OutlinedInput from "@mui/material/OutlinedInput";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { Trash as TrashIcon } from "@phosphor-icons/react/dist/ssr/Trash";
import { Controller, useForm } from "react-hook-form";
import { z as zod } from "zod";

import { createClient } from "@/lib/supabase/browser";
import { dayjs } from "@/lib/dayjs";
import { logger } from "@/lib/default-logger";
import { toast } from "@/components/core/toaster";

const schema = zod
  .object({
    title: zod.string().min(1, "Title is required").max(255),
    description: zod.string().max(5000).optional(),
    start: zod.date(),
    end: zod.date(),
    allDay: zod.boolean(),
    priority: zod.string().max(255).optional(),
    checklistId: zod.union([zod.string(), zod.number()]),
	type: zod.enum(["Task", "Meeting", "Appointment", "Reminder"]),

  })
  .refine((data) => data.start < data.end, {
    message: "End date should be greater than start date",
    path: ["end"],
  });

function getDefaultValues({ event, range }) {
  if (event) {
    return {
      title: event.title ?? "",
      description: event.description ?? "",
      start: event.start ?? new Date(),
      end: event.end ?? dayjs().add(30, "minute").toDate(),
      allDay: event.allDay ?? false,
      priority: event.priority ?? "low",
      checklistId: event?.checklistId ?? "",
	  type: event?.type ?? "Task"
    };
  }

  if (range) {
    return {
      title: "",
      description: "",
      start: range.start,
      end: range.end,
      allDay: false,
      priority: "low",
      checklistId: "",
	  type: "Task",
    };
  }

  return {
    title: "",
    description: "",
    start: new Date(),
    end: dayjs().add(30, "minute").toDate(),
    allDay: false,
    priority: "low",
    checklistId: "",
	type: "Task",
  };
}

export function EventDialog({
  action = "create",
  event,
  onClose,
  onCreate,
  onDelete,
  onUpdate,
  open = false,
  range,
}) {
  const [checklists, setChecklists] = React.useState([]);
  const supabase = createClient();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: getDefaultValues({ event, range }),
    resolver: zodResolver(schema),
  });

  const onSubmit = React.useCallback(
	async (values) => {
	  try {
		let taskId = event?.id;
  
		// === UPDATE MODE ===
		if (action === "update" && taskId) {
		  const { error: updateError } = await supabase
			.from("task")
			.update({
			  title: values.title,
			  description: values.description,
			  start: values.start,
			  due_date: values.end,
			  allDay: values.allDay,
			  priority: values.priority,
			  type: values.type,
			})
			.eq("id", taskId);
  
		  if (updateError) throw new Error(updateError.message);
  
		  toast.success("Task updated");
		  onUpdate?.(taskId, values);
		  return;
		}
  
		// === CREATE MODE ===
		const { data: taskData, error: taskError } = await supabase
		  .from("task")
		  .insert({
			title: values.title,
			description: values.description,
			start: values.start,
			due_date: values.end,
			allDay: values.allDay,
			priority: values.priority,
			is_complete: false,
			type: values.type,
		  })
		  .select("id")
		  .single();
  
		if (taskError || !taskData?.id) {
		  throw new Error(taskError?.message || "Task creation failed");
		}
  
		// Pivot insert (checklist_task)
		const { data: existing, error: selectError } = await supabase
		  .from("checklist_task")
		  .select("id")
		  .eq("checklist_id", values.checklistId)
		  .eq("task_id", taskData.id)
		  .maybeSingle();
  
		if (selectError) throw new Error(selectError.message);
  
		if (!existing) {
		  const { error: pivotError } = await supabase.from("checklist_task").insert({
			checklist_id: values.checklistId,
			task_id: taskData.id,
		  });
  
		  if (pivotError) throw new Error(pivotError.message);
		}
  
		toast.success("Task created");
		onCreate?.(taskData);
	  } catch (error) {
		logger.error(error);
		toast.error("Something went wrong!");
	  }
	},
	[supabase, action, event, onCreate, onUpdate]
  );
  

  React.useEffect(() => {
    reset(getDefaultValues({ event, range }));
  }, [event, range, reset]);

  React.useEffect(() => {
    const fetchChecklists = async () => {
      const { data, error } = await supabase.from("checklist").select("id, title");
      if (error) {
        console.error("❌ Error loading checklists:", error.message);
        return;
      }
      setChecklists(data || []);
    };

    fetchChecklists();
  }, [supabase]);

  return (
    <Dialog fullWidth maxWidth="sm" onClose={onClose} open={open}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Box sx={{ p: 3 }}>
          <Typography sx={{ textAlign: "center" }} variant="h5">
            {event ? "Edit event" : "Add event"}
          </Typography>
        </Box>
        <Stack spacing={2} sx={{ p: 3 }}>
          <Controller
            control={control}
            name="title"
            render={({ field }) => (
              <FormControl error={Boolean(errors.title)}>
                <InputLabel>Title</InputLabel>
                <OutlinedInput {...field} />
                {errors.title ? <FormHelperText>{errors.title.message}</FormHelperText> : null}
              </FormControl>
            )}
          />
          <Controller
            control={control}
            name="description"
            render={({ field }) => (
              <FormControl error={Boolean(errors.description)}>
                <InputLabel>Description</InputLabel>
                <OutlinedInput {...field} />
                {errors.description ? <FormHelperText>{errors.description.message}</FormHelperText> : null}
              </FormControl>
            )}
          />
          <Controller
            control={control}
            name="checklistId"
            render={({ field }) => (
              <FormControl error={Boolean(errors.checklistId)} fullWidth>
                <InputLabel>Checklist</InputLabel>
                <Select
                  {...field}
                  label="Checklist"
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value)}
                >
                  {checklists.map((checklist) => (
                    <MenuItem key={checklist.id} value={checklist.id}>
                      {checklist.title}
                    </MenuItem>
                  ))}
                </Select>
                {errors.checklistId ? (
                  <FormHelperText>{errors.checklistId.message}</FormHelperText>
                ) : null}
              </FormControl>
            )}
          />
          <Controller
            control={control}
            name="allDay"
            render={({ field }) => (
              <div>
                <FormControlLabel
                  control={<Checkbox {...field} checked={field.value} />}
                  label="All day"
                />
                {errors.allDay ? <FormHelperText error>{errors.allDay.message}</FormHelperText> : null}
              </div>
            )}
          />
		  <Controller
				control={control}
				name="type"
				render={({ field }) => (
					<FormControl error={Boolean(errors.type)} fullWidth>
					<InputLabel>Type</InputLabel>
					<Select
						{...field}
						label="Type"
						value={field.value ?? "Task"}
						onChange={(e) => field.onChange(e.target.value)}
					>
						{["Task", "Meeting", "Appointment", "Reminder"].map((value) => (
						<MenuItem key={value} value={value}>
							{value}
						</MenuItem>
						))}
					</Select>
					{errors.type ? <FormHelperText>{errors.type.message}</FormHelperText> : null}
					</FormControl>
				)}
				/>

          <Controller
            control={control}
            name="start"
            render={({ field }) => (
              <DateTimePicker
                format="MMM D, YYYY hh:mm A"
                label="Start date"
                onChange={(date) => field.onChange(date ? date.toDate() : null)}
                slotProps={{
                  textField: {
                    error: Boolean(errors.start),
                    helperText: errors.start?.message,
                  },
                }}
                value={dayjs(field.value)}
              />
            )}
          />
          <Controller
            control={control}
            name="end"
            render={({ field }) => (
              <DateTimePicker
                format="MMM D, YYYY hh:mm A"
                label="End date"
                onChange={(date) => field.onChange(date ? date.toDate() : null)}
                slotProps={{
                  textField: {
                    error: Boolean(errors.end),
                    helperText: errors.end?.message,
                  },
                }}
                value={dayjs(field.value)}
              />
            )}
          />
        </Stack>
        <Divider />
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between", p: 2 }}>
          {action === "update" ? (
            <IconButton color="error" onClick={() => onDelete?.(event.id)}>
              <TrashIcon />
            </IconButton>
          ) : (
            <div />
          )}
          <Stack direction="row" spacing={1}>
            <Button color="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="contained">
              Confirm
            </Button>
          </Stack>
        </Stack>
      </form>
    </Dialog>
  );
}
