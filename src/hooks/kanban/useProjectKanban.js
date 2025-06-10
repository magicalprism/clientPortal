// hooks/useProjectKanban.js - Updated imports
'use client';

import { useState, useCallback, useEffect } from 'react';
import { 
  milestoneProject,
  milestoneTask, 
  task,
  taskConfig 
} from '@/lib/supabase/queries';

export const useProjectKanban = ({ 
  projectId, 
  mode = 'milestone', 
  showCompleted = false,
  config 
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [tasksByContainer, setTasksByContainer] = useState({});
  const [statusColumns, setStatusColumns] = useState([]);

  // Get status options from config
  const statusOptions = taskConfig.getTaskStatusOptions(config);

  // Load data based on current mode
  const loadData = useCallback(async () => {
    if (!projectId) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      if (mode === 'milestone') {
        // Load milestones and their tasks
        const { data: milestonesData, error: milestonesError } = await milestoneProject.fetchMilestonesForProject(projectId);
        
        if (milestonesError) throw milestonesError;
        
        const sortedMilestones = (milestonesData || []).sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
        setMilestones(sortedMilestones);
        
        if (sortedMilestones.length > 0) {
          const milestoneIds = sortedMilestones.map(m => m.id);
          const { data: tasksData, error: tasksError } = await milestoneTask.fetchTasksForMilestones(
            milestoneIds, 
            projectId, 
            showCompleted
          );
          
          if (tasksError) throw tasksError;
          
          setTasksByContainer(tasksData || {});
        } else {
          setTasksByContainer({});
        }
        
        setStatusColumns([]);
      } else {
        // Load support tasks grouped by status
        const { data: supportTasksData, error: supportError } = await task.fetchSupportTasks(
          projectId, 
          showCompleted
        );
        
        if (supportError) throw supportError;
        
        // Set up status columns
        const columns = statusOptions.map(option => ({
          id: option.value,
          title: option.label,
          status: option.value
        }));
        setStatusColumns(columns);
        
        setTasksByContainer(supportTasksData || {});
        setMilestones([]);
      }
    } catch (err) {
      console.error('Error loading kanban data:', err);
      setError(err.message || 'Failed to load kanban data');
    } finally {
      setLoading(false);
    }
  }, [projectId, mode, showCompleted, statusOptions]);

  // Optimistically update milestones order
  const updateMilestonesOrder = useCallback(async (newMilestones) => {
    setMilestones(newMilestones);
    
    try {
      // Use the organized milestone queries
      await Promise.all(
        newMilestones.map((milestone, index) => 
          milestoneProject.updateMilestoneOrder(milestone.id, index) // This should be milestone.updateMilestoneOrder
        )
      );
    } catch (err) {
      console.error('Error updating milestone order:', err);
      setError(err.message || 'Failed to update milestone order');
      loadData();
    }
  }, [loadData]);

  // Move task between containers
  const moveTask = useCallback(async (taskId, fromContainer, toContainer, newIndex) => {
    try {
      if (mode === 'milestone') {
        await milestoneTask.moveTaskToMilestone(taskId, fromContainer, toContainer, newIndex);
      } else {
        await task.updateTaskStatus(taskId, toContainer, newIndex);
      }
      
      await loadData();
    } catch (err) {
      console.error('Error moving task:', err);
      setError(err.message || 'Failed to move task');
    }
  }, [mode, loadData]);

  // Update task order within same container
  const reorderTasks = useCallback(async (containerId, newTaskOrder) => {
    setTasksByContainer(prev => ({
      ...prev,
      [containerId]: newTaskOrder
    }));
    
    try {
      await Promise.all(
        newTaskOrder.map((taskItem, index) => 
          task.updateTaskOrder(taskItem.id, index)
        )
      );
    } catch (err) {
      console.error('Error reordering tasks:', err);
      setError(err.message || 'Failed to reorder tasks');
      loadData();
    }
  }, [loadData]);

  // ... rest of the hook remains the same

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    // State
    loading,
    error,
    milestones,
    statusColumns,
    tasksByContainer,
    containers,
    
    // Actions
    loadData,
    updateMilestonesOrder,
    moveTask,
    reorderTasks,
    setError,
    
    // Utilities
    getContainer,
    getTasksForContainer,
    findTask,
    findTaskContainer,
    getTotalTaskCount,
    getCompletedTaskCount,
    
    // Config
    statusOptions
  };
};