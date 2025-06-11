// components/kanban/UniversalKanbanBoard.js
'use client';

import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  Button,
  Alert,
  CircularProgress,
  Stack,
  Tooltip,
  Chip,
  Divider
} from '@mui/material';
import { 
  DndContext, 
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { 
  restrictToFirstScrollableAncestor,
} from '@dnd-kit/modifiers';
import { Kanban, CheckCircle, Calendar, FunnelSimple } from '@phosphor-icons/react';

import { useUniversalKanban } from '@/hooks/kanban/useUniversalKanban';
import { KanbanColumn } from './KanbanColumn';
import { KanbanTaskCard } from './KanbanTaskCard';

export const UniversalKanbanBoard = ({
  companyId = null,
  projectId = null,
  showCompleted = false,
  showControls = true,
  embedded = false,
  config,
  searchQuery = '',
  filters = {},
  onTaskUpdate,
  height = 'auto'
}) => {
  const [localShowCompleted, setLocalShowCompleted] = useState(showCompleted);
  
  const {
    loading,
    error,
    containers,
    tasksByContainer,
    moveTask,
    reorderTasks,
    updateTask,
    loadData,
    clearError,
    getTotalTaskCount,
    getCompletedTaskCount,
    getPendingTaskCount,
    getOverdueTaskCount
  } = useUniversalKanban({
    companyId,
    projectId,
    showCompleted: localShowCompleted,
    searchQuery,
    filters,
    config
  });

  const [activeId, setActiveId] = useState(null);
  const [activeTask, setActiveTask] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event) => {
    const { active } = event;
    setActiveId(active.id);
    
    // Find the task being dragged
    const taskId = active.id.toString().replace('task-', '');
    for (const [containerId, tasks] of Object.entries(tasksByContainer)) {
      const task = tasks.find(t => t.id.toString() === taskId);
      if (task) {
        setActiveTask(task);
        break;
      }
    }
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    
    if (!over) return;
    
    const activeId = active.id;
    const overId = over.id;
    
    if (activeId === overId) return;
    
    const activeIsTask = activeId.toString().startsWith('task-');
    const overIsTask = overId.toString().startsWith('task-');
    const overIsContainer = containers.some(c => c.id === overId);
    
    if (!activeIsTask) return;
    
    // Prevent dragging subtasks
    if (activeTask?.parent_id) return;
    
    // Handle task dropped on container
    if (activeIsTask && overIsContainer) {
      return; // Will be handled in handleDragEnd
    }
    
    // Handle task dropped on another task (reordering within same container)
    if (activeIsTask && overIsTask) {
      let activeContainer = null;
      let overContainer = null;
      
      for (const [containerId, tasks] of Object.entries(tasksByContainer)) {
        if (tasks.some(t => `task-${t.id}` === activeId)) {
          activeContainer = containerId;
        }
        if (tasks.some(t => `task-${t.id}` === overId)) {
          overContainer = containerId;
        }
      }
      
      if (activeContainer && overContainer && activeContainer === overContainer) {
        const tasks = tasksByContainer[activeContainer];
        const activeIndex = tasks.findIndex(t => `task-${t.id}` === activeId);
        const overIndex = tasks.findIndex(t => `task-${t.id}` === overId);
        
        if (activeIndex !== overIndex) {
          const newTasks = arrayMove(tasks, activeIndex, overIndex);
          reorderTasks(activeContainer, newTasks);
        }
      }
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    setActiveId(null);
    setActiveTask(null);
    
    if (!over) return;
    
    const activeId = active.id;
    const overId = over.id;
    
    if (activeId === overId) return;
    
    const activeIsTask = activeId.toString().startsWith('task-');
    const overIsContainer = containers.some(c => c.id === overId);
    
    // Prevent dragging subtasks
    if (activeTask?.parent_id) return;
    
    // Handle task movement
    if (activeIsTask && overIsContainer) {
      let currentContainer = null;
      const taskId = activeId.toString().replace('task-', '');
      
      for (const [containerId, tasks] of Object.entries(tasksByContainer)) {
        if (tasks.some(t => t.id.toString() === taskId)) {
          currentContainer = containerId;
          break;
        }
      }
      
      if (currentContainer && currentContainer !== overId) {
        const tasksInTarget = tasksByContainer[overId] || [];
        moveTask(taskId, currentContainer, overId, tasksInTarget.length);
      }
    }
  };

  const handleShowCompletedToggle = (event) => {
    setLocalShowCompleted(event.target.checked);
  };

  const handleTaskUpdate = (updatedTask) => {
    if (onTaskUpdate) {
      onTaskUpdate(updatedTask);
    }
    // Refresh data if task was marked complete and we're not showing completed
    if (!localShowCompleted && updatedTask.status === 'complete') {
      loadData();
    }
  };

  const totalTasks = getTotalTaskCount();
  const completedTasks = getCompletedTaskCount();
  const pendingTasks = getPendingTaskCount();
  const overdueTasks = getOverdueTaskCount();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={embedded ? 200 : 400}>
        <CircularProgress size={embedded ? 24 : 40} />
        <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
          Loading tasks...
        </Typography>
      </Box>
    );
  }


  if (error) {
    return (
      <Alert 
        severity="error" 
        action={
          <Button color="inherit" size="small" onClick={() => { clearError(); loadData(); }}>
            Retry
          </Button>
        }
      >
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ pb: 3 }}>
      {/* Header Controls */}
      {showControls && !embedded && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
              <Box>
                <Typography variant="h6" gutterBottom sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Kanban size={20} />
                  Universal Task Board
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                      {totalTasks} tasks
                    </Typography>
                    {completedTasks > 0 && (
                      <Chip 
                        icon={<CheckCircle size={14} />}
                        label={`${completedTasks} done`}
                        size="small" 
                        color="success" 
                        variant="outlined"
                      />
                    )}
                    {pendingTasks > 0 && (
                      <Chip 
                        icon={<Calendar size={14} />}
                        label={`${pendingTasks} pending`}
                        size="small" 
                        color="primary" 
                        variant="outlined"
                      />
                    )}
                    {overdueTasks > 0 && (
                      <Chip 
                        label={`${overdueTasks} overdue`}
                        size="small" 
                        color="error" 
                        variant="outlined"
                      />
                    )}
                  </Stack>
                </Stack>
              </Box>
              
              <Stack direction="row" alignItems="center" gap={2}>
                {/* Show Completed Toggle */}
                <FormControlLabel
                  control={
                    <Switch 
                      checked={localShowCompleted} 
                      onChange={handleShowCompletedToggle}
                      size="small"
                    />
                  }
                  label={
                    <Typography variant="body2" color="text.secondary">
                      Show completed
                    </Typography>
                  }
                  sx={{ m: 0 }}
                />
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Embedded Header */}
      {embedded && (
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Kanban size={16} />
            Universal Task Board
          </Typography>
          
          <Stack direction="row" alignItems="center" gap={2}>
            <Typography variant="caption" color="text.secondary">
              {totalTasks} tasks
            </Typography>
            
            <Tooltip title="Toggle completed tasks">
              <Switch 
                checked={localShowCompleted}
                onChange={handleShowCompletedToggle}
                size="small"
              />
            </Tooltip>
          </Stack>
        </Stack>
      )}

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToFirstScrollableAncestor]}
      >
        <Box 
          sx={{ 
            display: 'flex',
            gap: 2,
            overflowX: 'auto',
            pb: 3,
            minHeight: embedded ? 350 : 450,
            maxHeight: height === 'auto' ? 'calc(100vh - 200px)' : height,
            justifyContent: containers.length === 0 ? 'center' : 'flex-start',
            alignItems: containers.length === 0 ? 'center' : 'flex-start',
            
            '&::-webkit-scrollbar': {
              height: 8,
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: 'rgba(0,0,0,0.05)',
              borderRadius: 4,
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'rgba(0,0,0,0.2)',
              borderRadius: 4,
              '&:hover': {
                backgroundColor: 'rgba(0,0,0,0.3)',
              }
            },
          }}
        >
          {containers.length === 0 ? (
            <Card sx={{ maxWidth: 500, width: '100%' }}>
              <CardContent sx={{ textAlign: 'center', py: 6 }}>
                <Box sx={{ mb: 2 }}>
                  <Kanban size={48} color="#9CA3AF" />
                </Box>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No tasks found
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, mx: 'auto' }}>
                  {searchQuery || Object.keys(filters).length > 0 
                    ? 'Try adjusting your search criteria or filters to find tasks.'
                    : 'Create your first task to get started with the universal kanban board.'}
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <SortableContext 
              items={containers.map(c => c.id)}
              strategy={horizontalListSortingStrategy}
            >
              {containers.map((container, index) => (
                <KanbanColumn
                  key={container.id}
                  container={{
                    ...container,
                    projectId // Pass project ID if available
                  }}
                  tasks={tasksByContainer[container.id] || []}
                  config={config}
                  mode="universal"
                  milestoneIndex={index}
                  onTaskUpdate={handleTaskUpdate}
                />
              ))}
            </SortableContext>
          )}
        </Box>

        <DragOverlay>
          {activeTask ? (
            <KanbanTaskCard 
              task={activeTask} 
              config={config}
              isDragging
              onTaskUpdate={handleTaskUpdate}
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </Box>
  );
};