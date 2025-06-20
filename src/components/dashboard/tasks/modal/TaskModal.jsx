'use client';

import * as React from "react";
import { useState, useEffect, useCallback, useRef } from "react";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import LinearProgress from "@mui/material/LinearProgress";
import Link from "@mui/material/Link";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import MenuItem from "@mui/material/MenuItem";
import OutlinedInput from "@mui/material/OutlinedInput";
import Paper from "@mui/material/Paper";
import Radio from "@mui/material/Radio";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { Archive as ArchiveIcon } from "@phosphor-icons/react/dist/ssr/Archive";
import { ArrowLeft as ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr/ArrowLeft";
import { CalendarBlank as CalendarIcon } from "@phosphor-icons/react/dist/ssr/CalendarBlank";
import { CaretRight as CaretRightIcon } from "@phosphor-icons/react/dist/ssr/CaretRight";
import { Clock as ClockIcon } from "@phosphor-icons/react/dist/ssr/Clock";
import { File as FileIcon } from "@phosphor-icons/react/dist/ssr/File";
import { Flag as FlagIcon } from "@phosphor-icons/react/dist/ssr/Flag";
import { PaperPlaneTilt as PaperPlaneTiltIcon } from "@phosphor-icons/react/dist/ssr/PaperPlaneTilt";
import { PencilSimple as PencilSimpleIcon } from "@phosphor-icons/react/dist/ssr/PencilSimple";
import { Plus as PlusIcon } from "@phosphor-icons/react/dist/ssr/Plus";
import { Tag as TagIcon } from "@phosphor-icons/react/dist/ssr/Tag";
import { X as XIcon } from "@phosphor-icons/react/dist/ssr/X";
import { createBrowserClient } from '@supabase/ssr';
import { updateTask, fetchTaskById, createTask, fetchChildTasks } from '@/lib/supabase/queries/table/task';
import { hydrateRecord } from '@/lib/utils/hydrateRecord';
import { useModal } from '@/components/modals/ModalContext';

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

import { RelationshipField } from '@/components/fields/relationships/RelationshipField';

export default function TaskModal({ onClose, onDelete, onUpdate, open, record, config }) {
  // Get the modal context functions
  const { openModal } = useModal();
  
  // State for hydrated record
  const [hydratedRecord, setHydratedRecord] = React.useState(record);
  
  // State for child tasks
  const [childTasks, setChildTasks] = React.useState([]);
  
  // State for relationship select dialogs
  const [selectDialogOpen, setSelectDialogOpen] = React.useState({
    assignee: false,
    project: false,
    company: false,
    attachment: false,
    label: false
  });
  
  // Hydrate the record and fetch child tasks when it changes
  React.useEffect(() => {
    const hydrateTaskRecord = async () => {
      if (record && record.id) {
        try {
          // First try to hydrate the record with the provided config
          const hydrated = await hydrateRecord(record, config, supabase);
          setHydratedRecord(hydrated);
          
          // Fetch child tasks
          const { data: children } = await fetchChildTasks(record.id);
          if (children && children.length > 0) {
            console.log("Fetched child tasks:", children);
            setChildTasks(children);
          }
        } catch (error) {
          console.error("Error hydrating record:", error);
          setHydratedRecord(record);
        }
      } else {
        setHydratedRecord(record);
      }
    };
    
    hydrateTaskRecord();
  }, [record, config]);
  
  // Use the hydrated record instead of the raw record
  record = hydratedRecord || record;
  // Extract task data from record
  const {
    id,
    title = "",
    description = "",
    status: rawStatus = "todo",
    priority = "medium",
    due_date,
    assigned_id,
    assigned_contact, // Direct assignee from the query
    assigned_id_details, // Fallback for assignee details
    tags = [],
    tags_details: labels = [],
    attachments = [],
    comments = [],
    subtasks = [],
    children = [], // For subtasks from the query
    author_id,
    author_id_details: author,
    parent_id,
    parent_id_details: parentTask,
    // For breadcrumb navigation (passed when opening a subtask)
    parentTask: explicitParentTask,
  } = record || {};
  
  // Get the actual status value
  const status = typeof rawStatus === 'object' && rawStatus !== null ? 
    (rawStatus.value || 'todo') : (rawStatus || 'todo');
  
  // Use explicit parent task info if provided, otherwise use parent_id_details
  const effectiveParentTask = explicitParentTask || parentTask;
  
  // Get the assignee data
  const assignee = React.useMemo(() => {
    // If we have assigned_contact from the query, use it
    if (assigned_contact) {
      return assigned_contact;
    }
    
    // If we have assigned_id_details, use it
    if (assigned_id_details) {
      return Array.isArray(assigned_id_details) 
        ? assigned_id_details[0] 
        : assigned_id_details;
    }
    
    // If we just have assigned_id, create a minimal object
    if (assigned_id) {
      return { id: assigned_id, title: `User ${assigned_id}` };
    }
    
    return null;
  }, [assigned_contact, assigned_id_details, assigned_id]);
  
  // State to track newly added subtasks in the current session
  const [sessionSubtasks, setSessionSubtasks] = React.useState([]);
  
  // Normalize subtasks data
  const normalizedSubtasks = React.useMemo(() => {
    console.log('Normalizing subtasks:', { sessionSubtasks, subtasks, children, childTasks });
    
    // Start with session subtasks (these are the ones added during this modal session)
    let result = [...sessionSubtasks];
    
    // If we have subtasks array with done property, add them
    if (subtasks && subtasks.length > 0) {
      // Filter out any that might be duplicates from sessionSubtasks
      const filteredSubtasks = subtasks.filter(
        st => !sessionSubtasks.some(sst => sst.id === st.id)
      );
      
      // Convert to standard format if needed
      const formattedSubtasks = filteredSubtasks.map(st => ({
        id: st.id,
        title: st.title,
        done: st.status === 'complete' || st.done === true,
        status: st.status || (st.done ? 'complete' : 'todo')
      }));
      
      result = [...result, ...formattedSubtasks];
    }
    
    // If we have children from the query, convert to subtask format and add them
    if (children && children.length > 0) {
      // Filter out any that might be duplicates from sessionSubtasks or already added subtasks
      const filteredChildren = children.filter(
        child => !result.some(r => r.id === child.id)
      );
      
      const formattedChildren = filteredChildren.map(child => ({
        id: child.id,
        title: child.title,
        done: child.status === 'complete',
        status: child.status
      }));
      
      result = [...result, ...formattedChildren];
    }
    
    // Add child tasks from the separate fetch
    if (childTasks && childTasks.length > 0) {
      // Filter out any that might be duplicates from already added tasks
      const filteredChildTasks = childTasks.filter(
        child => !result.some(r => r.id === child.id)
      );
      
      const formattedChildTasks = filteredChildTasks.map(child => ({
        id: child.id,
        title: child.title,
        done: child.status === 'complete',
        status: child.status
      }));
      
      result = [...result, ...formattedChildTasks];
    }
    
    console.log('Normalized subtasks result:', result);
    return result;
  }, [subtasks, children, sessionSubtasks, childTasks]);
  
  // Handle opening a subtask
  const handleOpenSubtask = async (subtaskId) => {
    if (!subtaskId) return;
    
    try {
      console.log("Opening subtask:", subtaskId);
      
      // Signal to the parent component that we want to open a subtask
      // This is a special update that will be handled by the parent
      onUpdate?.({
        __openSubtask: true,
        subtaskId,
        parentTask: {
          id,
          title
        }
      });
      
      // Close the current modal
      onClose?.();
    } catch (error) {
      console.error("Error opening subtask:", error);
    }
  };

  // Handle task updates
  const handleTaskUpdate = async (fieldName, value) => {
    if (!id) return;
    
    try {
      const { data, error } = await updateTask(id, {
        [fieldName]: value
      });
      
      if (error) {
        console.error(`Failed to update task ${fieldName}:`, error.message);
        return;
      }
      
      // Call the onUpdate callback with the updated field
      if (onUpdate) {
        onUpdate({ ...record, [fieldName]: value });
      }
    } catch (err) {
      console.error("Error updating task:", err);
    }
  };
  
  // Handle comment addition
  const handleCommentAdd = async (content) => {
    if (!id || !content) return;
    
    try {
      console.log("Adding comment:", content);
      
      // Step 1: Create a new comment in the database
      const { data: newComment, error: commentError } = await supabase
        .from('comment')
        .insert({
          content,
          author_id: author_id || 25, // Use the current user's ID or fallback to a default
          created_at: new Date().toISOString()
        })
        .select('*, author:author_id(id, title, first_name, last_name, thumbnail_media:thumbnail_id(id, url, alt_text))')
        .single();
      
      if (commentError) {
        console.error("Failed to add comment:", commentError.message);
        return;
      }
      
      console.log("Comment created successfully:", newComment);
      
      // Step 2: Create a link between the comment and the task in the junction table
      const { error: linkError } = await supabase
        .from('comment_task')
        .insert({
          comment_id: newComment.id,
          task_id: id
        });
      
      if (linkError) {
        console.error("Failed to link comment to task:", linkError.message);
        // Consider deleting the comment if linking fails
        return;
      }
      
      console.log("Comment linked to task successfully");
      
      // Update the UI optimistically
      const updatedComments = [...(comments || []), {
        id: newComment.id,
        content: newComment.content,
        author: newComment.author || { 
          id: author_id || 25,
          name: "Current User", 
          avatar: "/assets/avatar.png" 
        },
        createdAt: newComment.created_at
      }];
      
      if (onUpdate) {
        onUpdate({ ...record, comments: updatedComments });
      }
      
      // Refresh the task to get the updated comments
      const { data: refreshedTask } = await fetchTaskById(id);
      if (refreshedTask) {
        onUpdate?.(refreshedTask);
      }
    } catch (err) {
      console.error("Error adding comment:", err);
    }
  };

  return (
    <>
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
        {/* Breadcrumbs for navigation when viewing a child task */}
        {effectiveParentTask && (
          <Box sx={{ px: 3, pt: 2 }}>
            <Breadcrumbs separator="›">
              <Link
                component="button"
                variant="body2"
                onClick={() => {
                  // Close the current modal
                  onClose?.();
                  
                  // Open the parent task modal
                  setTimeout(() => {
                    // Use the openModal function from the useModal hook
                    openModal('edit', { 
                      config,
                      recordId: effectiveParentTask.id,
                      onRefresh: () => {}
                    });
                  }, 100);
                }}
                sx={{ display: 'flex', alignItems: 'center' }}
              >
                <ArrowLeftIcon size={16} style={{ marginRight: 4 }} />
                {effectiveParentTask.title || 'Parent Task'}
              </Link>
              <Typography variant="body2" color="text.primary">
                {title || 'Current Task'}
              </Typography>
            </Breadcrumbs>
          </Box>
        )}
        
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
              Task #{typeof id === 'string' ? id.substring(0, 8) : id}
            </Typography>
            
            <Select
              value={status || 'todo'}
              size="small"
              onChange={(e) => handleTaskUpdate("status", e.target.value)}
              sx={{ 
                minWidth: 150, 
                mr: 2,
                '& .MuiSelect-select': {
                  color: statusColors[status || 'todo'],
                  fontWeight: 'medium'
                }
              }}
              // No custom renderValue needed, we'll style the MenuItem components instead
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
                label={priority ? `${priority.charAt(0).toUpperCase()}${priority.slice(1)}` : 'Normal'} 
                size="small"
                sx={{ 
                  bgcolor: (priorityColors[priority] || '#9e9e9e') + '20',
                  color: priorityColors[priority] || '#9e9e9e',
                  fontWeight: 'medium',
                  '& .MuiChip-icon': {
                    color: priorityColors[priority] || '#9e9e9e'
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
                  if (onUpdate) {
                    onUpdate({ ...record, ...params });
                  }
                }}
                title={title ?? ""}
              />
              
              {/* Subtasks */}
              <Box>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'medium' }}>
                  Subtasks
                </Typography>
                
                {normalizedSubtasks.length > 0 ? (
                  <Stack spacing={2}>
                    <Stack spacing={1}>
                      <Typography color="text.secondary" variant="body2">
                        {countDoneSubtasks(normalizedSubtasks)} of {normalizedSubtasks.length}
                      </Typography>
                      <LinearProgress
                        sx={{ bgcolor: "var(--mui-palette-background-level1)" }}
                        value={(100 / normalizedSubtasks.length) * countDoneSubtasks(normalizedSubtasks)}
                        variant="determinate"
                      />
                    </Stack>
                    <List disablePadding>
                      {normalizedSubtasks.map((subtask) => (
                        <ListItem key={subtask.id} disablePadding>
                          <ListItemButton 
                            dense 
                            onClick={() => handleOpenSubtask(subtask.id)}
                            sx={{ 
                              borderRadius: 1,
                              '&:hover': {
                                bgcolor: 'action.hover'
                              }
                            }}
                          >
                            <ListItemIcon sx={{ minWidth: 36 }}>
                              <Checkbox 
                                edge="start"
                                checked={subtask.done} 
                                onChange={(e) => {
                                  e.stopPropagation(); // Prevent opening the subtask
                                  // Update subtask status
                                  const newStatus = e.target.checked ? 'complete' : 'todo';
                                  updateTask(subtask.id, { status: newStatus })
                                    .then(() => {
                                      // Update the UI optimistically
                                      const updatedSubtasks = normalizedSubtasks.map(st => 
                                        st.id === subtask.id 
                                          ? { ...st, done: e.target.checked, status: newStatus } 
                                          : st
                                      );
                                      
                                      // If we have children array, update it
                                      if (children && children.length > 0) {
                                        const updatedChildren = children.map(child => 
                                          child.id === subtask.id 
                                            ? { ...child, status: newStatus } 
                                            : child
                                        );
                                        onUpdate?.({ ...record, children: updatedChildren });
                                      } 
                                      // Otherwise update subtasks array
                                      else {
                                        onUpdate?.({ ...record, subtasks: updatedSubtasks });
                                      }
                                    })
                                    .catch(err => {
                                      console.error("Failed to update subtask status:", err);
                                    });
                                }}
                                tabIndex={-1}
                                disableRipple
                              />
                            </ListItemIcon>
                            <ListItemText 
                              primary={subtask.title} 
                              sx={{ 
                                textDecoration: subtask.done ? 'line-through' : 'none',
                                color: subtask.done ? 'text.disabled' : 'text.primary'
                              }} 
                            />
                            <CaretRightIcon size={16} color="action" />
                          </ListItemButton>
                        </ListItem>
                      ))}
                    </List>
                  </Stack>
                ) : (
                  <Typography color="text.secondary" variant="body2">
                    No subtasks yet
                  </Typography>
                )}
                
                {/* Inline subtask creation */}
                <Box sx={{ mt: 2 }}>
                  <SubtaskAdd 
                    onAdd={(subtaskTitle) => {
                      if (!id || !subtaskTitle) return;
                      
                      // Create a temporary ID for optimistic UI update
                      const tempId = `temp-${Date.now()}`;
                      
                      // Create a new subtask object
                      const newSubtask = {
                        id: tempId,
                        title: subtaskTitle,
                        done: false,
                        status: 'todo',
                        parent_id: id
                      };
                      
                      // Add to session subtasks for immediate UI update
                      setSessionSubtasks(prev => [...prev, newSubtask]);
                      
                      // Update the record for persistence
                      onUpdate?.({ 
                        ...record, 
                        subtasks: record.subtasks ? [...record.subtasks, newSubtask] : [newSubtask],
                        children: record.children ? [...record.children, newSubtask] : [newSubtask]
                      });
                      
                      // Create the subtask in the database
                      console.log("Creating subtask:", newSubtask);
                      
                      // Call the API to create the subtask
                      createTask({
                        title: subtaskTitle,
                        status: 'todo',
                        parent_id: id,
                        // Copy relevant fields from parent task
                        project_id: record.project_id,
                        company_id: record.company_id,
                        assigned_id: record.assigned_id,
                        author_id: record.author_id || null
                      }).then(({ data, error }) => {
                        if (error) {
                          console.error("Failed to create subtask:", error);
                          // Revert the optimistic update
                          setSessionSubtasks(prev => prev.filter(st => st.id !== tempId));
                          // Notify the user
                          alert("Failed to create subtask: " + error.message);
                        } else {
                          console.log("Subtask created successfully:", data);
                          // Update the UI with the real ID
                          setSessionSubtasks(prev => 
                            prev.map(st => st.id === tempId ? data : st)
                          );
                          
                          // Refresh the parent task to get the updated children
                          fetchTaskById(id).then(({ data: refreshedTask }) => {
                            if (refreshedTask) {
                              onUpdate?.(refreshedTask);
                            }
                          });
                        }
                      });
                    }}
                  />
                </Box>
              </Box>
              
              {/* Comments */}
              <Box>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'medium' }}>
                  Comments
                </Typography>
                
                {comments && comments.length > 0 ? (
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
                    handleCommentAdd(content);
                  }}
                />
              </Box>
            </Stack>
          </Grid>
          
          {/* Right sidebar (30%) */}
          <Grid item xs={12} md={4} sx={{ height: "100%", overflow: "auto", bgcolor: "background.default", p: 3 }}>
            <Stack spacing={3}>
              {/* Created by */}
              {author && (
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1, color: "text.secondary" }}>
                    Created by
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Avatar src={author?.avatar} sx={{ width: 24, height: 24 }} />
                    <Typography variant="body2">
                      {author?.title || author?.name || "Unknown"}
                    </Typography>
                  </Stack>
                </Box>
              )}
              
              {/* Assignee */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, color: "text.secondary" }}>
                  Assignee
                </Typography>
                {assigned_id && assignee ? (
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <Avatar src={assignee.avatar} sx={{ width: 24, height: 24 }}>
                      {assignee.title ? assignee.title.charAt(0) : 'U'}
                    </Avatar>
                    <Typography variant="body2">
                      {assignee.title || `User ${assigned_id}`}
                    </Typography>
                    <IconButton 
                      size="small" 
                      onClick={() => setSelectDialogOpen({ type: 'assignee' })}
                      sx={{ ml: 'auto' }}
                    >
                      <PencilSimpleIcon size={16} />
                    </IconButton>
                  </Stack>
                ) : (
                  <Button 
                    variant="outlined" 
                    sx={{ 
                      borderStyle: 'dashed', 
                      width: '100%',
                      justifyContent: 'center',
                      color: 'text.secondary'
                    }}
                    onClick={() => setSelectDialogOpen({ type: 'assignee' })}
                  >
                    <PlusIcon size={16} />
                  </Button>
                )}
              </Box>
              
              {/* Company */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, color: "text.secondary" }}>
                  Company
                </Typography>
                {record.company_id && record.company_id_details ? (
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <Avatar src={record.company_id_details.logo?.url} sx={{ width: 24, height: 24 }}>
                      {record.company_id_details.title ? record.company_id_details.title.charAt(0) : 'C'}
                    </Avatar>
                    <Typography variant="body2">
                      {record.company_id_details.title || `Company ${record.company_id}`}
                    </Typography>
                    <IconButton 
                      size="small" 
                      onClick={() => setSelectDialogOpen({ type: 'company' })}
                      sx={{ ml: 'auto' }}
                    >
                      <PencilSimpleIcon size={16} />
                    </IconButton>
                  </Stack>
                ) : (
                  <Button 
                    variant="outlined" 
                    sx={{ 
                      borderStyle: 'dashed', 
                      width: '100%',
                      justifyContent: 'center',
                      color: 'text.secondary'
                    }}
                    onClick={() => setSelectDialogOpen({ type: 'company' })}
                  >
                    <PlusIcon size={16} />
                  </Button>
                )}
              </Box>
              
              {/* Project - filtered by company */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, color: "text.secondary" }}>
                  Project
                </Typography>
                {record.project_id && record.project_id_details ? (
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.main' }}>
                      {record.project_id_details.title ? record.project_id_details.title.charAt(0) : 'P'}
                    </Avatar>
                    <Typography variant="body2">
                      {record.project_id_details.title || `Project ${record.project_id}`}
                    </Typography>
                    <IconButton 
                      size="small" 
                      onClick={() => setSelectDialogOpen({ type: 'project' })}
                      sx={{ ml: 'auto' }}
                    >
                      <PencilSimpleIcon size={16} />
                    </IconButton>
                  </Stack>
                ) : (
                  <Button 
                    variant="outlined" 
                    sx={{ 
                      borderStyle: 'dashed', 
                      width: '100%',
                      justifyContent: 'center',
                      color: 'text.secondary'
                    }}
                    onClick={() => setSelectDialogOpen({ type: 'project' })}
                  >
                    Add Project
                  </Button>
                )}
              </Box>
              
              {/* Date Range */}
              <Box>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Date Range
                  </Typography>
                  <FormControlLabel
                    control={
                      <Checkbox
                        size="small"
                        checked={!!record.start_date}
                        onChange={(e) => {
                          if (!e.target.checked) {
                            handleTaskUpdate("start_date", null);
                          } else {
                            // Set a default start date (today)
                            handleTaskUpdate("start_date", new Date().toISOString());
                          }
                        }}
                      />
                    }
                    label={<Typography variant="caption">Show start date</Typography>}
                    sx={{ ml: 'auto' }}
                  />
                </Stack>
                
                {record.start_date && (
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
                  <CalendarIcon size={18} />
                  <Typography variant="body2" sx={{ width: 40, flexShrink: 0 }}>Start:</Typography>
                  <DatePicker 
                    format="MMM D, YYYY" 
                    name="startDate" 
                    value={record.start_date ? dayjs(record.start_date) : null}
                    onChange={(date) => handleTaskUpdate("start_date", date ? date.toISOString() : null)}
                    slotProps={{ 
                      textField: { 
                        size: 'small', 
                        fullWidth: true,
                        sx: { maxWidth: 150 }
                      } 
                    }}
                  />
                </Stack>
                )}
                
                <Stack direction="row" spacing={2} alignItems="center">
                  <CalendarIcon size={18} />
                  <Typography variant="body2" sx={{ width: 40, flexShrink: 0 }}>Due:</Typography>
                  <DatePicker 
                    format="MMM D, YYYY" 
                    name="dueDate" 
                    value={due_date ? dayjs(due_date) : null}
                    onChange={(date) => handleTaskUpdate("due_date", date ? date.toISOString() : null)}
                    slotProps={{ 
                      textField: { 
                        size: 'small', 
                        fullWidth: true,
                        sx: { maxWidth: 150 }
                      } 
                    }}
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
              
              {/* Custom selection modal */}
              <Dialog
                open={!!selectDialogOpen.type}
                onClose={() => setSelectDialogOpen({ type: null })}
                maxWidth="sm"
                fullWidth
              >
                <DialogTitle>
                  Select {selectDialogOpen.type === 'assignee' ? 'Contact' : 
                          selectDialogOpen.type === 'company' ? 'Company' : 
                          selectDialogOpen.type === 'project' ? 'Project' : 
                          selectDialogOpen.type === 'label' ? 'Label' : 
                          selectDialogOpen.type === 'attachment' ? 'Media' : ''}
                </DialogTitle>
                <DialogContent>
                  {selectDialogOpen.type === 'assignee' && (
                    <SelectionList 
                      table="contact"
                      labelField="title"
                      onSelect={(selected) => {
                        handleTaskUpdate("assigned_id", selected.id);
                        setHydratedRecord(prev => ({
                          ...prev, 
                          assigned_id: selected.id,
                          assigned_id_details: selected
                        }));
                        setSelectDialogOpen({ type: null });
                      }}
                    />
                  )}
                  
                  {selectDialogOpen.type === 'company' && (
                    <SelectionList 
                      table="company"
                      labelField="title"
                      onSelect={(selected) => {
                        handleTaskUpdate("company_id", selected.id);
                        setHydratedRecord(prev => ({
                          ...prev, 
                          company_id: selected.id,
                          company_id_details: selected
                        }));
                        setSelectDialogOpen({ type: null });
                      }}
                    />
                  )}
                  
                  {selectDialogOpen.type === 'project' && (
                    <SelectionList 
                      table="project"
                      labelField="title"
                      filters={record.company_id ? [{ field: 'company_id', value: record.company_id }] : []}
                      onSelect={(selected) => {
                        handleTaskUpdate("project_id", selected.id);
                        setHydratedRecord(prev => ({
                          ...prev, 
                          project_id: selected.id,
                          project_id_details: selected
                        }));
                        setSelectDialogOpen({ type: null });
                      }}
                    />
                  )}
                  
                  {selectDialogOpen.type === 'label' && (
                    <SelectionList 
                      table="category"
                      labelField="title"
                      multiSelect
                      onSelect={(selected) => {
                        // Handle multi-select for labels
                        if (!tags || !tags.includes(selected.id)) {
                          supabase
                            .from('category_task')
                            .insert({
                              task_id: id,
                              category_id: selected.id
                            })
                            .then(({ error }) => {
                              if (error) {
                                console.error("Failed to add tag:", error);
                                return;
                              }
                              
                              setHydratedRecord(prev => ({
                                ...prev,
                                tags: [...(prev.tags || []), selected.id],
                                tags_details: [...(prev.tags_details || []), selected]
                              }));
                            });
                        }
                      }}
                    />
                  )}
                  
                  {selectDialogOpen.type === 'attachment' && (
                    <SelectionList 
                      table="media"
                      labelField="title"
                      multiSelect
                      onSelect={(selected) => {
                        // Handle multi-select for attachments
                        const updatedAttachments = [
                          ...(attachments || []),
                          selected
                        ];
                        
                        setHydratedRecord(prev => ({
                          ...prev,
                          attachments: updatedAttachments
                        }));
                      }}
                    />
                  )}
                </DialogContent>
                <DialogActions>
                  <Button onClick={() => setSelectDialogOpen({ type: null })}>Cancel</Button>
                </DialogActions>
              </Dialog>

              {/* Labels/Tags */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, color: "text.secondary" }}>
                  Labels
                </Typography>
                <Box>
                  {/* Display existing labels */}
                  {labels && labels.length > 0 ? (
                    <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: "wrap" }}>
                      {labels.map((label) => (
                        <Chip
                          key={label.id || label}
                          label={label.title || label}
                          size="small"
                          icon={<TagIcon size={14} />}
                          onDelete={() => {
                            // Remove this tag from the junction table
                            if (id && (label.id || label)) {
                              const categoryId = label.id || label;
                              
                              // Delete from the junction table
                              supabase
                                .from('category_task')
                                .delete()
                                .eq('task_id', id)
                                .eq('category_id', categoryId)
                                .then(({ error }) => {
                                  if (error) {
                                    console.error("Failed to remove tag:", error);
                                    return;
                                  }
                                  
                                  // Update the UI
                                  setHydratedRecord(prev => ({
                                    ...prev,
                                    tags: (prev.tags || []).filter(t => t !== categoryId),
                                    tags_details: (prev.tags_details || []).filter(l => 
                                      l.id !== categoryId && l !== categoryId
                                    )
                                  }));
                                });
                            }
                          }}
                        />
                      ))}
                    </Stack>
                  ) : null}
                  
                  {/* Button to add labels */}
                  <Button 
                    variant="outlined" 
                    sx={{ 
                      borderStyle: 'dashed', 
                      width: '100%',
                      justifyContent: 'center',
                      color: 'text.secondary',
                      mb: 2
                    }}
                    onClick={() => setSelectDialogOpen({ type: 'label' })}
                  >
                    Add Labels
                  </Button>
                </Box>
              </Box>
              
              {/* Attachments */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, color: "text.secondary" }}>
                  Attachments
                </Typography>
                <Box>
                  {/* Display existing attachments */}
                  {attachments && attachments.length > 0 ? (
                    <Stack spacing={1} sx={{ mb: 2 }}>
                      {attachments.map((attachment) => (
                        <Paper
                          key={attachment.id}
                          sx={{ borderRadius: 1, p: 1 }}
                          variant="outlined"
                        >
                          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                            <FileIcon size={16} />
                            <Box sx={{ minWidth: 0, flex: 1 }}>
                              <Typography noWrap variant="body2">
                                {attachment.title || attachment.name || `File ${attachment.id}`}
                              </Typography>
                              <Typography color="text.secondary" variant="caption">
                                {attachment.size}
                              </Typography>
                            </Box>
                            <IconButton 
                              size="small" 
                              onClick={() => {
                                // Remove this attachment
                                if (id && attachment.id) {
                                  // We should handle this through a junction table, but for now
                                  // we'll just update the UI
                                  const updatedAttachments = attachments.filter(a => a.id !== attachment.id);
                                  
                                  // Update the UI
                                  setHydratedRecord(prev => ({
                                    ...prev, 
                                    attachments: updatedAttachments
                                  }));
                                }
                              }}
                            >
                              <XIcon size={16} />
                            </IconButton>
                          </Stack>
                        </Paper>
                      ))}
                    </Stack>
                  ) : null}
                  
                  {/* Button to add attachments */}
                  <Button 
                    variant="outlined" 
                    sx={{ 
                      borderStyle: 'dashed', 
                      width: '100%',
                      justifyContent: 'center',
                      color: 'text.secondary',
                      mb: 2
                    }}
                    onClick={() => setSelectDialogOpen({ type: 'attachment' })}
                  >
                    Add Attachments
                  </Button>
                </Box>
              </Box>
              
              {/* Delete button */}
              <Box sx={{ mt: 2 }}>
                <Button
                  color="error"
                  onClick={() => {
                    if (onDelete) {
                      onDelete(id);
                    }
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

    </>
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
  // Extract data from comment object, handling different formats
  const author = comment.author || comment.author_id_details || { 
    id: comment.author_id, 
    title: "User " + comment.author_id 
  };
  
  const content = comment.content;
  const createdAt = comment.createdAt || comment.created_at;
  const replies = comment.comments || comment.replies || [];
  
  // Format the author name
  const authorName = author.title || 
    (author.first_name && author.last_name 
      ? `${author.first_name} ${author.last_name}` 
      : `User ${author.id}`);
  
  // Get avatar URL
  const avatarUrl = author.thumbnail_media?.url || 
    author.avatar || 
    "/assets/avatar.png";
  
  // Determine if the current user can reply
  const canReply = true; // Simplified for now

  return (
    <Stack direction="row" spacing={2}>
      <Box sx={{ display: "flex", flexDirection: "column" }}>
        <Avatar src={avatarUrl}>
          {/* Fallback to initials if no avatar */}
          {!avatarUrl && authorName.charAt(0)}
        </Avatar>
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
            <Typography variant="subtitle2">{authorName}</Typography>
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
        {replies?.length ? (
          <Stack spacing={2}>
            {replies.map((subComment, index) => (
              <CommentItem comment={subComment} connector={index < replies.length - 1} key={subComment.id} />
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

// Selection List component for relationship fields
function SelectionList({ table, labelField = 'title', filters = [], multiSelect = false, onSelect }) {
  const [options, setOptions] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [selected, setSelected] = React.useState(multiSelect ? [] : null);
  
  // Fetch options from the database
  React.useEffect(() => {
    const fetchOptions = async () => {
      try {
        setLoading(true);
        
        // Build the query
        let query = supabase.from(table).select(`id, ${labelField}`);
        
        // Apply filters if any
        filters.forEach(filter => {
          if (filter.field && filter.value !== undefined) {
            query = query.eq(filter.field, filter.value);
          }
        });
        
        // Execute the query
        const { data, error } = await query;
        
        if (error) {
          console.error(`Error fetching ${table} options:`, error);
          setError(`Failed to load options: ${error.message}`);
        } else {
          setOptions(data || []);
        }
      } catch (err) {
        console.error(`Error in fetchOptions for ${table}:`, err);
        setError(`An unexpected error occurred: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOptions();
  }, [table, labelField, JSON.stringify(filters)]);
  
  // Handle selection
  const handleSelect = (option) => {
    if (multiSelect) {
      // For multi-select, toggle the selection
      const isSelected = selected.some(item => item.id === option.id);
      if (isSelected) {
        setSelected(selected.filter(item => item.id !== option.id));
      } else {
        setSelected([...selected, option]);
      }
    } else {
      // For single select, just set the selected option
      setSelected(option);
      // Call the onSelect callback
      onSelect(option);
    }
  };
  
  // Handle confirm for multi-select
  const handleConfirm = () => {
    if (multiSelect && selected.length > 0) {
      // For multi-select, call onSelect with all selected options
      selected.forEach(option => {
        onSelect(option);
      });
    }
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }
  
  if (options.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography>No options available</Typography>
      </Box>
    );
  }
  
  return (
    <Box>
      <List>
        {options.map(option => (
          <ListItem 
            key={option.id}
            disablePadding
            secondaryAction={
              multiSelect ? (
                <Checkbox
                  edge="end"
                  checked={selected.some(item => item.id === option.id)}
                  onChange={() => handleSelect(option)}
                />
              ) : (
                <Radio
                  edge="end"
                  checked={selected && selected.id === option.id}
                  onChange={() => handleSelect(option)}
                />
              )
            }
          >
            <ListItemButton onClick={() => handleSelect(option)}>
              <ListItemText primary={option[labelField] || `Item ${option.id}`} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      
      {multiSelect && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Button 
            variant="contained" 
            disabled={selected.length === 0}
            onClick={handleConfirm}
          >
            Confirm Selection ({selected.length})
          </Button>
        </Box>
      )}
    </Box>
  );
}

// Component for adding a new subtask
function SubtaskAdd({ onAdd }) {
  const [isAdding, setIsAdding] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const inputRef = React.useRef(null);
  
  // Focus the input when isAdding becomes true
  React.useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAdding]);
  
  const handleAdd = React.useCallback(() => {
    if (!title) {
      setIsAdding(false);
      return;
    }
    
    onAdd?.(title);
    setTitle("");
    setIsAdding(false);
  }, [title, onAdd]);
  
  if (isAdding) {
    return (
      <Stack spacing={1}>
        <OutlinedInput
          ref={inputRef}
          placeholder="Subtask title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleAdd();
            } else if (e.key === 'Escape') {
              setIsAdding(false);
              setTitle("");
            }
          }}
          size="small"
          fullWidth
        />
        <Stack direction="row" spacing={1}>
          <Button 
            variant="contained" 
            size="small"
            onClick={handleAdd}
          >
            Add
          </Button>
          <Button 
            variant="text" 
            size="small"
            onClick={() => {
              setIsAdding(false);
              setTitle("");
            }}
          >
            Cancel
          </Button>
        </Stack>
      </Stack>
    );
  }
  
  return (
    <Button 
      color="primary" 
      startIcon={<PlusIcon />} 
      variant="outlined"
      size="small"
      onClick={() => setIsAdding(true)}
    >
      Add subtask
    </Button>
  );
}