// hooks/kanban/useUniversalKanban.js

import { useState, useEffect, useCallback, useMemo } from 'react';
import { table } from '@/lib/supabase/queries';

export const useUniversalKanban = ({
  companyId = null,
  projectId = null,
  showCompleted = false,
  searchQuery = '',
  filters = {},
  config
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  // Get statuses from config instead of hardcoding them
  const getStatusesFromConfig = useMemo(() => {
    if (config?.fields?.status?.options) {
      return config.fields.status.options.map(option => ({
        id: option.value || option.id || option,
        label: option.label || option.title || option,
        color: option.color || '#6B7280'
      }));
    }
    
    // Fallback if config structure is different
    if (config?.statuses) {
      return config.statuses.map(status => ({
        id: status.value || status.id || status,
        label: status.label || status.title || status,
        color: status.color || '#6B7280'
      }));
    }
    
    // Default fallback
    return [
      { id: 'todo', label: 'To Do', color: '#6B7280' },
      { id: 'in_progress', label: 'In Progress', color: '#3B82F6' },
      { id: 'review', label: 'Review', color: '#F59E0B' },
      { id: 'complete', label: 'Complete', color: '#10B981' },
      { id: 'on_hold', label: 'On Hold', color: '#EF4444' }
    ];
  }, [config]);

  const configStatuses = getStatusesFromConfig;

  // Fetch tasks with filters
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let data, error;
      
      // Try different methods to fetch tasks based on what's available in your API
      if (projectId && projectId !== 'all') {
        // Try to fetch tasks for specific project
        try {
          ({ data, error } = await table.task.fetchTasksByProjectId(projectId));
        } catch (fetchError) {
          // If that doesn't work, try a more basic method
          console.log('[useUniversalKanban] fetchTasksByProjectId not available, trying alternative');
          ({ data, error } = await table.task.fetchTasks({ project_id: projectId }));
        }
      } else {
        // For all tasks, try to fetch them
        try {
          ({ data, error } = await table.task.fetchAllTasks());
        } catch (fetchError) {
          console.log('[useUniversalKanban] fetchAllTasks not available, returning empty array');
          data = [];
          error = null;
        }
      }
      
      if (error) throw error;
      
      let filteredTasks = data || [];
      
      // Apply company filter client-side if needed
      if (companyId && companyId !== 'all') {
        filteredTasks = filteredTasks.filter(task => 
          task.project?.company_id === companyId
        );
      }
      
      // Apply completion filter
      if (!showCompleted) {
        filteredTasks = filteredTasks.filter(task => task.status !== 'complete');
      }
      
      // Apply search query client-side
      if (searchQuery) {
        filteredTasks = filteredTasks.filter(task =>
          task.title?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      // Apply additional filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          filteredTasks = filteredTasks.filter(task => task[key] === value);
        }
      });
      
      setTasks(filteredTasks);
      
    } catch (error) {
      console.error('[useUniversalKanban] Error loading data:', error);
      setError(error.message || 'Failed to load tasks');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [companyId, projectId, showCompleted, searchQuery, filters, refreshKey]);

  // Group tasks by status using config statuses
  const tasksByContainer = useMemo(() => {
    const grouped = {};
    
    // Initialize all config statuses
    configStatuses.forEach(status => {
      grouped[`status-${status.id}`] = [];
    });
    
    // Group tasks by status
    tasks.forEach(task => {
      const status = task.status || 'todo';
      const containerId = `status-${status}`;
      
      if (grouped[containerId]) {
        grouped[containerId].push(task);
      } else {
        // Handle custom statuses not in config
        grouped[containerId] = [task];
      }
    });
    
    return grouped;
  }, [tasks, configStatuses]);

  // Create containers (status columns) using config statuses
  const containers = useMemo(() => {
    const statusContainers = [];
    
    // Add config statuses that have tasks
    configStatuses.forEach(status => {
      const containerId = `status-${status.id}`;
      if (tasksByContainer[containerId] && tasksByContainer[containerId].length > 0) {
        statusContainers.push({
          id: containerId,
          title: status.label,
          color: status.color,
          data: status
        });
      }
    });
    
    // Add custom statuses that have tasks but aren't in config
    Object.keys(tasksByContainer).forEach(containerId => {
      if (tasksByContainer[containerId].length > 0) {
        const statusId = containerId.replace('status-', '');
        const isConfigStatus = configStatuses.find(s => s.id === statusId);
        
        if (!isConfigStatus) {
          statusContainers.push({
            id: containerId,
            title: statusId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            color: '#6B7280',
            data: { id: statusId, label: statusId }
          });
        }
      }
    });
    
    return statusContainers;
  }, [tasksByContainer, configStatuses]);

  // Move task to different status
  const moveTask = useCallback(async (taskId, fromContainer, toContainer, newIndex = 0) => {
    try {
      const newStatus = toContainer.replace('status-', '');
      
      // Use the existing task update method
      const { data, error } = await table.task.updateTask(taskId, { 
        status: newStatus 
      });
      
      if (error) throw error;
      
      // Refresh data to reflect changes
      setRefreshKey(prev => prev + 1);
      
      return data;
      
    } catch (error) {
      console.error('[useUniversalKanban] Error moving task:', error);
      setError(`Failed to move task: ${error.message}`);
      throw error;
    }
  }, []);

  // Reorder tasks within the same container
  const reorderTasks = useCallback(async (containerId, reorderedTasks) => {
    try {
      // Update the order_index for each task
      const updates = reorderedTasks.map((task, index) => ({
        id: task.id,
        order_index: index
      }));
      
      // Update tasks in batches using the existing update method
      for (const update of updates) {
        await table.task.updateTask(update.id, { order_index: update.order_index });
      }
      
      // Refresh data
      setRefreshKey(prev => prev + 1);
      
    } catch (error) {
      console.error('[useUniversalKanban] Error reordering tasks:', error);
      setError(`Failed to reorder tasks: ${error.message}`);
    }
  }, []);

  // Update task
  const updateTask = useCallback(async (taskId, updates) => {
    try {
      const { data, error } = await table.task.updateTask(taskId, updates);
      
      if (error) throw error;
      
      // Refresh data
      setRefreshKey(prev => prev + 1);
      
      return data;
      
    } catch (error) {
      console.error('[useUniversalKanban] Error updating task:', error);
      setError(`Failed to update task: ${error.message}`);
      throw error;
    }
  }, []);

  // Get task counts
  const getTotalTaskCount = useCallback(() => {
    return tasks.length;
  }, [tasks]);

  const getCompletedTaskCount = useCallback(() => {
    return tasks.filter(task => task.status === 'complete').length;
  }, [tasks]);

  const getPendingTaskCount = useCallback(() => {
    return tasks.filter(task => task.status !== 'complete').length;
  }, [tasks]);

  const getOverdueTaskCount = useCallback(() => {
    const now = new Date();
    return tasks.filter(task => 
      task.due_date && 
      new Date(task.due_date) < now && 
      task.status !== 'complete'
    ).length;
  }, [tasks]);

  // Get tasks by status
  const getTasksByStatus = useCallback((status) => {
    return tasks.filter(task => task.status === status);
  }, [tasks]);

  // Get tasks by priority
  const getTasksByPriority = useCallback((priority) => {
    return tasks.filter(task => task.priority === priority);
  }, [tasks]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Refresh data
  const refresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  // Load data when dependencies change
  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    // State
    loading,
    error,
    tasks,
    containers,
    tasksByContainer,
    
    // Actions
    loadData,
    moveTask,
    reorderTasks,
    updateTask,
    clearError,
    refresh,
    
    // Getters
    getTotalTaskCount,
    getCompletedTaskCount,
    getPendingTaskCount,
    getOverdueTaskCount,
    getTasksByStatus,
    getTasksByPriority,
    
    // Utils
    configStatuses
  };
};