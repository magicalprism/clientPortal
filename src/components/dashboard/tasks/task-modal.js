"use client";

import * as React from "react";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import LinearProgress from "@mui/material/LinearProgress";
import Link from "@mui/material/Link";
import MenuItem from "@mui/material/MenuItem";
import OutlinedInput from "@mui/material/OutlinedInput";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { Archive as ArchiveIcon } from "@phosphor-icons/react/dist/ssr/Archive";
import { CalendarBlank as CalendarIcon } from "@phosphor-icons/react/dist/ssr/CalendarBlank";
import { Clock as ClockIcon } from "@phosphor-icons/react/dist/ssr/Clock";
import { File as FileIcon } from "@phosphor-icons/react/dist/ssr/File";
import { Flag as FlagIcon } from "@phosphor-icons/react/dist/ssr/Flag";
import { PaperPlaneTilt as PaperPlaneTiltIcon } from "@phosphor-icons/react/dist/ssr/PaperPlaneTilt";
import { PencilSimple as PencilSimpleIcon } from "@phosphor-icons/react/dist/ssr/PencilSimple";
import { Plus as PlusIcon } from "@phosphor-icons/react/dist/ssr/Plus";
import { Tag as TagIcon } from "@phosphor-icons/react/dist/ssr/Tag";
import { X as XIcon } from "@phosphor-icons/react/dist/ssr/X";
import { createBrowserClient } from '@supabase/ssr';
import { updateTask } from '@/lib/supabase/queries/table/task';

import { dayjs } from "@/lib/dayjs";

// For auth and other Supabase operations that aren't covered by query functions
const supabase = createBrowserClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL,
	process.env.NEXT_PUBLIC_SUPABASE_PUBLIC_KEY
);

// Priority colors
const priorityColors = {
  low: "#4caf50",
  medium: "#ff9800",
  high: "#f44336",
  urgent: "#9c27b0"
};

// Status colors
const statusColors = {
  not_started: "#9e9e9e",
  todo: "#2196f3",
  in_progress: "#ff9800",
  complete: "#4caf50",
  archived: "#757575"
};

export function TaskModal({ onClose, onTaskDelete, onTaskUpdate, onCommentAdd, open, task }) {
	const {
		assignees = [],
		attachments = [],
		comments = [],
		labels = [],
		subtasks = [],
		description = "",
		id,
		title,
		status = "todo",
		priority = "medium",
		due_date,
	} = task;

	return (
		<Dialog
			maxWidth="md"
			onClose={onClose}
			open={open}
			sx={{
				"& .MuiDialog-container": { justifyContent: "center" },
				"& .MuiDialog-paper": { height: "90%", width: "90%", maxWidth: "1200px" },
			}}
		>
			<DialogContent sx={{ display: "flex", flexDirection: "column", p: 0, overflow: "hidden" }}>
				{/* Header */}
				<Box 
					sx={{ 
						display: "flex", 
						alignItems: "center", 
						justifyContent: "space-between", 
						p: 2, 
						borderBottom: "1px solid", 
						borderColor: "divider",
						bgcolor: "background.paper",
					}}
				>
					<Box sx={{ display: "flex", alignItems: "center" }}>
						<Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
							Task #{id?.substring(0, 8)}
						</Typography>
						
						<Select
							value={status}
							size="small"
							onChange={(e) => onTaskUpdate?.(id, { status: e.target.value })}
							sx={{ 
								minWidth: 150, 
								mr: 2,
								'& .MuiSelect-select': {
									color: statusColors[status],
									fontWeight: 'medium'
								}
							}}
						>
							<MenuItem value="not_started">Not Started</MenuItem>
							<MenuItem value="todo">To Do</MenuItem>
							<MenuItem value="in_progress">In Progress</MenuItem>
							<MenuItem value="complete">Complete</MenuItem>
							<MenuItem value="archived">Archived</MenuItem>
						</Select>
						
						<Tooltip title="Priority">
							<Chip 
								icon={<FlagIcon />} 
								label={priority?.charAt(0).toUpperCase() + priority?.slice(1)} 
								size="small"
								sx={{ 
									bgcolor: priorityColors[priority] + '20',
									color: priorityColors[priority],
									fontWeight: 'medium',
									'& .MuiChip-icon': {
										color: priorityColors[priority]
									}
								}}
							/>
						</Tooltip>
					</Box>
					
					<IconButton onClick={onClose} edge="end">
						<XIcon />
					</IconButton>
				</Box>
				
				{/* Main content area */}
				<Grid container sx={{ flex: 1, overflow: "hidden" }}>
					{/* Left content area (70%) */}
					<Grid item xs={12} md={8} sx={{ height: "100%", overflow: "auto", borderRight: "1px solid", borderColor: "divider", p: 3 }}>
						<Stack spacing={4}>
							{/* Title and description */}
							<EditableDetails
								id={id}
								description={description ?? ""}
								onUpdate={(params) => {
									onTaskUpdate?.(id, params)
								}}
								title={title ?? ""}
							/>
							
							{/* Subtasks */}
							<Box>
								<Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'medium' }}>
									Subtasks
								</Typography>
								
								{subtasks.length > 0 ? (
									<Stack spacing={2}>
										<Stack spacing={1}>
											<Typography color="text.secondary" variant="body2">
												{countDoneSubtasks(subtasks)} of {subtasks.length}
											</Typography>
											<LinearProgress
												sx={{ bgcolor: "var(--mui-palette-background-level1)" }}
												value={(100 / subtasks.length) * countDoneSubtasks(subtasks)}
												variant="determinate"
											/>
										</Stack>
										<Stack gap={1}>
											{subtasks.map((subtask) => (
												<FormControlLabel
													control={<Checkbox checked={subtask.done} />}
													key={subtask.id}
													label={subtask.title}
												/>
											))}
										</Stack>
									</Stack>
								) : (
									<Typography color="text.secondary" variant="body2">
										No subtasks yet
									</Typography>
								)}
								
								<Button 
									color="primary" 
									startIcon={<PlusIcon />} 
									variant="outlined"
									size="small"
									sx={{ mt: 2 }}
								>
									Add subtask
								</Button>
							</Box>
							
							{/* Comments */}
							<Box>
								<Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'medium' }}>
									Comments
								</Typography>
								
								{comments.length > 0 ? (
									<Stack spacing={3}>
										{comments.map((comment, index) => (
											<CommentItem comment={comment} connector={index < comments.length - 1} key={comment.id} />
										))}
									</Stack>
								) : (
									<Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>
										No comments yet
									</Typography>
								)}
								
								<CommentAdd
									onAdd={(content) => {
										onCommentAdd?.(id, content);
									}}
								/>
							</Box>
						</Stack>
					</Grid>
					
					{/* Right sidebar (30%) */}
					<Grid item xs={12} md={4} sx={{ height: "100%", overflow: "auto", bgcolor: "background.default", p: 3 }}>
						<Stack spacing={3}>
							{/* Created by */}
							<Box>
								<Typography variant="subtitle2" sx={{ mb: 1, color: "text.secondary" }}>
									Created by
								</Typography>
								<Stack direction="row" spacing={1} alignItems="center">
									<Avatar src={task.author?.avatar} sx={{ width: 24, height: 24 }} />
									<Typography variant="body2">
										{task.author?.name}
									</Typography>
								</Stack>
							</Box>
							
							{/* Assignees */}
							<Box>
								<Typography variant="subtitle2" sx={{ mb: 1, color: "text.secondary" }}>
									Assignees
								</Typography>
								<Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
									{assignees.map((assignee) => (
										<Tooltip key={assignee.id} title={assignee.name || "User"}>
											<Avatar src={assignee.avatar} sx={{ width: 32, height: 32 }} />
										</Tooltip>
									))}
									<IconButton size="small">
										<PlusIcon />
									</IconButton>
								</Stack>
							</Box>
							
							{/* Due date */}
							<Box>
								<Typography variant="subtitle2" sx={{ mb: 1, color: "text.secondary" }}>
									Due date
								</Typography>
								<Stack direction="row" spacing={1} alignItems="center">
									<CalendarIcon size={16} />
									<DatePicker 
										format="MMM D, YYYY" 
										name="dueDate" 
										value={due_date ? dayjs(due_date) : null}
										slotProps={{ textField: { size: 'small', fullWidth: true } }}
									/>
								</Stack>
							</Box>
							
							{/* Time tracking */}
							<Box>
								<Typography variant="subtitle2" sx={{ mb: 1, color: "text.secondary" }}>
									Time tracking
								</Typography>
								<Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1 }}>
									<Stack direction="row" spacing={1} alignItems="center">
										<ClockIcon size={16} />
										<Typography variant="body2">
											No time logged
										</Typography>
										<Button size="small" variant="text" sx={{ ml: 'auto' }}>
											Start timer
										</Button>
									</Stack>
								</Paper>
							</Box>
							
							{/* Labels/Tags */}
							<Box>
								<Typography variant="subtitle2" sx={{ mb: 1, color: "text.secondary" }}>
									Labels
								</Typography>
								<Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
									{labels.map((label) => (
										<Chip
											key={label}
											label={label}
											size="small"
											onDelete={() => {
												// noop
											}}
											icon={<TagIcon size={14} />}
										/>
									))}
									<IconButton size="small">
										<PlusIcon />
									</IconButton>
								</Stack>
							</Box>
							
							{/* Attachments */}
							<Box>
								<Typography variant="subtitle2" sx={{ mb: 1, color: "text.secondary" }}>
									Attachments
								</Typography>
								<Stack spacing={1}>
									{attachments.map((attachment) => (
										<Paper
											key={attachment.id}
											sx={{ borderRadius: 1, p: 1 }}
											variant="outlined"
										>
											<Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
												<FileIcon size={16} />
												<Box sx={{ minWidth: 0 }}>
													<Typography noWrap variant="body2">
														{attachment.name}
													</Typography>
													<Typography color="text.secondary" variant="caption">
														{attachment.size}
													</Typography>
												</Box>
											</Stack>
										</Paper>
									))}
									<Button 
										color="primary" 
										startIcon={<PlusIcon />} 
										variant="outlined"
										size="small"
									>
										Add attachment
									</Button>
								</Stack>
							</Box>
							
							{/* Related Items */}
							<RelatedItemsSection task={task} />
							
							{/* Delete button */}
							<Box sx={{ mt: 2 }}>
								<Button
									color="error"
									onClick={() => {
										onTaskDelete?.(id);
									}}
									startIcon={<ArchiveIcon />}
									fullWidth
									variant="outlined"
								>
									Archive Task
								</Button>
							</Box>
						</Stack>
					</Grid>
				</Grid>
			</DialogContent>
		</Dialog>
	);
}

function EditableDetails({ description: initialDescription, onUpdate, title: initialTitle, id }) {
	const [title, setTitle] = React.useState("");
	const [description, setDescription] = React.useState(initialDescription ?? "");

	const [edit, setEdit] = React.useState(false);

	React.useEffect(() => {
		setTitle(initialTitle);
	}, [initialTitle]);

	React.useEffect(() => {
		setDescription(initialDescription);
	}, [initialDescription]);

	const handleSave = React.useCallback(async () => {
		if (!title) return;

		const { data, error } = await updateTask(id, {
			title,
			description
		});

		if (error) {
			console.error("Failed to update task:", error.message);
		} else {
			onUpdate?.({ title, description }); // optional local update
			setEdit(false);
		}
	}, [title, description, id, onUpdate]);

	if (edit) {
		return (
			<Stack spacing={2}>
				<OutlinedInput
					name="title"
					onChange={(event) => setTitle(event.target.value)}
					value={title}
					placeholder="Task title"
					sx={{ fontSize: "1.25rem", fontWeight: "500" }}
				/>
				<OutlinedInput
					maxRows={8}
					minRows={4}
					multiline
					onChange={(event) => setDescription(event.target.value)}
					placeholder="Add a description..."
					value={description}
				/>
				<Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
					<Button
						color="secondary"
						onClick={() => {
							setTitle(initialTitle);
							setDescription(initialDescription);
							setEdit(false);
						}}
						size="small"
					>
						Cancel
					</Button>
					<Button onClick={handleSave} size="small" variant="contained">
						Save
					</Button>
				</Stack>
			</Stack>
		);
	}

	return (
		<Box>
			<Stack direction="row" spacing={2} sx={{ alignItems: "flex-start" }}>
				<Stack spacing={1} sx={{ flex: "1 1 auto" }}>
					<Typography variant="h5" sx={{ fontWeight: "500" }}>{title}</Typography>
				</Stack>
				<IconButton onClick={() => setEdit(true)}>
					<PencilSimpleIcon />
				</IconButton>
			</Stack>
			{description ? (
				<Typography color="text.secondary" variant="body1" sx={{ mt: 1, whiteSpace: "pre-wrap" }}>
					{description}
				</Typography>
			) : (
				<Typography 
					color="text.secondary" 
					variant="body2" 
					sx={{ mt: 1, fontStyle: "italic", cursor: "pointer" }}
					onClick={() => setEdit(true)}
				>
					Add a description...
				</Typography>
			)}
		</Box>
	);
}


function CommentItem({ comment, connector }) {
	const { author, content, createdAt, comments } = comment;
	const canReply = author.id !== "USR-000"; // authenticated user

	return (
		<Stack direction="row" spacing={2}>
			<Box sx={{ display: "flex", flexDirection: "column" }}>
				<Avatar src={author.avatar} />
				{connector ? (
					<Box sx={{ flex: "1 1 auto", pt: 3 }}>
						<Box
							sx={{
								bgcolor: "var(--mui-palette-divider)",
								height: "100%",
								minHeight: "24px",
								mx: "auto",
								width: "1px",
							}}
						/>
					</Box>
				) : null}
			</Box>
			<Stack spacing={3} sx={{ flex: "1 1 auto" }}>
				<div>
					<Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", justifyContent: "space-between" }}>
						<Tooltip arrow title={`@${author.username}`}>
							<Typography variant="subtitle2">{author.name}</Typography>
						</Tooltip>
						{createdAt ? (
							<Typography sx={{ whiteSpace: "nowrap" }} variant="caption">
								{dayjs(createdAt).fromNow()}
							</Typography>
						) : null}
					</Stack>
					<Typography variant="body2">{content}</Typography>
					{canReply ? (
						<div>
							<Link sx={{ cursor: "pointer" }} variant="body2">
								Reply
							</Link>
						</div>
					) : null}
				</div>
				{comments?.length ? (
					<Stack spacing={2}>
						{comments.map((subComment, index) => (
							<CommentItem comment={subComment} connector={index < comments.length - 1} key={subComment.id} />
						))}
					</Stack>
				) : null}
			</Stack>
		</Stack>
	);
}

function CommentAdd({ onAdd }) {
	const [content, setContent] = React.useState("");

	const handleAdd = React.useCallback(() => {
		if (!content) {
			return;
		}

		onAdd?.(content);
		setContent("");
	}, [content, onAdd]);

	return (
		<OutlinedInput
			endAdornment={
				<InputAdornment position="end">
					<IconButton
						onClick={() => {
							handleAdd();
						}}
					>
						<PaperPlaneTiltIcon />
					</IconButton>
				</InputAdornment>
			}
			onChange={(event) => {
				setContent(event.target.value);
			}}
			onKeyUp={(event) => {
				if (event.key === "Enter") {
					handleAdd();
				}
			}}
			placeholder="Add a comment..."
			startAdornment={
				<InputAdornment position="start">
					<Avatar src="/assets/avatar.png" />
				</InputAdornment>
			}
			sx={{ "--Input-paddingBlock": "12px" }}
			value={content}
		/>
	);
}

function countDoneSubtasks(subtasks = []) {
	return subtasks.reduce((acc, curr) => acc + (curr.done ? 1 : 0), 0);
}

// Import the field renderers
import { RelationshipFieldRenderer } from "@/components/fields/relationships/RelationshipFieldRenderer";
import { MultiRelationshipFieldRenderer } from "@/components/fields/relationships/multi/MultiRelationshipFieldRenderer";
import { ViewButtons } from "@/components/buttons/ViewButtons";
import * as collections from "@/collections";

// Component to display relationship fields in the TaskModal
function RelatedItemsSection({ task }) {
	// Skip if no task
	if (!task) return null;

	// Find relationship fields in the task
	const relationshipFields = [];
	const multiRelationshipFields = [];

	// Iterate through task properties to find relationship fields
	Object.entries(task).forEach(([key, value]) => {
		// Skip standard properties that we already display
		if ([
			'id', 'title', 'description', 'status', 'priority', 'due_date',
			'assignees', 'attachments', 'comments', 'labels', 'subtasks', 'author'
		].includes(key)) {
			return;
		}

		// Check for relationship fields (ends with _id and has a corresponding object)
		if (key.endsWith('_id') && value && task[key.replace('_id', '')]) {
			relationshipFields.push({
				name: key,
				value,
				record: task,
				relation: {
					table: key.replace('_id', ''),
					labelField: 'title',
					linkTo: `/dashboard/${key.replace('_id', '')}`
				}
			});
		}

		// Check for multi-relationship fields (array of IDs with corresponding _details)
		if (Array.isArray(value) && task[`${key}_details`] && Array.isArray(task[`${key}_details`])) {
			multiRelationshipFields.push({
				name: key,
				value,
				record: task,
				relation: {
					table: key,
					labelField: 'title',
					linkTo: `/dashboard/${key}`
				}
			});
		}
	});

	// If no relationship fields found, don't render the section
	if (relationshipFields.length === 0 && multiRelationshipFields.length === 0) {
		return null;
	}

	return (
		<Box>
			<Typography variant="subtitle2" sx={{ mb: 1, color: "text.secondary" }}>
				Related Items
			</Typography>
			<Stack spacing={2}>
				{/* Render single relationships */}
				{relationshipFields.map((field) => (
					<Box key={field.name} sx={{ mb: 1 }}>
						<Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
							{field.name.replace('_id', '').replace(/([A-Z])/g, ' $1').trim()}
						</Typography>
						<RelationshipFieldRenderer
							value={field.value}
							field={field}
							record={task}
						/>
					</Box>
				))}

				{/* Render multi-relationships */}
				{multiRelationshipFields.map((field) => (
					<Box key={field.name} sx={{ mb: 1 }}>
						<Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
							{field.name.replace(/([A-Z])/g, ' $1').trim()}
						</Typography>
						<MultiRelationshipFieldRenderer
							value={field.value}
							field={field}
							record={task}
						/>
					</Box>
				))}
			</Stack>
		</Box>
	);
}
