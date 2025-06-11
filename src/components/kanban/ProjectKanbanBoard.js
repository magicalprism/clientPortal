// components/kanban/ProjectKanbanBoard.js
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
import { Kanban, ListChecks, Calendar, CheckCircle } from '@phosphor-icons/react';

import { useProjectKanban } from '@/hooks/kanban/useProjectKanban';
import { KanbanColumn } from './KanbanColumn';
import { KanbanTaskCard } from './KanbanTaskCard';

export const ProjectKanbanBoard = ({
  projectId,
  mode = 'milestone',
  showCompleted = false,
  embedded = false,
  config,
  onTaskUpdate
}) => {
  const [localMode, setLocalMode] = useState(mode);
  const [localShowCompleted, setLocalShowCompleted] = useState(showCompleted);
  
  const {
    loading,
    error,
    containers,
    tasksByContainer,
    moveTask,
    reorderTasks,
    updateMilestonesOrder,
    loadData,
    setError,
    getTotalTaskCount,
    getCompletedTaskCount
  } = useProjectKanban({
    projectId,
    mode: localMode,
    showCompleted: localShowCompleted,
    config
  });

  const [activeId, setActiveId] = useState(null);
  const [activeTask, setActiveTask] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before drag starts
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
    const activeIsContainer = containers.some(c => c.id === activeId);
    const overIsContainer = containers.some(c => c.id === overId);
    
    // Prevent dragging subtasks
    if (activeTask?.parent_id) return;
    
    // Handle container reordering (milestones only)
    if (activeIsContainer && overIsContainer && localMode === 'milestone') {
      const activeIndex = containers.findIndex(c => c.id === activeId);
      const overIndex = containers.findIndex(c => c.id === overId);
      
      if (activeIndex !== overIndex) {
        const newContainers = arrayMove(containers, activeIndex, overIndex);
        const newMilestones = newContainers.map(c => c.data);
        updateMilestonesOrder(newMilestones);
      }
      return;
    }
    
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

  const handleModeToggle = () => {
    setLocalMode(prev => prev === 'milestone' ? 'support' : 'milestone');
  };

  const handleCompletedToggle = (event) => {
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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={embedded ? 200 : 400}>
        <CircularProgress size={embedded ? 24 : 40} sx={{ color: 'primary.500' }} />
        <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
          Loading {localMode === 'milestone' ? 'milestones' : 'support tasks'}...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert 
        severity="error" 
        action={
          <Button color="inherit" size="small" onClick={loadData}>
            Retry
          </Button>
        }
      >
        {error}
      </Alert>
    );
  }

  const totalTasks = getTotalTaskCount();
  const completedTasks = getCompletedTaskCount();
  const pendingTasks = totalTasks - completedTasks;

  return (
    <Box sx={{ pb: 3 }}>
      {/* Header Controls */}
      {!embedded && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
              <Box>
                <Typography variant="h6" gutterBottom sx={{ mb: 1 }}>
                  Task Board
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                      {totalTasks} tasks
                    </Typography>
                    <Chip 
                      icon={<CheckCircle size={14} />}
                      label={`${completedTasks} done`}
                      size="small" 
                      color="success" 
                      variant="outlined"
                    />
                    {pendingTasks > 0 && (
                      <Chip 
                        icon={<Calendar size={14} />}
                        label={`${pendingTasks} pending`}
                        size="small" 
                        color="primary" 
                        variant="outlined"
                      />
                    )}
                  </Stack>
                </Stack>
              </Box>
              
              <Stack direction="row" alignItems="center" gap={3}>
                {/* Mode Toggle Switch */}
                <Stack direction="row" alignItems="center" gap={1}>
                  <Tooltip title="Milestone View" placement="top">
                    <Kanban 
                      size={20} 
                      color={localMode === 'milestone' ? '#6366F1' : '#9CA3AF'} 
                    />
                  </Tooltip>
                  
                  <Switch 
                    checked={localMode === 'support'}
                    onChange={handleModeToggle}
                    size="small"
                    sx={{
                      '& .MuiSwitch-switchBase': {
                        '&.Mui-checked': {
                          color: '#6366F1',
                          '& + .MuiSwitch-track': {
                            backgroundColor: '#6366F1',
                            opacity: 0.5
                          }
                        }
                      },
                      '& .MuiSwitch-track': {
                        backgroundColor: '#6366F1',
                        opacity: 0.3
                      }
                    }}
                  />
                  
                  <Tooltip title="Support View" placement="top">
                    <ListChecks 
                      size={20} 
                      color={localMode === 'support' ? '#6366F1' : '#9CA3AF'} 
                    />
                  </Tooltip>
                </Stack>
                
                <Divider orientation="vertical" flexItem />
                
                {/* Show Completed Toggle */}
                <FormControlLabel
                  control={
                    <Switch 
                      checked={localShowCompleted} 
                      onChange={handleCompletedToggle}
                      size="small"
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: '#6366F1'
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: '#6366F1'
                        }
                      }}
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
          <Typography variant="subtitle2" color="text.secondary">
            {localMode === 'milestone' ? 'Tasks by milestone' : 'Support tasks by status'}
          </Typography>
          
          <Stack direction="row" alignItems="center" gap={2}>
            <Typography variant="caption" color="text.secondary">
              {totalTasks} tasks
            </Typography>
            
            <Tooltip title={`Switch to ${localMode === 'milestone' ? 'support' : 'milestone'} view`}>
              <Switch 
                checked={localMode === 'support'}
                onChange={handleModeToggle}
                size="small"
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#6366F1'
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#6366F1'
                  }
                }}
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
            pb: 3, // Bottom padding for scrolling
            minHeight: embedded ? 350 : 450,
            maxHeight: embedded ? 500 : 'calc(100vh - 200px)',
            
            // Custom horizontal scrollbar
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
          <SortableContext 
            items={containers.map(c => c.id)}
            strategy={horizontalListSortingStrategy}
          >
            {containers.map((container, index) => (
              <KanbanColumn
                key={container.id}
                container={{
                  ...container,
                  projectId // Pass project ID for support mode
                }}
                tasks={tasksByContainer[container.id] || []}
                config={config}
                mode={localMode}
                milestoneIndex={index}
                onTaskUpdate={handleTaskUpdate}
              />
            ))}
          </SortableContext>
        </Box>

        <DragOverlay>
          {activeTask ? (
            <KanbanTaskCard 
              task={activeTask} 
              config={config}
              isDragging
            />
          ) : null}
        </DragOverlay>
      </DndContext>
      
      {/* Empty State */}
      {containers.length === 0 && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Box sx={{ mb: 2 }}>
              {localMode === 'milestone' ? (
                <Kanban size={48} color="#9CA3AF" />
              ) : (
                <ListChecks size={48} color="#9CA3AF" />
              )}
            </Box>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {localMode === 'milestone' 
                ? 'No milestones found' 
                : 'No support tasks found'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, mx: 'auto' }}>
              {localMode === 'milestone' 
                ? 'Create milestones for this project to organize your tasks into phases or deliverables.' 
                : 'No support tasks exist for this project yet. Support tasks help track customer requests and issues.'}
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};