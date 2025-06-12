// hooks/kanban/useUniversalKanban.js
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import { table } from '@/lib/supabase/queries';
import { getStatusColor } from '@/data/statusColors';

export const useUniversalKanban = ({
  companyId = null,
  projectId = null,
  contactId = null, // New contact filter parameter
  showCompleted = true,
  searchQuery = '',
  filters = {},
  config
}) => {
  const theme = useTheme(); // Get MUI theme
  
  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [containers, setContainers] = useState([]);
  
  // Get status options from config
  const statusOptions = useMemo(() => {
    const statusField = config?.fields?.find(f => f.name === 'status');
    return statusField?.options || [
      { value: 'not started', label: 'Not Started' },
      { value: 'todo', label: 'To Do' },
      { value: 'in_progress', label: 'In Progress' },
      { value: 'complete', label: 'Complete' },
      { value: 'blocked', label: 'Blocked' },
      { value: 'cancelled', label: 'Cancelled' },
      { value: 'archived', label: 'Archived' },
      { value: 'unavailable', label: 'Unavailable' }
    ];
  }, [config]);

  // Fetch tasks based on filters
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let fetchedTasks = [];

      // Debug: Log current filter settings and what filters are being passed
      console.log('[useUniversalKanban] Filter settings:', {
        companyId,
        contactId,
        projectId,
        showCompleted,
        searchQuery,
        filters
      });
      console.log('[useUniversalKanban] Individual filters being applied:', Object.entries(filters));

      if (projectId && projectId !== 'all') {
        // Fetch tasks for specific project - SET showCompleted to true to include all tasks
        console.log('[useUniversalKanban] Fetching tasks for project:', projectId);

        const taskQueryMethods = [
          () => table.task.fetchTasks({ projectId, showCompleted: true }), // Include completed tasks
          () => table.task.fetchTasks({ project_id: projectId, showCompleted: true }),
          () => table.task.fetchTasksByProjectId(projectId),
          () => table.task.fetchByProjectId(projectId),
          () => table.task.getByProjectId(projectId),
          () => table.task.fetchAll({ project_id: projectId }),
          () => table.task.fetch({ project_id: projectId })
        ];

        let success = false;
        for (const method of taskQueryMethods) {
          try {
            const result = await method();
            console.log('[useUniversalKanban] Task query result:', result);
            
            // Handle different response formats
            if (result && result.data) {
              fetchedTasks = result.data;
            } else if (Array.isArray(result)) {
              fetchedTasks = result;
            } else if (result && Array.isArray(result.tasks)) {
              fetchedTasks = result.tasks;
            }
            
            success = true;
            console.log('[useUniversalKanban] Successfully fetched tasks:', fetchedTasks.length);
            break;
          } catch (methodError) {
            console.log('[useUniversalKanban] Task query method failed:', methodError.message);
            continue;
          }
        }

        if (!success) {
          console.warn('[useUniversalKanban] All task query methods failed for project');
          fetchedTasks = [];
        }

      } else if (companyId && companyId !== 'all') {
        // Fetch tasks for specific company - SET showCompleted to true to include all tasks
        console.log('[useUniversalKanban] Fetching tasks for company:', companyId);
        
        const companyTaskMethods = [
          () => table.task.fetchTasks({ companyId, showCompleted: true }), // Include completed tasks
          () => table.task.fetchTasks({ company_id: companyId, showCompleted: true }),
          () => table.task.fetchTasksByCompanyId(companyId),
          () => table.task.fetchByCompanyId(companyId),
          () => table.task.fetchAll({ company_id: companyId }),
          () => table.task.fetch({ company_id: companyId })
        ];

        let success = false;
        for (const method of companyTaskMethods) {
          try {
            const result = await method();
            console.log('[useUniversalKanban] Company task query result:', result);
            
            if (result && result.data) {
              fetchedTasks = result.data;
            } else if (Array.isArray(result)) {
              fetchedTasks = result;
            }
            
            success = true;
            console.log('[useUniversalKanban] Successfully fetched company tasks:', fetchedTasks.length);
            break;
          } catch (methodError) {
            console.log('[useUniversalKanban] Company task query method failed:', methodError.message);
            continue;
          }
        }

        if (!success) {
          console.warn('[useUniversalKanban] All company task query methods failed');
          fetchedTasks = [];
        }

      } else {
        // Fetch all tasks - SET showCompleted to true to include all tasks
        console.log('[useUniversalKanban] Fetching all tasks');
        
        const allTaskMethods = [
          () => table.task.fetchTasks({ showCompleted: true }), // Include completed tasks
          () => table.task.fetchTasks(),
          () => table.task.fetchAll(),
          () => table.task.fetch()
        ];

        let success = false;
        for (const method of allTaskMethods) {
          try {
            const result = await method();
            console.log('[useUniversalKanban] All tasks query result:', result);
            
            if (result && result.data) {
              fetchedTasks = result.data;
            } else if (Array.isArray(result)) {
              fetchedTasks = result;
            }
            
            success = true;
            console.log('[useUniversalKanban] Successfully fetched all tasks:', fetchedTasks.length);
            break;
          } catch (methodError) {
            console.log('[useUniversalKanban] All tasks query method failed:', methodError.message);
            continue;
          }
        }

        if (!success) {
          console.warn('[useUniversalKanban] All task query methods failed');
          fetchedTasks = [];
        }
      }

      // Apply filters
      let filteredTasks = fetchedTasks || [];
      console.log('[useUniversalKanban] Tasks before filtering:', filteredTasks.length);
      
      // ALWAYS filter out template tasks first (is_template=true should never show in kanban)
      const beforeTemplateFilter = filteredTasks.length;
      filteredTasks = filteredTasks.filter(task => task.is_template !== true);
      console.log('[useUniversalKanban] After template filter (excluding is_template=true):', beforeTemplateFilter, '->', filteredTasks.length);
      
      // Apply contact filter if specified
      if (contactId && contactId !== 'all') {
        const beforeContactFilter = filteredTasks.length;
        filteredTasks = filteredTasks.filter(task => {
          const assignedId = task.assigned_id;
          const matches = assignedId && assignedId.toString() === contactId.toString();
          if (!matches && beforeContactFilter < 5) { // Only log for first few tasks to avoid spam
            console.log('[useUniversalKanban] Task filtered out by contact:', {
              taskId: task.id,
              taskTitle: task.title,
              taskAssignedId: assignedId,
              filterContactId: contactId,
              matches
            });
          }
          return matches;
        });
        console.log('[useUniversalKanban] After contact filter:', beforeContactFilter, '->', filteredTasks.length);
      }
      
      // Debug: Log sample task to see its structure
      if (filteredTasks.length > 0) {
        console.log('[useUniversalKanban] Sample task:', filteredTasks[0]);
        console.log('[useUniversalKanban] Sample task status:', filteredTasks[0].status);
        console.log('[useUniversalKanban] showCompleted setting:', showCompleted);
      }

      // Apply search query
      const beforeSearchFilter = filteredTasks.length;
      if (searchQuery && searchQuery.trim()) {
        filteredTasks = filteredTasks.filter(task =>
          task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      console.log('[useUniversalKanban] After search filter:', beforeSearchFilter, '->', filteredTasks.length);

      // Apply additional filters (but skip certain filter keys that aren't actual task properties)
      const beforeAdditionalFilters = filteredTasks.length;
      const skipFilters = ['sort', 'sortBy', 'orderBy', 'order', 'limit', 'offset', 'page', 'pageSize', 'is_template', 'status']; // Skip these - is_template and status handled elsewhere
      
      Object.entries(filters).forEach(([key, value]) => {
        // Skip filters that aren't task properties or are handled elsewhere
        if (skipFilters.includes(key)) {
          console.log(`[useUniversalKanban] Skipping ${key} filter (handled elsewhere or not appropriate for kanban view)`);
          return;
        }
        
        if (value !== undefined && value !== null && value !== '') {
          const beforeThisFilter = filteredTasks.length;
          if (Array.isArray(value)) {
            filteredTasks = filteredTasks.filter(task => value.includes(task[key]));
          } else {
            filteredTasks = filteredTasks.filter(task => task[key] === value);
          }
          console.log(`[useUniversalKanban] After ${key} filter:`, beforeThisFilter, '->', filteredTasks.length);
        }
      });
      console.log('[useUniversalKanban] After all additional filters:', beforeAdditionalFilters, '->', filteredTasks.length);

      console.log('[useUniversalKanban] Tasks after filtering:', filteredTasks.length);
      
      // Debug: Check all unique status values in the actual data
      const uniqueStatuses = [...new Set(filteredTasks.map(task => task.status))].filter(Boolean);
      console.log('[useUniversalKanban] Unique status values found in data:', uniqueStatuses);
      
      // Debug: Count tasks by actual status
      const actualStatusCounts = {};
      filteredTasks.forEach(task => {
        const status = task.status || 'no_status';
        actualStatusCounts[status] = (actualStatusCounts[status] || 0) + 1;
      });
      console.log('[useUniversalKanban] Actual status distribution:', actualStatusCounts);
      
      setTasks(filteredTasks);

      // Create containers based on status options (always show all configured statuses)
      const statusCounts = {};
      filteredTasks.forEach(task => {
        const status = task.status || 'todo';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });

      console.log('[useUniversalKanban] Status counts:', statusCounts);
      console.log('[useUniversalKanban] Sample tasks with status:', filteredTasks.slice(0, 3).map(t => ({ id: t.id, title: t.title, status: t.status })));

      // Always create containers for all configured status options
      const statusContainers = statusOptions.map(statusOption => {
        const colorInfo = getStatusColor(statusOption.value, config, theme);
        
        return {
          id: statusOption.value,
          title: statusOption.label,
          color: colorInfo.color,
          bg: colorInfo.bg,
          data: statusOption,
          taskCount: statusCounts[statusOption.value] || 0
        };
      });
      
      // Add containers for any custom statuses found in data that aren't in config
      Object.keys(statusCounts).forEach(statusKey => {
        if (!statusOptions.find(s => s.value === statusKey) && statusCounts[statusKey] > 0) {
          const colorInfo = getStatusColor(statusKey, config, theme);
          
          console.log('[useUniversalKanban] Found custom status not in config:', statusKey, 'with', statusCounts[statusKey], 'tasks');
          
          statusContainers.push({
            id: statusKey,
            title: colorInfo.label,
            color: colorInfo.color,
            bg: colorInfo.bg,
            data: { value: statusKey, label: colorInfo.label },
            taskCount: statusCounts[statusKey]
          });
        }
      });

      // Always show all configured status containers (including complete)
      const finalContainers = statusContainers;

      console.log('[useUniversalKanban] Created containers:', finalContainers.map(c => ({ id: c.id, title: c.title, taskCount: c.taskCount })));
      setContainers(finalContainers);

    } catch (err) {
      console.error('[useUniversalKanban] Error loading data:', err);
      setError(err.message || 'Failed to load tasks');
      setTasks([]);
      setContainers([]);
    } finally {
      setLoading(false);
    }
  }, [companyId, projectId, contactId, showCompleted, searchQuery, filters, statusOptions, theme]); // Added contactId to dependencies

  // Group tasks by container
  const tasksByContainer = useMemo(() => {
    const grouped = {};
    
    containers.forEach(container => {
      const containerTasks = tasks.filter(task => (task.status || 'todo') === container.id);
      grouped[container.id] = containerTasks.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
      
      if (container.id === 'complete') {
        console.log('[useUniversalKanban] Complete container tasks:', containerTasks.map(t => ({ id: t.id, title: t.title, status: t.status })));
      }
    });
    
    console.log('[useUniversalKanban] Tasks by container summary:', 
      Object.entries(grouped).map(([containerId, containerTasks]) => ({ 
        container: containerId, 
        count: containerTasks.length,
        taskIds: containerTasks.map(t => t.id)
      }))
    );
    return grouped;
  }, [tasks, containers]);

  // Move task between containers (status)
  const moveTask = useCallback(async (taskId, fromContainer, toContainer, position) => {
    try {
      console.log('[useUniversalKanban] Moving task:', { taskId, fromContainer, toContainer, position });
      
      // Try different update methods that might exist
      const updateMethods = [
        () => table.task.updateTask(taskId, { 
          status: toContainer,
          order_index: position,
          updated_at: new Date().toISOString()
        }),
        () => table.task.update(taskId, { 
          status: toContainer,
          order_index: position 
        }),
        () => table.task.patch(taskId, { 
          status: toContainer,
          order_index: position 
        }),
        () => table.task.edit(taskId, { 
          status: toContainer,
          order_index: position 
        }),
        () => table.task.updateTaskStatus(taskId, toContainer, position)
      ];

      let success = false;
      for (const method of updateMethods) {
        try {
          const result = await method();
          console.log('[useUniversalKanban] Update result:', result);
          
          if (result && !result.error) {
            success = true;
            break;
          }
        } catch (methodError) {
          console.log('[useUniversalKanban] Update method failed:', methodError.message);
          continue;
        }
      }

      if (!success) {
        throw new Error('No working update method found');
      }

      // Optimistically update local state
      setTasks(prev => prev.map(task => 
        task.id.toString() === taskId.toString() 
          ? { ...task, status: toContainer, order_index: position }
          : task
      ));

    } catch (err) {
      console.error('[useUniversalKanban] Error moving task:', err);
      setError('Failed to move task');
      // Reload data on error
      loadData();
    }
  }, [loadData]);

  // Reorder tasks within container
  const reorderTasks = useCallback(async (containerId, newOrderedTasks) => {
    try {
      console.log('[useUniversalKanban] Reordering tasks:', { containerId, taskCount: newOrderedTasks.length });
      
      // Update order_index for each task
      const updates = newOrderedTasks.map((task, index) => ({
        id: task.id,
        order_index: index
      }));

      // Try different update methods
      for (const update of updates) {
        const updateMethods = [
          () => table.task.updateTask(update.id, { 
            order_index: update.order_index,
            updated_at: new Date().toISOString()
          }),
          () => table.task.update(update.id, { order_index: update.order_index }),
          () => table.task.updateTaskOrder(update.id, update.order_index)
        ];

        let success = false;
        for (const method of updateMethods) {
          try {
            const result = await method();
            if (result && !result.error) {
              success = true;
              break;
            }
          } catch (methodError) {
            continue;
          }
        }

        if (!success) {
          console.warn('[useUniversalKanban] Failed to update order for task:', update.id);
        }
      }

      // Update local state
      setTasks(prev => prev.map(task => {
        const updatedTask = updates.find(u => u.id.toString() === task.id.toString());
        return updatedTask ? { ...task, order_index: updatedTask.order_index } : task;
      }));

    } catch (err) {
      console.error('[useUniversalKanban] Error reordering tasks:', err);
      setError('Failed to reorder tasks');
      // Reload data on error
      loadData();
    }
  }, [loadData]);

  // Update task (for marking complete, etc.)
  const updateTask = useCallback(async (taskId, updates) => {
    try {
      console.log('[useUniversalKanban] Updating task:', { taskId, updates });
      
      const updateMethods = [
        () => table.task.updateTask(taskId, { 
          ...updates,
          updated_at: new Date().toISOString()
        }),
        () => table.task.update(taskId, updates),
        () => table.task.patch(taskId, updates),
        () => table.task.edit(taskId, updates)
      ];

      let success = false;
      for (const method of updateMethods) {
        try {
          const result = await method();
          if (result && !result.error) {
            success = true;
            break;
          }
        } catch (methodError) {
          console.log('[useUniversalKanban] Update method failed:', methodError.message);
          continue;
        }
      }

      if (!success) {
        throw new Error('No working update method found');
      }

      // Update local state
      setTasks(prev => prev.map(task => 
        task.id.toString() === taskId.toString() 
          ? { ...task, ...updates }
          : task
      ));

    } catch (err) {
      console.error('[useUniversalKanban] Error updating task:', err);
      setError('Failed to update task');
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Get stats
  const getTotalTaskCount = useCallback(() => tasks.length, [tasks]);
  const getCompletedTaskCount = useCallback(() => 
    tasks.filter(t => t.status === 'complete').length, [tasks]);
  const getPendingTaskCount = useCallback(() => 
    tasks.filter(t => t.status !== 'complete').length, [tasks]);
  const getOverdueTaskCount = useCallback(() => 
    tasks.filter(t => {
      if (!t.due_date || t.status === 'complete') return false;
      return new Date(t.due_date) < new Date();
    }).length, [tasks]);

  // Load data on mount and when dependencies change
  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    loading,
    error,
    tasks,
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
  };
};