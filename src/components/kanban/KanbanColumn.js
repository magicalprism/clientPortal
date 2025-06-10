// components/kanban/KanbanColumn.js
'use client';

import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Stack
} from '@mui/material';
import { Plus } from '@phosphor-icons/react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useRouter, useSearchParams } from 'next/navigation';

import { KanbanTaskCard } from './KanbanTaskCard';
import { getMilestoneColor } from '@/data/statusColors';

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
    opacity: isDragging ? 0.5 : 1,
  };

  const milestoneColor = mode === 'milestone' ? getMilestoneColor(milestoneIndex) : '#6B7280';

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card 
        sx={{ 
          minWidth: 280,
          maxWidth: 300,
          height: 'fit-content',
          border: isDragging ? '2px dashed' : '1px solid',
          borderColor: isDragging ? 'primary.main' : 'divider',
          borderTop: mode === 'milestone' ? `4px solid ${milestoneColor}` : 'none',
          borderRadius: mode === 'milestone' ? '8px 8px 4px 4px' : 1
        }}
      >
        {/* Column Header */}
        <CardContent sx={{ pb: 1 }}>
          <Stack 
            direction="row" 
            justifyContent="space-between" 
            alignItems="center"
            sx={{ mb: 1 }}
            {...(mode === 'milestone' ? listeners : {})}
          >
            <Typography 
              variant="subtitle1" 
              fontWeight="bold"
              sx={{ 
                color: mode === 'milestone' ? milestoneColor : 'text.primary',
                cursor: mode === 'milestone' ? 'grab' : 'default'
              }}
            >
              {container.title}
            </Typography>
            <Chip 
              label={tasks.length} 
              size="small" 
              variant="outlined"
              sx={{
                borderColor: tasks.length > 0 ? milestoneColor : 'divider',
                color: tasks.length > 0 ? milestoneColor : 'text.secondary'
              }}
            />
          </Stack>
          
   
          
          {/* For milestones, show derived due date from tasks */}
          {mode === 'milestone' && tasks.length > 0 && (
            (() => {
              const taskDueDates = tasks
                .map(task => task.due_date)
                .filter(Boolean)
                .map(date => new Date(date));
              
              if (taskDueDates.length > 0) {
                const latestDueDate = new Date(Math.max(...taskDueDates));
                return (
                  <Typography variant="caption" color="text.secondary" display="block">
                    Latest due: {latestDueDate.toLocaleDateString()}
                  </Typography>
                );
              }
              return null;
            })()
          )}
        </CardContent>

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
        minHeight: 100,
        maxHeight: 'calc(100vh - 300px)', // Prevent endless scroll
        overflowY: 'auto',
        p: 1,
        backgroundColor: isOver ? 'action.hover' : 'transparent',
        borderRadius: 1,
        transition: 'background-color 0.2s ease',
        '&::-webkit-scrollbar': {
          width: 6,
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: 'transparent',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: 'rgba(0,0,0,0.2)',
          borderRadius: 3,
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

  // Organize tasks by hierarchy (parent tasks with their subtasks)
  const organizeTasksWithSubtasks = (tasks) => {
    const parentTasks = tasks.filter(task => !task.parent_id);
    const subtasks = tasks.filter(task => task.parent_id);
    
    const organizedTasks = [];
    
    parentTasks
      .sort((a, b) => {
        // Sort by due date, then by order_index, then by created_at
        const dateA = a.due_date ? new Date(a.due_date) : null;
        const dateB = b.due_date ? new Date(b.due_date) : null;

        if (!dateA && !dateB) {
          return (a.order_index || 0) - (b.order_index || 0);
        }
        if (!dateA) return 1;
        if (!dateB) return -1;

        return dateA - dateB;
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
    const currentParams = new URLSearchParams(searchParams.toString());
    currentParams.set('modal', 'create');
    currentParams.set('collection', 'task');
    
    // Pre-populate based on mode and container
    if (mode === 'milestone') {
      currentParams.set('milestone_id', container.id);
      // Get project_id from the milestone relationship
      if (container.data?.project_id) {
        currentParams.set('project_id', container.data.project_id);
      }
    } else if (mode === 'support') {
      currentParams.set('status', container.id);
      currentParams.set('task_type', 'support');
      // Get project_id from context (this should be passed down)
      if (container.projectId) {
        currentParams.set('project_id', container.projectId);
      }
    }
    
    router.push(`${window.location.pathname}?${currentParams.toString()}`);
  };

  const handleTaskClick = (task) => {
    const currentParams = new URLSearchParams(searchParams.toString());
    currentParams.set('modal', 'edit');
    currentParams.set('id', task.id);
    currentParams.set('collection', 'task');
    router.push(`${window.location.pathname}?${currentParams.toString()}`);
  };

  return (
    <SortableColumn 
      container={container} 
      tasks={tasks} 
      config={config} 
      mode={mode}
      milestoneIndex={milestoneIndex}
    >
      <DroppableArea container={container} tasks={tasks} config={config}>
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          <Stack spacing={0}>
            {organizedTasks.map((task) => (
              <KanbanTaskCard 
                key={task.id}
                task={task}
                config={config}
                onTaskUpdate={onTaskUpdate}
                onTaskClick={handleTaskClick}
              />
            ))}

            {/* Add Task Button */}
            <Button
              variant="outlined"
              startIcon={<Plus size={16} />}
              onClick={handleAddTask}
              size="small"
              sx={{ 
                mt: 1,
                borderStyle: 'dashed',
                color: 'text.secondary',
                borderColor: 'divider',
                '&:hover': {
                  borderStyle: 'solid',
                  borderColor: mode === 'milestone' ? getMilestoneColor(milestoneIndex) : 'primary.main',
                  color: mode === 'milestone' ? getMilestoneColor(milestoneIndex) : 'primary.main',
                  backgroundColor: 'transparent'
                }
              }}
            >
              Add Task
            </Button>
          </Stack>
        </SortableContext>
      </DroppableArea>
    </SortableColumn>
  );
};