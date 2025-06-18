// components/kanban/KanbanColumn.js
'use client';

import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Stack,
  IconButton,
  Tooltip
} from '@mui/material';
import { Plus, Kanban } from '@phosphor-icons/react';
import { useDroppable } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useRouter, useSearchParams } from 'next/navigation';
import { KanbanTaskCard } from './KanbanTaskCard';
import statusColors from '@/data/statusColors';
import { useModal } from '@/components/modals/ModalContext';
import * as collections from '@/collections';
import { useTheme } from '@mui/material/styles';

const SortableColumn = ({ 
  container, 
  tasks, 
  config, 
  mode, 
  milestoneIndex,
  children 
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: container.id,
    disabled: mode !== 'milestone' // Only allow milestone reordering
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
  };

  // Get appropriate color based on mode
  const getColumnColor = () => {
    if (mode === 'milestone') {
      return statusColors.getMilestoneColor(milestoneIndex);
    } else if (mode === 'universal') {
      return container.color || '#6366F1';
    } else {
      return '#6366F1';
    }
  };

  const columnColor = getColumnColor();
  const lightBg = statusColors.getLighterColor(columnColor, 0.05);

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card 
        sx={{ 
          width: 320,
          height: 'fit-content',
          maxHeight: 'calc(100vh - 280px)', // Consistent max height
          display: 'flex',
          flexDirection: 'column',
          border: isDragging ? '2px dashed' : '1px solid',
          borderColor: isDragging ? 'primary.main' : 'divider',
          borderRadius: 2,
          overflow: 'hidden',
          backgroundColor: lightBg
        }}
      >
        {/* Column Header with Background Color */}
        <Box
          sx={{
            background: `linear-gradient(135deg, ${columnColor} 0%, ${columnColor}DD 100%)`,
            color: 'white',
            p: 2,
            cursor: mode === 'milestone' ? 'grab' : 'default',
            '&:active': {
              cursor: mode === 'milestone' ? 'grabbing' : 'default'
            }
          }}
          {...(mode === 'milestone' ? listeners : {})}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography 
              variant="subtitle1" 
              fontWeight="bold"
              sx={{ 
                color: 'white',
                textShadow: '0 1px 2px rgba(0,0,0,0.2)'
              }}
            >
              {container.title}
            </Typography>
            
            <Chip 
              label={tasks.length} 
              size="small"
              sx={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.3)',
                fontWeight: 600
              }}
            />
          </Stack>
          
          {/* Milestone metadata - only show for milestone mode */}
          {mode === 'milestone' && tasks.length > 0 && (
            (() => {
              const taskDueDates = tasks
                .map(task => task.due_date)
                .filter(Boolean)
                .map(date => new Date(date));
              
              const upcomingTasks = tasks.filter(task => 
                task.due_date && new Date(task.due_date) > new Date()
              ).length;
              
              const overdueTasks = tasks.filter(task => 
                task.due_date && new Date(task.due_date) < new Date() && task.status !== 'complete'
              ).length;
              
              if (taskDueDates.length > 0) {
                const latestDueDate = new Date(Math.max(...taskDueDates));
                return (
                  <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
                    <Typography variant="caption" sx={{ 
                      color: 'rgba(255,255,255,0.9)',
                      fontSize: '0.7rem'
                    }}>
                      Due: {latestDueDate.toLocaleDateString()}
                    </Typography>
                    {overdueTasks > 0 && (
                      <Typography variant="caption" sx={{ 
                        color: 'white',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        backgroundColor: '#d93636',
                        padding: '.1rem .5rem',
                        borderRadius: '5rem'
                      }}>
                        {overdueTasks} overdue
                      </Typography>
                    )}
                  </Stack>
                );
              }
              return null;
            })()
          )}

          {/* Universal mode metadata */}
          {mode === 'universal' && tasks.length > 0 && (
            (() => {
              const overdueTasks = tasks.filter(task => 
                task.due_date && new Date(task.due_date) < new Date() && task.status !== 'complete'
              ).length;
              
              const completedTasks = tasks.filter(task => task.status === 'complete').length;
              
              return (
                <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
                  <Typography variant="caption" sx={{ 
                    color: 'rgba(255,255,255,0.9)',
                    fontSize: '0.7rem'
                  }}>
                    {completedTasks > 0 && `${completedTasks} done`}
                  </Typography>
                  {overdueTasks > 0 && (
                    <Typography variant="caption" sx={{ 
                      color: 'white',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      backgroundColor: '#d93636',
                      padding: '.1rem .5rem',
                      borderRadius: '5rem'
                    }}>
                      {overdueTasks} overdue
                    </Typography>
                  )}
                </Stack>
              );
            })()
          )}
        </Box>

        {children}
      </Card>
    </div>
  );
};

const DroppableArea = ({ container, tasks, config, children }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: container.id,
  });



  return (
    <Box
      ref={setNodeRef}
      sx={{
        flex: 1,
        minHeight: 120,
        maxHeight: 'calc(100vh - 420px)', // Consistent scrollable area
        overflowY: 'auto',
        p: 1.5,
        backgroundColor: isOver ? 'rgba(59, 130, 246, 0.15)' : 'transparent', // More visible when hovering
        borderRadius: '0 0 8px 8px',
        transition: 'background-color 0.2s ease',
        border: isOver ? '2px dashed rgba(59, 130, 246, 0.5)' : '2px dashed transparent', // Visual feedback
        
        // Custom scrollbar
        '&::-webkit-scrollbar': {
          width: 6,
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: 'transparent',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: 'rgba(0,0,0,0.2)',
          borderRadius: 3,
          '&:hover': {
            backgroundColor: 'rgba(0,0,0,0.3)',
          }
        },
      }}
    >
      {children}
    </Box>
  );
};

export const KanbanColumn = ({ 
  container, 
  tasks = [], 
  config, 
  mode,
  milestoneIndex = 0,
  onTaskUpdate
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { openModal } = useModal();

  // Organize tasks by hierarchy (parent tasks with their subtasks)
  const organizeTasksWithSubtasks = (tasks) => {

    
    // For completed tasks, treat all as standalone and limit to recent 20
    if (container.id === 'complete') {
  
      
      const sortedTasks = tasks
        .sort((a, b) => {
          // Sort by updated_at first (most recent first), then created_at, then id
          const aDate = new Date(a.updated_at || a.created_at || 0);
          const bDate = new Date(b.updated_at || b.created_at || 0);
          const dateComparison = bDate - aDate; // Most recent first
          
          if (dateComparison !== 0) return dateComparison;
          
          // Fallback to ID for consistent ordering
          return (b.id || 0) - (a.id || 0);
        });
      
      const limitedTasks = sortedTasks.slice(0, 20); // Only show the 20 most recent completed tasks

      
      return limitedTasks;
    }
    
    // For non-completed tasks, maintain parent-child hierarchy
    const parentTasks = tasks.filter(task => !task.parent_id);
    const subtasks = tasks.filter(task => task.parent_id);
    
    const organizedTasks = [];
    
    // Sort parent tasks by priority: overdue > due soon > no due date > completed
    parentTasks
      .sort((a, b) => {
        // First sort by completion status
        const aComplete = a.status === 'complete';
        const bComplete = b.status === 'complete';
        if (aComplete !== bComplete) return aComplete ? 1 : -1;
        
        // Then by due date priority
        const aDate = a.due_date ? new Date(a.due_date) : null;
        const bDate = b.due_date ? new Date(b.due_date) : null;
        const now = new Date();
        
        if (!aDate && !bDate) return (a.order_index || 0) - (b.order_index || 0);
        if (!aDate) return 1;
        if (!bDate) return -1;
        
        const aOverdue = aDate < now;
        const bOverdue = bDate < now;
        
        if (aOverdue && !bOverdue) return -1;
        if (!aOverdue && bOverdue) return 1;
        
        return aDate - bDate;
      })
      .forEach(parentTask => {
        organizedTasks.push(parentTask);
        
        // Add subtasks for this parent (only if parent is not completed)
        if (parentTask.status !== 'complete') {
          const taskSubtasks = subtasks
            .filter(subtask => subtask.parent_id === parentTask.id)
            .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
          
          organizedTasks.push(...taskSubtasks);
        }
      });
    
 
    return organizedTasks;
  };

  const organizedTasks = organizeTasksWithSubtasks(tasks);
  const totalTasksBeforeLimit = tasks.length; // Store original count for complete column indicator
  // No need for taskIds since we're not reordering within columns

  const handleAddTask = () => {
    try {
      const fullConfig = collections[config.name] || config;
      
      // Prepare initial data based on mode and container
      const initialData = {};
      
      if (mode === 'milestone') {
        const milestoneId = container.id.replace('milestone-', '');
        initialData.milestone_id = milestoneId;
        
        // Get project_id from container data or first task
        if (container.data?.project_id) {
          initialData.project_id = container.data.project_id;
        } else if (tasks.length > 0 && tasks[0].project_id) {
          initialData.project_id = tasks[0].project_id;
        }
        
        // Get company_id from first task if available
        if (tasks.length > 0 && tasks[0].company_id) {
          initialData.company_id = tasks[0].company_id;
        }
      } else if (mode === 'support') {
        const status = container.id.replace('status-', '');
        initialData.status = status;
        initialData.type = 'support';
        
        // Get project_id from container
        if (container.projectId) {
          initialData.project_id = container.projectId;
        }
      } else if (mode === 'universal') {
        // Universal mode - set status from container
        const status = container.id.replace('status-', '');
        initialData.status = status;
        
        // Don't set type for universal mode - allow all task types
        
        // Get project_id from container if available
        if (container.projectId) {
          initialData.project_id = container.projectId;
        }
        
        // Get project_id from first task if available
        if (tasks.length > 0 && tasks[0].project_id) {
          initialData.project_id = tasks[0].project_id;
        }
        
        // Get company_id from first task if available
        if (tasks.length > 0 && tasks[0].company_id) {
          initialData.company_id = tasks[0].company_id;
        }
      }
      
      console.log('[KanbanColumn] Adding task in column:', container.title);
      
      // Use the modal context to open the modal directly
      openModal('create', {
        config: fullConfig,
        defaultValues: initialData,
        onRefresh: () => {
          if (onTaskUpdate) {
            onTaskUpdate();
          }
        }
      });
    } catch (error) {
      console.error('[KanbanColumn] Error handling add task:', error);
    }
  };

  const handleTaskClick = (task) => {
    try {
      console.log('[KanbanColumn] Task clicked:', task.title, task.id);
      
      // Use the modal context to open the modal directly
      openModal('edit', {
        config: collections[config.name] || config,
        recordId: task.id,
        onRefresh: () => {
          if (onTaskUpdate) {
            onTaskUpdate();
          }
        }
      });
    } catch (error) {
      console.error('[KanbanColumn] Error handling task click:', error);
    }
  };

  // Get appropriate color based on mode
  const getColumnColor = () => {
    if (mode === 'milestone') {
      return statusColors.getMilestoneColor(milestoneIndex);
    } else if (mode === 'universal') {
      return container.color || '#6366F1';
    } else {
      return '#6366F1';
    }
  };

  const columnColor = getColumnColor();

  return (
    <SortableColumn 
      container={container} 
      tasks={tasks} 
      config={config} 
      mode={mode}
      milestoneIndex={milestoneIndex}
    >
      <DroppableArea container={container} tasks={tasks} config={config}>
        <Stack spacing={0.5}>
          {/* No SortableContext needed - just render tasks directly */}
          {organizedTasks.map((task) => (
            <KanbanTaskCard 
              key={task.id}
              task={task}
              config={config}
              onTaskUpdate={onTaskUpdate}
              onTaskClick={handleTaskClick}
            />
          ))}

          {/* Show "Show more" indicator for complete column if there are more tasks */}
          {container.id === 'complete' && totalTasksBeforeLimit > 20 && (
            <Box sx={{ 
              p: 1, 
              textAlign: 'center', 
              color: 'text.secondary',
              fontSize: '0.75rem',
              fontStyle: 'italic'
            }}>
              Showing 20 most recent of {totalTasksBeforeLimit} completed tasks
            </Box>
          )}

          {/* Add Task Button */}
          <Button
            variant="outlined"
            startIcon={<Plus size={16} />}
            onClick={handleAddTask}
            size="small"
            fullWidth
            sx={{ 
              mt: 1,
              borderStyle: 'dashed',
              borderColor: `${columnColor}40`,
              color: columnColor,
              backgroundColor: 'transparent',
              '&:hover': {
                borderStyle: 'solid',
                borderColor: columnColor,
                backgroundColor: `${columnColor}08`,
                color: columnColor
              },
              '&:active': {
                backgroundColor: `${columnColor}12`
              }
            }}
          >
            Add Task
          </Button>
        </Stack>
      </DroppableArea>
    </SortableColumn>
  );
};