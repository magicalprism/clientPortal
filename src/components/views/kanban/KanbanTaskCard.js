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
  Flag,
  DotsSixVertical
} from '@phosphor-icons/react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { getStatusColor, getPriorityColor, getTaskTypeColor } from '@/data/statusColors';
import { toggleTaskComplete } from '@/lib/supabase/queries/table/task';
import { useModal } from '@/components/modals/ModalContext';
import * as collections from '@/collections';

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
    disabled: false,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging || sortableIsDragging ? 0.8 : 1,
  };

  // Simple approach - pass listeners down without cloneElement
  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      {children({ dragListeners: listeners })}
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
  const { openModal } = useModal();
  
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
    if (event.target.closest('button') || 
        event.target.closest('[role="button"]') ||
        event.target.closest('input') ||
        event.target.closest('svg')) {
      return;
    }
    
    // Stop event propagation to prevent drag
    event.preventDefault();
    event.stopPropagation();
    
    console.log('[KanbanTaskCard] Task clicked:', task.title);

    if (onTaskClick) {
      onTaskClick(task);
    } else {
      // Open global modal
      const fullConfig = collections[config.name] || config;
      console.log('[KanbanTaskCard] Opening modal for task:', task.id);
      openModal('edit', { 
        config: fullConfig,
        recordId: task.id,
        onRefresh: onTaskUpdate
      });
    }
  };

  const handleQuickComplete = async (event) => {
    event.stopPropagation();
    setIsCompleting(true);
    
    try {
      const result = await toggleTaskComplete(task.id, task.status);
      
      if (result.error) {
        console.error('Failed to toggle task completion:', result.error);
        return;
      }
      
      // Just call onTaskUpdate without parameters to refresh the view
      if (onTaskUpdate) {
        onTaskUpdate();
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

  const getCompanyLogo = () => {
    // Get company from various possible paths
    const company = task.company || 
                   task.project?.company || 
                   task.assigned_contact?.company ||
                   (task.company_id && { id: task.company_id, title: 'Company' });
    
    if (!company) return null;

    // Get logo from various possible paths
    const logoUrl = company.logo?.url || 
                   company.logo_media?.url || 
                   company.thumbnail_media?.url;

    if (!logoUrl) return null;

    return (
      <Tooltip title={`Company: ${company.title || company.name || 'Unknown'}`}>
        <Avatar
          src={logoUrl}
          sx={{ 
            width: 16, 
            height: 16, 
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            cursor: 'pointer'
          }}
        >
          {(company.title || company.name || 'C')[0].toUpperCase()}
        </Avatar>
      </Tooltip>
    );
  };

  const dueDateColor = isOverdue(task.due_date) ? '#EF4444' : '#6B7280';
  const isCompleted = task.status === 'complete';

  // Determine if this task should show as a subtask (indented)
  // Only show as subtask if it has a parent AND it's not completed
  const shouldShowAsSubtask = isSubtask && task.status !== 'complete';

  const renderCard = ({ dragListeners }) => (
    <Card 
      elevation={isDragging ? 8 : (shouldShowAsSubtask ? 0 : 1)}
      sx={{ 
        cursor: 'default', // Normal cursor for card, drag cursor only on handle
        ml: shouldShowAsSubtask ? 1 : 0,
        mb: 0.5,
        transform: shouldShowAsSubtask ? 'scale(0.95)' : 'none',
        '&:hover': {
          elevation: shouldShowAsSubtask ? 2 : 3,
          transform: shouldShowAsSubtask ? 'scale(0.97)' : 'translateY(-1px)',
          transition: 'all 0.2s ease'
        },
        border: isDragging ? '2px solid' : '1px solid',
        borderColor: isDragging ? 'primary.main' : 'divider',
        borderLeft: shouldShowAsSubtask ? '3px solid' : 'none',
        borderLeftColor: shouldShowAsSubtask ? 'primary.light' : 'none',
        opacity: isCompleted ? 0.75 : 1,
        position: 'relative'
      }}
    >
      <CardContent sx={{ 
        p: shouldShowAsSubtask ? 1 : 1.5, 
        '&:last-child': { pb: shouldShowAsSubtask ? 1 : 1.5 },
        position: 'relative'
      }}>
        {/* Top Row: Status Badge & Due Date */}
        {!shouldShowAsSubtask && (
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

        {/* Main Content Row: Drag Handle + Checkbox + Title */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          mb: shouldShowAsSubtask ? 0.5 : 1
        }}>
          {/* Drag Handle - ONLY this area is draggable */}
          {(!shouldShowAsSubtask || task.status === 'complete') && (
            <Box 
              {...(dragListeners || {})} // Apply drag listeners ONLY here
              onMouseDown={() => {
                console.log('🫳 Drag handle clicked:', task.title);
              }}
              sx={{ 
                cursor: 'grab',
                display: 'flex',
                alignItems: 'center',
                color: 'text.secondary',
                p: 0.5, // Add some padding for better click area
                borderRadius: 1,
                '&:hover': {
                  color: 'text.primary',
                  backgroundColor: 'action.hover'
                },
                '&:active': {
                  cursor: 'grabbing'
                }
              }}
            >
              <DotsSixVertical size={shouldShowAsSubtask ? 12 : 16} />
            </Box>
          )}
          
          {/* Completion Checkbox */}
          <Tooltip title={isCompleted ? 'Mark incomplete' : 'Mark complete'}>
            <IconButton
              size="small"
              onClick={handleQuickComplete}
              disabled={isCompleting}
              sx={{ 
                p: 0, 
                width: shouldShowAsSubtask ? 20 : 24,
                height: shouldShowAsSubtask ? 20 : 24,
                '&:hover': {
                  backgroundColor: 'transparent',
                  transform: 'scale(1.1)'
                }
              }}
            >
              {isCompleted ? (
                <CheckCircle 
                  size={shouldShowAsSubtask ? 16 : 20} 
                  weight="fill" 
                  color={statusConfig.color} 
                />
              ) : (
                <Circle 
                  size={shouldShowAsSubtask ? 16 : 20} 
                  color="#9CA3AF" 
                  weight="regular"
                />
              )}
            </IconButton>
          </Tooltip>
          
          {/* Task Title - clickable area (NO drag listeners) */}
          <Box
            onMouseDown={(e) => {
              console.log('🖱️ Title area clicked:', task.title);
              handleTaskClick(e);
            }}
            sx={{ 
              flex: 1,
              cursor: 'pointer', // Show pointer cursor for clicking
              borderRadius: 1,
              px: 0.5,
              py: 0.5,
              '&:hover': {
                backgroundColor: 'action.hover'
              }
            }}
          >
            <Typography 
              variant={shouldShowAsSubtask ? 'caption' : 'body2'} 
              fontWeight={shouldShowAsSubtask ? 400 : 500}
              sx={{ 
                display: '-webkit-box',
                WebkitLineClamp: shouldShowAsSubtask ? 1 : 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                textDecoration: isCompleted ? 'line-through' : 'none',
                color: isCompleted ? 'text.secondary' : 'text.primary',
                fontSize: shouldShowAsSubtask ? '0.75rem' : '0.875rem',
                lineHeight: shouldShowAsSubtask ? 1.2 : 1.4,
                pointerEvents: 'none' // Prevent text selection interference
              }}
            >
              {task.title}
            </Typography>
          </Box>

          {/* Due Date for Subtasks (inline) */}
          {shouldShowAsSubtask && task.due_date && (
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
        {!shouldShowAsSubtask && (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center'
          }}>
            {/* Left side: Company Logo & Type & Priority */}
            <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
              {/* Company Logo */}
              {getCompanyLogo()}
              
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
  );

  return (
    <SortableTaskCard 
      task={task} 
      config={config} 
      isDragging={isDragging}
      isSubtask={shouldShowAsSubtask}
    >
      {renderCard}
    </SortableTaskCard>
  );
};