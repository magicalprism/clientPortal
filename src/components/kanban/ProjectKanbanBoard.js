import { useState } from 'react';
import { 
  Box, 
  Typography, 
  Switch, 
  FormControlLabel, 
  ToggleButton, 
  ToggleButtonGroup,
  Button,
  Alert,
  CircularProgress
} from '@mui/material';
import { Plus as PlusIcon } from '@phosphor-icons/react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';

import { useProjectKanban } from '@/hooks/kanban/useProjectKanban';
import { task } from '@/lib/supabase/queries'; // Only need task queries for creation
import { KanbanColumn } from '@/components/kanban/KanbanColumn';
import { KanbanTaskCard } from '@/components/kanban/KanbanTaskCard';
import { CollectionModal } from '@/components/modals/CollectionModal';
import { useDialog } from '@/hooks/use-dialog';

export function ProjectKanbanBoard({ 
  projectId, 
  mode = 'milestone', 
  showCompleted = false,
  embedded = false,
  config 
}) {
  const [currentMode, setCurrentMode] = useState(mode);
  const [showCompletedTasks, setShowCompletedTasks] = useState(showCompleted);
  
  // Use the kanban hook for state management
  const {
    loading,
    error,
    containers,
    tasksByContainer,
    loadData,
    updateMilestonesOrder,
    moveTask,
    reorderTasks,
    setError,
    getTasksForContainer,
    findTask,
    findTaskContainer
  } = useProjectKanban({
    projectId,
    mode: currentMode,
    showCompleted: showCompletedTasks,
    config
  });
  
  // Drag and drop states
  const [activeId, setActiveId] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);
  
  // Modal for task creation/editing
  const createDialog = useDialog();
  const editDialog = useDialog();
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Handle drag start
  const handleDragStart = (event) => {
    const { active } = event;
    setActiveId(active.id);
    
    // Find the dragged item
    const activeIdStr = String(active.id);
    
    if (activeIdStr.startsWith('task-')) {
      const taskId = activeIdStr.replace('task-', '');
      const result = findTask(taskId);
      if (result) {
        setDraggedItem({ type: 'task', data: result.task });
      }
    } else if (activeIdStr.startsWith('milestone-') || activeIdStr.startsWith('status-')) {
      const containerId = activeIdStr.replace(/^(milestone-|status-)/, '');
      const container = containers.find(c => String(c.id) === containerId);
      if (container) {
        setDraggedItem({ type: 'container', data: container });
      }
    }
  };

  // Handle drag end
  const handleDragEnd = async (event) => {
    const { active, over } = event;
    
    setActiveId(null);
    setDraggedItem(null);
    
    if (!over) return;
    
    const activeIdStr = String(active.id);
    const overIdStr = String(over.id);
    
    try {
      if (activeIdStr.startsWith('task-')) {
        await handleTaskDrag(activeIdStr, overIdStr);
      } else if (currentMode === 'milestone' && activeIdStr.startsWith('milestone-')) {
        await handleMilestoneDrag(activeIdStr, overIdStr);
      }
    } catch (err) {
      console.error('Error handling drag end:', err);
      setError(err.message || 'Failed to update positions');
    }
  };

  // Handle task drag operations
  const handleTaskDrag = async (activeIdStr, overIdStr) => {
    const taskId = activeIdStr.replace('task-', '');
    const currentContainer = findTaskContainer(taskId);
    
    let newContainer = null;
    let newIndex = 0;
    
    if (overIdStr.startsWith('milestone-') || overIdStr.startsWith('status-')) {
      // Dropped on a container
      newContainer = overIdStr.replace(/^(milestone-|status-)/, '');
      const tasksInContainer = getTasksForContainer(newContainer);
      newIndex = tasksInContainer.length;
    } else if (overIdStr.startsWith('task-')) {
      // Dropped on another task
      const overTaskId = overIdStr.replace('task-', '');
      const overTaskContainer = findTaskContainer(overTaskId);
      if (overTaskContainer) {
        newContainer = overTaskContainer;
        const tasksInContainer = getTasksForContainer(overTaskContainer);
        const overTaskIndex = tasksInContainer.findIndex(t => String(t.id) === overTaskId);
        newIndex = Math.max(0, overTaskIndex);
      }
    }
    
    if (newContainer !== null && newContainer !== currentContainer) {
      // Move to different container
      await moveTask(taskId, currentContainer, newContainer, newIndex);
    } else if (newContainer === currentContainer && overIdStr.startsWith('task-')) {
      // Reorder within same container
      const tasksInContainer = getTasksForContainer(currentContainer);
      const oldIndex = tasksInContainer.findIndex(t => String(t.id) === taskId);
      if (oldIndex !== -1 && oldIndex !== newIndex) {
        const newTaskOrder = arrayMove(tasksInContainer, oldIndex, newIndex);
        await reorderTasks(currentContainer, newTaskOrder);
      }
    }
  };

  // Handle milestone drag operations
  const handleMilestoneDrag = async (activeIdStr, overIdStr) => {
    if (!overIdStr.startsWith('milestone-')) return;
    
    const activeMilestoneId = activeIdStr.replace('milestone-', '');
    const overMilestoneId = overIdStr.replace('milestone-', '');
    
    if (activeMilestoneId === overMilestoneId) return;
    
    const oldIndex = containers.findIndex(m => String(m.id) === activeMilestoneId);
    const newIndex = containers.findIndex(m => String(m.id) === overMilestoneId);
    
    if (oldIndex !== -1 && newIndex !== -1) {
      const newMilestones = arrayMove(containers, oldIndex, newIndex);
      await updateMilestonesOrder(newMilestones);
    }
  };

  // Handle task creation
  const handleCreateTask = async (containerData) => {
    const defaultValues = {
      project_id: projectId,
      task_type: currentMode === 'support' ? 'support' : 'task'
    };
    
    if (currentMode === 'support') {
      defaultValues.status = containerData.id;
    }
    
    createDialog.handleOpen({
      mode: 'create',
      containerId: containerData.id,
      containerType: currentMode,
      projectId,
      defaultValues
    });
  };

  // Handle task creation submit
  const handleTaskCreated = async (taskData, dialogData) => {
    try {
      const milestoneId = currentMode === 'milestone' ? dialogData.containerId : null;
      await task.createTask(taskData, milestoneId); // Updated function name
      await loadData();
      createDialog.handleClose();
    } catch (err) {
      console.error('Error creating task:', err);
      setError(err.message || 'Failed to create task');
    }
  };

  // Handle task edit
  const handleEditTask = (task) => {
    editDialog.handleOpen(task);
  };

  // Handle task edit submit
  const handleTaskEdited = async () => {
    await loadData();
    editDialog.handleClose();
  };

  // Render columns
  const renderColumns = () => {
    return containers.map((container) => {
      const tasks = getTasksForContainer(container.id);
      const containerId = currentMode === 'milestone' ? `milestone-${container.id}` : `status-${container.id}`;
      
      return (
        <KanbanColumn
          key={containerId}
          id={containerId}
          title={container.title}
          description={container.description}
          tasks={tasks}
          onAddTask={() => handleCreateTask(container)}
          color={currentMode === 'milestone' ? 'primary' : 'secondary'}
        >
          {tasks.map((task) => (
            <KanbanTaskCard
              key={`task-${task.id}`}
              task={task}
              onEdit={() => handleEditTask(task)}
              config={config}
            />
          ))}
        </KanbanColumn>
      );
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      {/* Header Controls */}
      {!embedded && (
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Typography variant="h5">Project Kanban</Typography>
          
          <ToggleButtonGroup
            value={currentMode}
            exclusive
            onChange={(_, value) => value && setCurrentMode(value)}
            size="small"
          >
            <ToggleButton value="milestone">Milestones</ToggleButton>
            <ToggleButton value="support">Support</ToggleButton>
          </ToggleButtonGroup>
          
          <FormControlLabel
            control={
              <Switch
                checked={showCompletedTasks}
                onChange={(e) => setShowCompletedTasks(e.target.checked)}
                size="small"
              />
            }
            label="Show completed"
          />
          
          <Button
            startIcon={<PlusIcon />}
            variant="outlined"
            size="small"
            onClick={() => handleCreateTask({ 
              id: containers[0]?.id,
              title: containers[0]?.title
            })}
            disabled={containers.length === 0}
          >
            Add Task
          </Button>
        </Box>
      )}

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            overflowX: 'auto',
            overflowY: 'hidden',
            minHeight: 500,
            pb: 2
          }}
        >
          <SortableContext
            items={containers.map(c => 
              currentMode === 'milestone' ? `milestone-${c.id}` : `status-${c.id}`
            )}
            strategy={horizontalListSortingStrategy}
          >
            {renderColumns()}
          </SortableContext>
        </Box>

        {/* Drag Overlay */}
        <DragOverlay>
          {draggedItem && draggedItem.type === 'task' ? (
            <KanbanTaskCard
              task={draggedItem.data}
              config={config}
              isDragging
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Task Creation Modal */}
      <CollectionModal
        open={createDialog.open}
        onClose={createDialog.handleClose}
        config={config}
        mode="create"
        data={createDialog.data}
        onSubmit={handleTaskCreated}
      />

      {/* Task Edit Modal */}
      <CollectionModal
        open={editDialog.open}
        onClose={editDialog.handleClose}
        config={config}
        mode="edit"
        data={editDialog.data}
        onSubmit={handleTaskEdited}
      />
    </Box>
  );
}