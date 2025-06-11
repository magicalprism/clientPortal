// TaskTemplateNode.js - Recursive draggable task node component

import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Chip,
  Checkbox,
  Collapse,
  TextField,
  Tooltip,
  Stack,
  alpha,
} from '@mui/material';
import {
  CaretDown,
  CaretRight,
  DotsSixVertical,
  Plus,
  Pencil,
  Timer,
  CheckSquare,
} from '@phosphor-icons/react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const TaskTemplateNode = ({
  task,
  level = 0,
  onEdit,
  onToggleSelection,
  onAddChild,
  onUpdateTitle,
  onToggleComplete,
  selectedTasks = [],
  milestoneColor = '#1976d2',
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({
    id: task.id.toString(),
    data: {
      type: 'task',
      task,
      level,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const hasChildren = task.children && task.children.length > 0;
  const isSelected = selectedTasks.includes(task.id);
  const indentWidth = level * 24;

  const handleToggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleTitleSave = () => {
    if (editTitle.trim() && editTitle !== task.title) {
      onUpdateTitle(task.id, editTitle.trim());
    }
    setIsEditing(false);
  };

  const handleTitleCancel = () => {
    setEditTitle(task.title);
    setIsEditing(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      handleTitleCancel();
    }
  };

  const getStatusColor = (status) => {
    const statusColors = {
      'todo': '#ed6c02',
      'in_progress': '#1976d2',
      'complete': '#2e7d32',
      'blocked': '#d32f2f',
      'on_hold': '#7b1fa2',
    };
    return statusColors[status] || '#666';
  };

  const formatDuration = (minutes) => {
    if (!minutes) return null;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <Box ref={setNodeRef} style={style}>
      <Paper
        elevation={isDragging ? 8 : 1}
        sx={{
          mb: 0.5,
          ml: `${indentWidth}px`,
          border: isOver ? `2px dashed ${milestoneColor}` : '1px solid',
          borderColor: isOver ? milestoneColor : 'divider',
          backgroundColor: isSelected ? alpha(milestoneColor, 0.1) : 'background.paper',
          transition: 'all 0.2s ease',
          cursor: isDragging ? 'grabbing' : 'default',
          '&:hover': {
            borderColor: milestoneColor,
            boxShadow: `0 2px 8px ${alpha(milestoneColor, 0.2)}`,
          },
        }}
      >
        <Box sx={{ p: 1.5 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            {/* Drag Handle */}
            <IconButton
              size="small"
              {...attributes}
              {...listeners}
              sx={{
                cursor: 'grab',
                color: 'text.secondary',
                '&:hover': { color: milestoneColor },
                '&:active': { cursor: 'grabbing' },
              }}
            >
              <DotsSixVertical size={16} />
            </IconButton>

            {/* Selection Checkbox */}
            <Checkbox
              size="small"
              checked={isSelected}
              onChange={(e) => onToggleSelection(task.id, e.target.checked)}
              sx={{
                color: milestoneColor,
                '&.Mui-checked': { color: milestoneColor },
              }}
            />

            {/* Complete Task Button */}
            <Tooltip title={task.status === 'complete' ? 'Mark as incomplete' : 'Mark as complete'}>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onToggleComplete) {
                    onToggleComplete(task.id, task.status);
                  }
                }}
                sx={{
                  color: task.status === 'complete' ? '#2e7d32' : 'text.secondary',
                  '&:hover': { 
                    color: task.status === 'complete' ? '#1b5e20' : '#2e7d32' 
                  },
                }}
              >
                <CheckSquare 
                  size={16} 
                  weight={task.status === 'complete' ? 'fill' : 'regular'}
                />
              </IconButton>
            </Tooltip>

            {/* Expand/Collapse Button */}
            {hasChildren && (
              <IconButton
                size="small"
                onClick={handleToggleExpanded}
                sx={{ color: 'text.secondary' }}
              >
                {isExpanded ? <CaretDown size={16} /> : <CaretRight size={16} />}
              </IconButton>
            )}

            {/* Spacer for alignment when no children */}
            {!hasChildren && <Box sx={{ width: 32 }} />}

            {/* Task Title */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              {isEditing ? (
                <TextField
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onBlur={handleTitleSave}
                  onKeyDown={handleKeyPress}
                  variant="standard"
                  size="small"
                  autoFocus
                  fullWidth
                  sx={{
                    '& .MuiInput-underline:before': {
                      borderBottomColor: milestoneColor,
                    },
                    '& .MuiInput-underline:after': {
                      borderBottomColor: milestoneColor,
                    },
                  }}
                />
              ) : (
                <Typography
                  variant="body2"
                  onClick={() => onEdit(task)}
                  sx={{
                    cursor: 'pointer',
                    fontWeight: level === 0 ? 600 : 400,
                    color: level === 0 ? 'text.primary' : 'text.secondary',
                    '&:hover': {
                      color: milestoneColor,
                      textDecoration: 'underline',
                    },
                  }}
                >
                  {task.title}
                </Typography>
              )}
            </Box>

            {/* Task Metadata */}
            <Stack direction="row" spacing={0.5} alignItems="center">
              {/* Status Chip */}
              {task.status && (
                <Chip
                  label={task.status.replace('_', ' ')}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.7rem',
                    backgroundColor: alpha(getStatusColor(task.status), 0.1),
                    color: getStatusColor(task.status),
                    border: `1px solid ${alpha(getStatusColor(task.status), 0.3)}`,
                  }}
                />
              )}

              {/* Duration */}
              {task.estimated_duration && (
                <Tooltip title="Estimated Duration">
                  <Chip
                    icon={<Timer size={12} />}
                    label={formatDuration(task.estimated_duration)}
                    size="small"
                    variant="outlined"
                    sx={{ height: 20, fontSize: '0.7rem' }}
                  />
                </Tooltip>
              )}

              {/* Action Buttons */}
              <Stack direction="row" spacing={0}>
                <Tooltip title="Edit Task">
                  <IconButton
                    size="small"
                    onClick={handleEditClick}
                    sx={{
                      color: 'text.secondary',
                      '&:hover': { color: milestoneColor },
                    }}
                  >
                    <Pencil size={14} />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Add Subtask">
                  <IconButton
                    size="small"
                    onClick={() => onAddChild(task.id)}
                    sx={{
                      color: 'text.secondary',
                      '&:hover': { color: milestoneColor },
                    }}
                  >
                    <Plus size={14} />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Stack>
          </Stack>

          {/* Task Description Preview */}
          {task.description && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display: 'block',
                mt: 0.5,
                ml: `${32 + (hasChildren ? 32 : 32)}px`,
                fontStyle: 'italic',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {task.description}
            </Typography>
          )}
        </Box>
      </Paper>

      {/* Children */}
      {hasChildren && (
        <Collapse in={isExpanded}>
          <Box sx={{ mt: 0.5 }}>
            {task.children.map((child) => (
              <TaskTemplateNode
                key={child.id}
                task={child}
                level={level + 1}
                onEdit={onEdit}
                onToggleSelection={onToggleSelection}
                onAddChild={onAddChild}
                onUpdateTitle={onUpdateTitle}
                selectedTasks={selectedTasks}
                milestoneColor={milestoneColor}
              />
            ))}
          </Box>
        </Collapse>
      )}
    </Box>
  );
};

export default TaskTemplateNode;