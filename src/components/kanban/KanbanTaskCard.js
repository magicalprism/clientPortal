// components/kanban/KanbanTaskCard.js
'use client';

import {
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  IconButton,
  Avatar,
  AvatarGroup,
  Tooltip
} from '@mui/material';
import { 
  Calendar, 
  CheckCircle,
  Circle,
  Flag
} from '@phosphor-icons/react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { getStatusColor, getPriorityColor, getTaskTypeColor } from '@/data/statusColors';
import { toggleTaskComplete } from '@/lib/supabase/queries/table/task';

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
  const statusConfig = getStatusColor(task.status, config);
  const priorityConfig = getPriorityColor(task.priority);
  const typeConfig = getTaskTypeColor(task.task_type);

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays < -1) return `${Math.abs(diffDays)} days ago`;
    if (diffDays > 1 && diffDays <= 7) return `${diffDays} days`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && task.status !== 'complete';
  };

  const handleTaskClick = (event) => {
    // Don't trigger if clicking on interactive elements
    if (event.target.closest('button') || event.target.closest('[role="button"]')) {
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
      const { data, error } = await toggleTaskComplete(task.id, task.status);
      
      if (error) {
        console.error('Failed to toggle task completion:', error);
        return;
      }
      
      if (onTaskUpdate && data) {
        onTaskUpdate(data);
      }
    } catch (error) {
      console.error('Failed to update task status:', error);
    } finally {
      setIsCompleting(false);
    }
  };

  const getAssigneeAvatars = () => {
    const assignee = task.assigned_contact;
    if (!assignee) return null;

    const avatarUrl = assignee.thumbnail_media?.url;
    const initials = assignee.first_name && assignee.last_name 
      ? `${assignee.first_name[0]}${assignee.last_name[0]}`.toUpperCase()
      : assignee.title?.substring(0, 2).toUpperCase() || '?';

    return (
      <Tooltip title={assignee.title || `${assignee.first_name} ${assignee.last_name}`}>
        <Avatar
          src={avatarUrl}
          sx={{ 
            width: isSubtask ? 16 : 20, 
            height: isSubtask ? 16 : 20, 
            fontSize: isSubtask ? '0.6rem' : '0.7rem',
            bgcolor: 'primary.main',
            border: '1px solid white',
            cursor: 'pointer'
          }}
        >
          {initials}
        </Avatar>
      </Tooltip>
    );
  };

  const dueDateColor = isOverdue(task.due_date) ? '#EF4444' : '#6B7280';
  const isCompleted = task.status === 'complete';

  return (
    <SortableTaskCard 
      task={task} 
      config={config} 
      isDragging={isDragging}
      isSubtask={isSubtask}
    >
      <Card 
        elevation={isDragging ? 8 : (isSubtask ? 0 : 1)}
        sx={{ 
          cursor: 'pointer',
          ml: isSubtask ? 1 : 0,
          mb: 0.5,
          transform: isSubtask ? 'scale(0.95)' : 'none',
          '&:hover': {
            elevation: isSubtask ? 2 : 3,
            transform: isSubtask ? 'scale(0.97)' : 'translateY(-1px)',
            transition: 'all 0.2s ease'
          },
          border: isDragging ? '2px solid' : '1px solid',
          borderColor: isDragging ? 'primary.main' : 'divider',
          borderLeft: isSubtask ? '3px solid' : 'none',
          borderLeftColor: isSubtask ? 'primary.light' : 'none',
          opacity: isCompleted ? 0.75 : 1,
          position: 'relative'
        }}
        onClick={handleTaskClick}
      >
        <CardContent sx={{ 
          p: isSubtask ? 1 : 1.5, 
          '&:last-child': { pb: isSubtask ? 1 : 1.5 },
          position: 'relative'
        }}>
          {/* Top Row: Status Badge & Due Date */}
          {!isSubtask && (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'flex-start',
              mb: 1,
              minHeight: 20
            }}>
              {/* Status Badge */}
              <Chip 
                label={statusConfig.label}
                size="small"
                sx={{
                  backgroundColor: statusConfig.bg,
                  color: statusConfig.color,
                  border: `1px solid ${statusConfig.color}20`,
                  fontWeight: 500,
                  fontSize: '0.65rem',
                  height: 20
                }}
              />
              
              {/* Due Date */}
              {task.due_date && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Calendar size={12} color={dueDateColor} />
                  <Typography 
                    variant="caption" 
                    sx={{
                      color: dueDateColor,
                      fontWeight: isOverdue(task.due_date) ? 600 : 400,
                      fontSize: '0.7rem'
                    }}
                  >
                    {formatDate(task.due_date)}
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {/* Main Content Row: Checkbox + Title */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            mb: isSubtask ? 0.5 : 1
          }}>
            {/* Completion Checkbox */}
            <Tooltip title={isCompleted ? 'Mark incomplete' : 'Mark complete'}>
              <IconButton
                size="small"
                onClick={handleQuickComplete}
                disabled={isCompleting}
                sx={{ 
                  p: 0, 
                  width: isSubtask ? 20 : 24,
                  height: isSubtask ? 20 : 24,
                  '&:hover': {
                    backgroundColor: 'transparent',
                    transform: 'scale(1.1)'
                  }
                }}
              >
                {isCompleted ? (
                  <CheckCircle 
                    size={isSubtask ? 16 : 20} 
                    weight="fill" 
                    color={statusConfig.color} 
                  />
                ) : (
                  <Circle 
                    size={isSubtask ? 16 : 20} 
                    color="#9CA3AF" 
                    weight="regular"
                  />
                )}
              </IconButton>
            </Tooltip>
            
            {/* Task Title */}
            <Typography 
              variant={isSubtask ? 'caption' : 'body2'} 
              fontWeight={isSubtask ? 400 : 500}
              sx={{ 
                flex: 1,
                display: '-webkit-box',
                WebkitLineClamp: isSubtask ? 1 : 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                textDecoration: isCompleted ? 'line-through' : 'none',
                color: isCompleted ? 'text.secondary' : 'text.primary',
                fontSize: isSubtask ? '0.75rem' : '0.875rem',
                lineHeight: isSubtask ? 1.2 : 1.4
              }}
            >
              {task.title}
            </Typography>

            {/* Due Date for Subtasks (inline) */}
            {isSubtask && task.due_date && (
              <Typography 
                variant="caption" 
                sx={{
                  color: dueDateColor,
                  fontSize: '0.65rem',
                  fontWeight: isOverdue(task.due_date) ? 600 : 400
                }}
              >
                {formatDate(task.due_date)}
              </Typography>
            )}
          </Box>

          {/* Bottom Row: Additional Info (only for main tasks) */}
          {!isSubtask && (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center'
            }}>
              {/* Left side: Type & Priority */}
              <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                {task.task_type && task.task_type !== 'task' && (
                  <Chip 
                    label={typeConfig.label}
                    size="small"
                    sx={{
                      backgroundColor: typeConfig.bg,
                      color: typeConfig.color,
                      fontSize: '0.6rem',
                      height: 16,
                      '& .MuiChip-label': { px: 0.5 }
                    }}
                  />
                )}
                
                {task.priority && priorityConfig && (
                  <Tooltip title={`${priorityConfig.label} Priority`}>
                    <Flag 
                      size={12} 
                      color={priorityConfig.color}
                      weight="fill"
                    />
                  </Tooltip>
                )}
              </Box>

              {/* Right side: Assigned Avatar */}
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {getAssigneeAvatars()}
              </Box>
            </Box>
          )}

          {/* Completion Indicator */}
          {isCompleted && (
            <Box 
              sx={{ 
                position: 'absolute',
                top: 4,
                right: 4,
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: statusConfig.color,
                boxShadow: '0 0 0 1px white'
              }}
            />
          )}
        </CardContent>
      </Card>
    </SortableTaskCard>
  );
};