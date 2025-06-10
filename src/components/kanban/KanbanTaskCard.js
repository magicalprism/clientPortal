import { useState } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Chip, 
  Avatar,
  IconButton,
  Tooltip,
  LinearProgress
} from '@mui/material';
import { 
  Calendar,
  User,
  Flag,
  ChatCircle,
  CheckCircle,
  Clock
} from '@phosphor-icons/react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format, isToday, isPast, parseISO } from 'date-fns';

export function KanbanTaskCard({ 
  task,
  onEdit,
  onToggleComplete,
  config,
  isDragging = false
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: sortableIsDragging,
  } = useSortable({ id: `task-${task.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging || sortableIsDragging ? 0.5 : 1,
  };

  // Get status color from config
  const getStatusColor = (status) => {
    const statusField = config?.fields?.find(f => f.name === 'status');
    const statusOption = statusField?.options?.find(opt => opt.value === status);
    return statusOption?.color || 'default';
  };

  // Get priority color
  const getPriorityColor = (urgency) => {
    switch (urgency) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  // Format due date
  const formatDueDate = (dateString) => {
    if (!dateString) return null;
    
    const date = parseISO(dateString);
    const isOverdue = isPast(date) && !task.is_complete;
    
    return {
      formatted: isToday(date) ? 'Today' : format(date, 'MMM d'),
      isOverdue,
      isToday: isToday(date)
    };
  };

  const dueDate = formatDueDate(task.due_date);

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      sx={{
        mb: 1,
        cursor: 'grab',
        '&:hover': {
          boxShadow: 2,
          transform: 'translateY(-1px)',
        },
        '&:active': {
          cursor: 'grabbing',
        },
        transition: 'all 0.2s ease',
        border: task.is_complete ? '1px solid' : 'none',
        borderColor: task.is_complete ? 'success.main' : 'transparent',
        opacity: task.is_complete ? 0.7 : 1
      }}
      onClick={onEdit}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        {/* Task Title */}
        <Typography
          variant="subtitle2"
          sx={{
            mb: 1,
            fontWeight: 500,
            textDecoration: task.is_complete ? 'line-through' : 'none',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            lineHeight: 1.3
          }}
        >
          {task.title}
        </Typography>

        {/* Task Description (if exists) */}
        {task.content && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              mb: 2,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {task.content}
          </Typography>
        )}

        {/* Task Meta */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {/* Status and Priority */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              size="small"
              label={task.status}
              color={getStatusColor(task.status)}
              variant="outlined"
              sx={{ fontSize: '0.7rem', height: 20 }}
            />
            
            {task.urgency && (
              <Chip
                size="small"
                label={task.urgency}
                color={getPriorityColor(task.urgency)}
                variant="filled"
                sx={{ fontSize: '0.7rem', height: 20 }}
              />
            )}

            {task.task_type && task.task_type !== 'task' && (
              <Chip
                size="small"
                label={task.task_type}
                variant="outlined"
                sx={{ fontSize: '0.7rem', height: 20 }}
              />
            )}
          </Box>

          {/* Bottom Row: Due Date, Assignee, etc. */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Due Date */}
            {dueDate && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Calendar size={12} />
                <Typography
                  variant="caption"
                  color={dueDate.isOverdue ? 'error' : dueDate.isToday ? 'warning.main' : 'text.secondary'}
                  fontWeight={dueDate.isToday || dueDate.isOverdue ? 600 : 400}
                >
                  {dueDate.formatted}
                </Typography>
              </Box>
            )}

            {/* Assignee */}
            {task.assigned_id && (
              <Tooltip title="Assigned to">
                <Avatar sx={{ width: 20, height: 20, fontSize: '0.7rem' }}>
                  <User size={12} />
                </Avatar>
              </Tooltip>
            )}

            {/* Completion Status */}
            {task.is_complete && (
              <CheckCircle size={16} color="var(--mui-palette-success-main)" />
            )}
          </Box>

          {/* Progress bar for subtasks (if available) */}
          {task.subtask_count && task.subtask_count > 0 && (
            <Box>
              <LinearProgress
                variant="determinate"
                value={(task.completed_subtasks || 0) / task.subtask_count * 100}
                sx={{ height: 4, borderRadius: 2 }}
              />
              <Typography variant="caption" color="text.secondary">
                {task.completed_subtasks || 0}/{task.subtask_count} subtasks
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}