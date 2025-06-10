// components/kanban/KanbanTaskCard.js
'use client';

import {
  Card,
  CardContent,
  Typography,
  Chip,
  Stack,
  Avatar,
  Box,
  IconButton,
  Checkbox,
  Tooltip
} from '@mui/material';
import { 
  Calendar, 
  User, 
  Flag, 
  CheckCircle,
  Circle,
  CaretRight
} from '@phosphor-icons/react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { getStatusColor, getPriorityColor } from '@/data/statusColors';
import { useCollectionSave } from '@/hooks/useCollectionSave';

const SortableTaskCard = ({ 
  task, 
  config, 
  isDragging = false, 
  children, 
  isSubtask = false 
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: sortableIsDragging,
  } = useSortable({
    id: `task-${task.id}`,
    disabled: isSubtask, // Prevent dragging subtasks
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging || sortableIsDragging ? 0.8 : 1,
    cursor: isSubtask ? 'pointer' : (isDragging ? 'grabbing' : 'grab'),
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...(isSubtask ? {} : listeners)}>
      {children}
    </div>
  );
};

export const KanbanTaskCard = ({ 
  task, 
  config, 
  isDragging = false,
  onTaskUpdate,
  onTaskClick
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isCompleting, setIsCompleting] = useState(false);
  
  const isSubtask = !!task.parent_id;
  const statusConfig = getStatusColor(task.status);
  const priorityConfig = getPriorityColor(task.priority);

  const { updateLocalValue, saveRecord } = useCollectionSave({
    config,
    record: task,
    setRecord: (updatedTask) => {
      onTaskUpdate && onTaskUpdate(updatedTask);
    },
    mode: 'edit'
  });

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && task.status !== 'complete';
  };

  const handleTaskClick = (event) => {
    // Don't trigger if clicking on checkbox or other interactive elements
    if (event.target.type === 'checkbox' || event.target.closest('button')) {
      return;
    }

    if (onTaskClick) {
      onTaskClick(task);
    } else {
      // Open CollectionModal
      const currentParams = new URLSearchParams(searchParams.toString());
      currentParams.set('modal', 'edit');
      currentParams.set('id', task.id);
      currentParams.set('collection', 'task');
      router.push(`${window.location.pathname}?${currentParams.toString()}`);
    }
  };

  const handleQuickComplete = async (event) => {
    event.stopPropagation();
    setIsCompleting(true);
    
    try {
      const newStatus = task.status === 'complete' ? 'todo' : 'complete';
      updateLocalValue('status', newStatus);
      await saveRecord();
      
      if (onTaskUpdate) {
        onTaskUpdate({ ...task, status: newStatus });
      }
    } catch (error) {
      console.error('Failed to update task status:', error);
    } finally {
      setIsCompleting(false);
    }
  };

  const getAssigneeAvatar = () => {
    // TODO: Get actual assignee data with thumbnail from contact table
    // For now, show initials or placeholder
    if (task.assigned_id) {
      // In a real implementation, you'd fetch the contact details
      // const assignee = task.assigned_id_details;
      // if (assignee?.thumbnail_id_details?.url) {
      //   return <Avatar src={assignee.thumbnail_id_details.url} sx={{ width: 20, height: 20 }} />;
      // }
      return (
        <Avatar sx={{ width: 20, height: 20, fontSize: '0.7rem', bgcolor: 'primary.main' }}>
          {task.assigned_id.toString().charAt(0).toUpperCase()}
        </Avatar>
      );
    }
    return null;
  };

  const cardContent = (
    <Card 
      elevation={isDragging ? 8 : (isSubtask ? 0 : 1)}
      sx={{ 
        cursor: 'pointer',
        ml: isSubtask ? 2 : 0,
        mb: isSubtask ? 0.5 : 1,
        transform: isSubtask ? 'scale(0.95)' : 'none',
        '&:hover': {
          elevation: isSubtask ? 2 : 3,
          transform: isSubtask ? 'scale(0.97)' : 'translateY(-1px)',
          transition: 'all 0.2s ease'
        },
        '&:active': {
          cursor: 'grabbing'
        },
        border: isDragging ? '2px solid' : '1px solid',
        borderColor: isDragging ? 'primary.main' : 'divider',
        borderLeft: isSubtask ? '3px solid' : 'none',
        borderLeftColor: isSubtask ? 'primary.light' : 'none',
        opacity: task.status === 'complete' ? 0.7 : 1
      }}
      onClick={handleTaskClick}
    >
      <CardContent sx={{ p: isSubtask ? 1.5 : 2, '&:last-child': { pb: isSubtask ? 1.5 : 2 } }}>
        {/* Quick Complete Checkbox & Title */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
          <Tooltip title={task.status === 'complete' ? 'Mark incomplete' : 'Mark complete'}>
            <IconButton
              size="small"
              onClick={handleQuickComplete}
              disabled={isCompleting}
              sx={{ p: 0, mt: 0.25 }}
            >
              {task.status === 'complete' ? (
                <CheckCircle size={16} weight="fill" color={statusConfig.color} />
              ) : (
                <Circle size={16} color="#9CA3AF" />
              )}
            </IconButton>
          </Tooltip>
          
          {isSubtask && (
            <CaretRight size={12} color="#9CA3AF" style={{ marginTop: 4 }} />
          )}
          
          <Typography 
            variant={isSubtask ? 'caption' : 'body2'} 
            fontWeight={isSubtask ? 'normal' : 'medium'}
            sx={{ 
              flex: 1,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              textDecoration: task.status === 'complete' ? 'line-through' : 'none',
              color: task.status === 'complete' ? 'text.secondary' : 'text.primary'
            }}
          >
            {task.title}
          </Typography>
        </Box>

        {/* Status and Priority Chips */}
        {!isSubtask && (
          <Stack direction="row" spacing={1} sx={{ mb: 1.5 }} flexWrap="wrap">
            <Chip 
              label={statusConfig.label}
              size="small"
              sx={{
                backgroundColor: statusConfig.bg,
                color: statusConfig.color,
                border: `1px solid ${statusConfig.color}20`,
                fontWeight: 500,
                fontSize: '0.7rem'
              }}
            />
            
            {task.task_type && task.task_type !== 'task' && (
              <Chip 
                label={task.task_type}
                size="small"
                variant="outlined"
                color="secondary"
                sx={{ fontSize: '0.7rem' }}
              />
            )}
            
            {task.priority && priorityConfig && (
              <Chip 
                icon={<Flag size={12} />}
                label={priorityConfig.label}
                size="small"
                sx={{
                  backgroundColor: priorityConfig.bg,
                  color: priorityConfig.color,
                  border: `1px solid ${priorityConfig.color}20`,
                  fontSize: '0.7rem'
                }}
              />
            )}
          </Stack>
        )}

        {/* Task Details */}
        <Stack spacing={isSubtask ? 0.5 : 1}>
          {/* Due Date */}
          {task.due_date && (
            <Box display="flex" alignItems="center" gap={0.5}>
              <Calendar size={isSubtask ? 12 : 14} color={isOverdue(task.due_date) ? '#EF4444' : '#6B7280'} />
              <Typography 
                variant="caption" 
                color={isOverdue(task.due_date) ? 'error' : 'text.secondary'}
                fontWeight={isOverdue(task.due_date) ? 'bold' : 'normal'}
              >
                {isOverdue(task.due_date) ? 'Overdue' : 'Due'} {formatDate(task.due_date)}
              </Typography>
            </Box>
          )}

          {/* Assigned User */}
          {task.assigned_id && !isSubtask && (
            <Box display="flex" alignItems="center" gap={0.5}>
              <User size={14} color="#6B7280" />
              <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5 }}>
                Assigned
              </Typography>
              {getAssigneeAvatar()}
            </Box>
          )}

          {/* Tags - only show for main tasks */}
          {task.tags && task.tags.length > 0 && !isSubtask && (
            <Stack direction="row" spacing={0.5} flexWrap="wrap">
              {task.tags.slice(0, 2).map((tag, index) => (
                <Chip 
                  key={index}
                  label={tag}
                  size="small"
                  variant="outlined"
                  sx={{ 
                    height: 18,
                    fontSize: '0.6rem',
                    '& .MuiChip-label': { px: 0.5 }
                  }}
                />
              ))}
              {task.tags.length > 2 && (
                <Typography variant="caption" color="text.secondary">
                  +{task.tags.length - 2} more
                </Typography>
              )}
            </Stack>
          )}
        </Stack>

        {/* Progress indicator for completed tasks */}
        {task.status === 'complete' && !isSubtask && (
          <Box 
            sx={{ 
              position: 'absolute',
              top: 8,
              right: 8,
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: statusConfig.color
            }}
          />
        )}
      </CardContent>
    </Card>
  );

  return (
    <SortableTaskCard 
      task={task} 
      config={config} 
      isDragging={isDragging}
      isSubtask={isSubtask}
    >
      {cardContent}
    </SortableTaskCard>
  );
};