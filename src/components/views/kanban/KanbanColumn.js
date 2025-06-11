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
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useRouter, useSearchParams } from 'next/navigation';

import { KanbanTaskCard } from './KanbanTaskCard';
import { getMilestoneColor, getLighterColor } from '@/data/statusColors';
import { useModal } from '@/components/modals/ModalContext';
import * as collections from '@/collections';

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
      return getMilestoneColor(milestoneIndex);
    } else if (mode === 'universal') {
      return container.color || '#6366F1';
    } else {
      return '#6366F1';
    }
  };

  const columnColor = getColumnColor();
  const lightBg = getLighterColor(columnColor, 0.05);

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
        backgroundColor: isOver ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
        borderRadius: '0 0 8px 8px',
        transition: 'background-color 0.2s ease',
        
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
        
        // Add subtasks for this parent
        const taskSubtasks = subtasks
          .filter(subtask => subtask.parent_id === parentTask.id)
          .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
        
        organizedTasks.push(...taskSubtasks);
      });
    
    return organizedTasks;
  };

  const organizedTasks = organizeTasksWithSubtasks(tasks);
  const taskIds = organizedTasks.map(task => `task-${task.id}`);

  const handleAddTask = () => {
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
      initialData.task_type = 'support';
      
      // Get project_id from container
      if (container.projectId) {
        initialData.project_id = container.projectId;
      }
    } else if (mode === 'universal') {
      // Universal mode - set status from container
      const status = container.id.replace('status-', '');
      initialData.status = status;
      
      // Don't set task_type for universal mode - allow all task types
      
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
    
    openModal('create', { 
      config: fullConfig,
      initialData
    });
  };

  const handleTaskClick = (task) => {
    const fullConfig = collections[config.name] || config;
    openModal('edit', { 
      config: fullConfig,
      recordId: task.id
    });
  };

  // Get appropriate color based on mode
  const getColumnColor = () => {
    if (mode === 'milestone') {
      return getMilestoneColor(milestoneIndex);
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
          <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
            {organizedTasks.map((task) => (
              <KanbanTaskCard 
                key={task.id}
                task={task}
                config={config}
                onTaskUpdate={onTaskUpdate}
                onTaskClick={handleTaskClick}
              />
            ))}
          </SortableContext>

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