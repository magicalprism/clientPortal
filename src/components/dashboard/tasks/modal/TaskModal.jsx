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
import { Info as InfoIcon } from "@phosphor-icons/react/dist/ssr/Info";
import { PaperPlaneTilt as PaperPlaneTiltIcon } from "@phosphor-icons/react/dist/ssr/PaperPlaneTilt";
import { PencilSimple as PencilSimpleIcon } from "@phosphor-icons/react/dist/ssr/PencilSimple";
import { Plus as PlusIcon } from "@phosphor-icons/react/dist/ssr/Plus";
import { Tag as TagIcon } from "@phosphor-icons/react/dist/ssr/Tag";
import { X as XIcon } from "@phosphor-icons/react/dist/ssr/X";
import { Eye } from "@phosphor-icons/react/dist/ssr/Eye";
import { Trash } from "@phosphor-icons/react/dist/ssr/Trash";
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
import { GalleryRelationshipFieldRenderer } from '@/components/fields/media/GalleryRelationshipFieldRenderer';
import { MultiRelationshipFieldRenderer } from '@/components/fields/relationships/multi/MultiRelationshipFieldRenderer.jsx';
import { SimpleMultiRelationshipField } from '@/components/fields/relationships/multi/SimpleMultiRelationshipField';
import { CustomFieldRenderer } from '@/components/fields/custom/CustomFieldRenderer';
import { saveMultiRelationshipField } from '@/lib/supabase/queries/pivot/multirelationship';
import * as collections from '@/collections';

export default function TaskModal({ onClose, onDelete, onUpdate, open, record, config, debug = false }) {
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
    label: false,
    resource: false
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
            // Only log in debug mode
            if (debug) {
              console.log("Fetched child tasks:", children);
            }
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
  
  // Normalize subtasks data - with optimized dependencies and conditional logging
  const normalizedSubtasks = React.useMemo(() => {
    // Only log in debug mode
    if (debug) {
      console.log('Normalizing subtasks:', { sessionSubtasks, subtasks, children, childTasks });
    }
    
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
    
    // Only log in debug mode
    if (debug) {
      console.log('Normalized subtasks result:', result);
    }
    
    return result;
  }, [subtasks, children, sessionSubtasks, childTasks, debug]);
  
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
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <IconButton 
                                size="small" 
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent opening the subtask
                                  handleOpenSubtask(subtask.id);
                                }}
                                title="View subtask"
                              >
                                <Eye size={16} />
                              </IconButton>
                              <IconButton 
                                size="small" 
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent opening the subtask
                                  // Delete the subtask
                                  if (confirm(`Are you sure you want to delete "${subtask.title}"?`)) {
                                    updateTask(subtask.id, { is_deleted: true })
                                      .then(() => {
                                        // Update the UI by removing the subtask
                                        const updatedSubtasks = normalizedSubtasks.filter(st => st.id !== subtask.id);
                                        
                                        // If we have children array, update it
                                        if (children && children.length > 0) {
                                          const updatedChildren = children.filter(child => child.id !== subtask.id);
                                          onUpdate?.({ ...record, children: updatedChildren });
                                        } 
                                        // Otherwise update subtasks array
                                        else {
                                          onUpdate?.({ ...record, subtasks: updatedSubtasks });
                                        }
                                      })
                                      .catch(err => {
                                        console.error("Failed to delete subtask:", err);
                                      });
                                  }
                                }}
                                title="Delete subtask"
                                color="error"
                              >
                                <Trash size={16} />
                              </IconButton>
                            </Box>
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
                <CustomFieldRenderer
                  field={{
                    component: 'CommentThread',
                    props: {
                      entity: 'task'
                    }
                  }}
                  record={hydratedRecord}
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
                <Stack direction="row" spacing={1} alignItems="left" sx={{ mb: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Date Range
                  </Typography>
                 
      
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
                <Stack >
                  <FormControlLabel
                  sx={{mt: 1}}
                    control={
                      <Checkbox
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
                    label={<Typography variant="subtitle2">Show start date</Typography>}
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
                maxWidth="xs"
                sx={{
                  "& .MuiDialog-paper": { 
                    width: "50%", 
                    maxHeight: "60%",
                    maxWidth: "300px",
                    p: 2,
                  }
                }}
              >
                <DialogTitle
                sx={{px: 2}}
                >
                  Select {selectDialogOpen.type === 'assignee' ? 'Contact' : 
                          selectDialogOpen.type === 'company' ? 'Company' : 
                          selectDialogOpen.type === 'project' ? 'Project' : 
                          selectDialogOpen.type === 'label' ? 'Label' : 
                          selectDialogOpen.type === 'attachment' ? 'Media' :
                          selectDialogOpen.type === 'resource' ? 'Resource' : ''}
                </DialogTitle>
                <DialogContent
                sx={{
                  p: 0, 
                  pr: 1,

                }}
                >
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
                        // Check if this media is already selected
                        const mediaId = selected.id;
                        const isAlreadySelected = attachments && 
                          attachments.some(a => 
                            (typeof a === 'object' ? a.id === mediaId : a === mediaId)
                          );
                        
                        if (!isAlreadySelected) {
                          // Add the media to the UI
                          const updatedAttachments = [
                            ...(attachments || []),
                            selected
                          ];
                          
                          // Update the UI
                          setHydratedRecord(prev => ({
                            ...prev,
                            attachments: updatedAttachments
                          }));
                          
                          // If we have an ID, create a link in the junction table
                          if (id) {
                            // Create a link in the junction table
                            supabase
                              .from('media_task')
                              .insert({
                                task_id: id,
                                media_id: mediaId
                              })
                              .then(({ error }) => {
                                if (error) {
                                  console.error("Failed to link media to task:", error);
                                  // Show the error to help debugging
                                  alert(`Failed to link media to task: ${JSON.stringify(error)}`);
                                  return;
                                }
                                
                                console.log("Media linked to task successfully");
                              });
                          }
                        }
                      }}
                    />
                  )}
                  
                  {selectDialogOpen.type === 'resource' && (
                    <SelectionList 
                      table="resource"
                      labelField="title"
                      multiSelect
                      onSelect={(selected) => {
                        // Handle multi-select for resources
                        // First check if this resource is already selected
                        const isAlreadySelected = record.resources && 
                          record.resources.some(r => 
                            r.id === selected.id || r === selected.id
                          );
                        
                        if (!isAlreadySelected) {
                          // Add the resource to the record
                          const updatedResources = [
                            ...(record.resources || []),
                            selected
                          ];
                          
                          // Update the UI
                          setHydratedRecord(prev => ({
                            ...prev,
                            resources: updatedResources
                          }));
                          
                          // If we have an ID, update the task in the database
                          if (id) {
                                      // Create a link in the junction table
                                      supabase
                                        .from('resource_task')
                                        .insert({
                                          task_id: id,
                                          resource_id: selected.id
                                        })
                                        .then(({ error }) => {
                                          if (error) {
                                            console.error("Failed to link resource to task:", error);
                                            alert(`Failed to link resource to task: ${JSON.stringify(error)}`);
                                            return;
                                          }
                                          
                                          console.log("Resource linked to task successfully");
                                          
                                          // Refresh the task to get updated resources
                                          fetchTaskById(id).then(({ data: refreshedTask }) => {
                                            if (refreshedTask) {
                                              onUpdate?.(refreshedTask);
                                            }
                                          });
                                        });
                          }
                        }
                        
                        // Don't close the dialog to allow selecting multiple resources
                      }}
                    />
                  )}
                </DialogContent>
                <DialogActions>
                  <Button onClick={() => setSelectDialogOpen({ type: null })}>Cancel</Button>
                </DialogActions>
              </Dialog>

              {/* Labels/Tags using SimpleMultiRelationshipField to avoid infinite loop */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, color: "text.secondary" }}>
                  Labels
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <SimpleMultiRelationshipField
                    field={config?.fields?.find(f => f.name === 'tags')}
                    value={tags || []}
                    record={{
                      ...record,
                      id: id,
                      tags_details: labels || []
                    }}
                    config={config}
                    onChange={(newValue) => {
                        console.log("Tags changed (SimpleMultiRelationshipField):", newValue);
                        
                        // Update the UI immediately for responsiveness
                        setHydratedRecord(prev => ({
                          ...prev,
                          tags: newValue.ids,
                          tags_details: newValue.details
                        }));
                        
                        // If we have an ID, update the database
                        if (id) {
                          // Use the proper query function to save the relationship
                          const fieldDef = config?.fields?.find(f => f.name === 'tags');
                          saveMultiRelationshipField('task', id, 'tags', newValue.ids, fieldDef)
                            .then(result => {
                              if (!result.success) {
                                console.error("Failed to save tags:", result.error);
                              } else {
                                console.log("Tags saved successfully:", result);
                                // Don't refresh the task to avoid infinite loops
                              }
                            });
                        }
                    }}
                  />
                </Box>
              </Box>
              
              {/* Attachments using GalleryRelationshipFieldRenderer with SimpleThumbnailTemplate */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, color: "text.secondary" }}>
                  Attachments
                </Typography>
                <Box>
                  <GalleryRelationshipFieldRenderer
                    field={{
                      name: 'attachments',
                      label: 'All Media',
                      type: 'galleryRelationship',
                      displayOptions: {
                      gridSize: 'large', // Set to large for 2 items per row
                        showTitle: 'icon-only', // Only show title for icon/folder types
                        showType: false, // Don't show type
                        hideStatus: true,
                        hideDescription: true,
                        compactMode: true,
                        squareThumbnails: true,
                        thumbnailAspectRatio: '1:1',
                        thumbnailTemplate: 'simple' // Use the simple template
                      },
                      relation: {
                        table: 'media',
                        labelField: 'title',
                        junctionTable: 'media_task',
                        sourceKey: 'task_id',
                        targetKey: 'media_id',
                        foreignKey: 'task_id'
                      },
                      parentId: id,
                      parentTable: 'task'
                    }}
                    value={attachments || []}
                    record={{
                      ...record,
                      id: id
                    }}
                    config={config}
                    editable={true}
                    isEditing={true}
                    sx={{
                      '& .media-gallery-grid': {
                        gridTemplateColumns: 'repeat(2, 1fr) !important', // 2 columns as requested
                      },
                      '& .media-item': {
                        display: 'flex',
                        justifyContent: 'center',
                        padding: '8px 0'
                      }
                    }}
                    onChange={(newAttachments) => {
                      // Update the record with the new attachments
                      setHydratedRecord(prev => ({
                        ...prev,
                        attachments: newAttachments
                      }));
                      
                      // If we have an ID, update the task in the database
                      if (id) {
                        handleTaskUpdate("attachments", newAttachments);
                      }
                    }}
                  />
                </Box>
              </Box>
              
              {/* Resources using SimpleMultiRelationshipField to avoid infinite loop */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, color: "text.secondary" }}>
                  Resources
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <SimpleMultiRelationshipField
                    field={config?.fields?.find(f => f.name === 'resources')}
                    value={record.resources || []}
                    record={{
                      ...record,
                      id: id,
                      resources_details: record.resources_details || record.resources || []
                    }}
                    config={config}
                    onChange={(newValue) => {
                      console.log("Resources changed (SimpleMultiRelationshipField):", newValue);
                      
                      // Update the UI immediately for responsiveness
                      setHydratedRecord(prev => ({
                        ...prev,
                        resources: newValue.ids,
                        resources_details: newValue.details
                      }));
                      
                      // If we have an ID, update the database
                      if (id) {
                        // Use the proper query function to save the relationship
                        const fieldDef = config?.fields?.find(f => f.name === 'resources');
                        saveMultiRelationshipField('task', id, 'resources', newValue.ids, fieldDef)
                          .then(result => {
                            if (!result.success) {
                              console.error("Failed to save resources:", result.error);
                            } else {
                              console.log("Resources saved successfully:", result);
                              // Don't refresh the task to avoid infinite loops
                            }
                          });
                      }
                    }}
                  />
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



function countDoneSubtasks(subtasks = []) {
  return subtasks.reduce((acc, curr) => acc + (curr.done ? 1 : 0), 0);
}

// Selection List component for relationship fields with hierarchical display
function SelectionList({ table, labelField = 'title', filters = [], multiSelect = false, onSelect }) {
  const [options, setOptions] = React.useState([]);
  const [hierarchicalOptions, setHierarchicalOptions] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [selected, setSelected] = React.useState(multiSelect ? [] : null);
  
  // Memoize filters to prevent unnecessary re-renders
  const memoizedFilters = React.useMemo(() => filters, [JSON.stringify(filters)]);
  
  // Memoize the fetchOptions function to prevent unnecessary re-renders
  const fetchOptions = React.useCallback(async () => {
    try {
      setLoading(true);
      
      // Build the query
      // Include parent_id and description for hierarchical organization and hover info
      let query = supabase.from(table).select(`id, ${labelField}, parent_id, description`);
      
      // Apply filters if any
      memoizedFilters.forEach(filter => {
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
        
        // Organize data into hierarchical structure
        const hierarchical = organizeHierarchy(data || []);
        setHierarchicalOptions(hierarchical);
      }
    } catch (err) {
      console.error(`Error in fetchOptions for ${table}:`, err);
      setError(`An unexpected error occurred: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [table, labelField, memoizedFilters, organizeHierarchy]);
  
  // Fetch options from the database only when the component mounts or when the dependencies change
  React.useEffect(() => {
    // Use a flag to prevent duplicate fetches
    let isMounted = true;
    
    // Add a small delay to prevent rapid consecutive API calls
    const timeoutId = setTimeout(() => {
      if (isMounted) {
        fetchOptions();
      }
    }, 100);
    
    // Cleanup function to prevent memory leaks
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [fetchOptions]);
  
  // Memoize the organizeHierarchy function to prevent unnecessary re-renders
  const organizeHierarchy = React.useCallback((data) => {
    // First, sort all items alphabetically by the label field
    const sortedData = [...data].sort((a, b) => {
      const labelA = a[labelField]?.toLowerCase() || '';
      const labelB = b[labelField]?.toLowerCase() || '';
      return labelA.localeCompare(labelB);
    });
    
    // Create a map for quick lookup
    const itemMap = new Map();
    sortedData.forEach(item => {
      itemMap.set(item.id, { ...item, children: [] });
    });
    
    // Build the hierarchy
    const rootItems = [];
    
    sortedData.forEach(item => {
      const mappedItem = itemMap.get(item.id);
      
      if (item.parent_id && itemMap.has(item.parent_id)) {
        // This is a child item, add it to its parent
        const parent = itemMap.get(item.parent_id);
        parent.children.push(mappedItem);
      } else {
        // This is a root item
        rootItems.push(mappedItem);
      }
    });
    
    // Sort children at each level alphabetically
    const sortChildren = (items) => {
      items.forEach(item => {
        if (item.children && item.children.length > 0) {
          item.children.sort((a, b) => {
            const labelA = a[labelField]?.toLowerCase() || '';
            const labelB = b[labelField]?.toLowerCase() || '';
            return labelA.localeCompare(labelB);
          });
          sortChildren(item.children); // Recursively sort grandchildren
        }
      });
    };
    
    sortChildren(rootItems);
    
    return rootItems;
  }, [labelField]);
  
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
  
  // Recursive function to render hierarchical items
  const renderHierarchicalItems = (items, level = 0) => {
    return items.map(item => (
      <React.Fragment key={item.id}>
        <ListItem 
          disablePadding
          secondaryAction={
            multiSelect ? (
              <Checkbox
                edge="end"
                checked={selected.some(selectedItem => selectedItem.id === item.id)}
                onChange={() => handleSelect(item)}
              />
            ) : (
              <Radio
                edge="end"
                checked={selected && selected.id === item.id}
                onChange={() => handleSelect(item)}
              />
            )
          }
        >
          {item.description ? (
            <Tooltip 
              title={item.description} 
              placement="right"
              enterDelay={500}
              arrow
            >
              <ListItemButton 
                onClick={() => handleSelect(item)}
                sx={{ pl: 2 + level * 2 }} // Indent based on hierarchy level
              >
                <ListItemText 
                  primary={item[labelField] || `Item ${item.id}`}
                  primaryTypographyProps={{
                    fontWeight: level === 0 ? 'medium' : 'normal'
                  }}
                  secondary={item.description ? 
                    // Use a string instead of a Box component to avoid nesting div in p
                    "Description available" 
                    : undefined
                  }
                />
              </ListItemButton>
            </Tooltip>
          ) : (
            <ListItemButton 
              onClick={() => handleSelect(item)}
              sx={{ pl: 2 + level * 2 }} // Indent based on hierarchy level
            >
              <ListItemText 
                primary={item[labelField] || `Item ${item.id}`}
                primaryTypographyProps={{
                  fontWeight: level === 0 ? 'medium' : 'normal'
                }}
              />
            </ListItemButton>
          )}
        </ListItem>
        
        {/* Render children recursively */}
        {item.children && item.children.length > 0 && (
          renderHierarchicalItems(item.children, level + 1)
        )}
      </React.Fragment>
    ));
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
        {renderHierarchicalItems(hierarchicalOptions)}
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