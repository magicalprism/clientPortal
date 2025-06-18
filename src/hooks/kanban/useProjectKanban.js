'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { milestoneProject, task, table } from '@/lib/supabase/queries';

export const useProjectKanban = ({
  projectId,
  mode = 'milestone',
  showCompleted = false,
  config
}) => {
  // Ensure projectId is in the correct format for queries
  const normalizedProjectId = projectId ? (typeof projectId === 'string' && !isNaN(projectId) ? parseInt(projectId, 10) : projectId) : null;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [tasksByContainer, setTasksByContainer] = useState({});
  const [statusColumns, setStatusColumns] = useState([]);

  const statusOptions = useMemo(() => {
    if (!config?.fields) return [];
    const statusField = config.fields.find(field => field.name === 'status');
    return statusField?.options || [];
  }, [config]);

  const containers = useMemo(() => {
    if (mode === 'milestone') {
      return milestones.map(m => ({
        id: `milestone-${m.id}`,
        title: m.title,
        type: 'milestone',
        data: m
      }));
    } else {
      return statusColumns.map(col => ({
        id: `status-${col.status}`,
        title: col.title,
        type: 'status',
        data: col
      }));
    }
  }, [mode, milestones, statusColumns]);

  const loadData = useCallback(async () => {
    if (!normalizedProjectId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (mode === 'milestone') {
        const { data: milestonesData, error: milestonesError } = await milestoneProject.fetchMilestonesForProject(normalizedProjectId);
        if (milestonesError) throw milestonesError;

        const sortedMilestones = (milestonesData || []).sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
        setMilestones(sortedMilestones);

        if (sortedMilestones.length > 0) {
          const milestoneIds = sortedMilestones.map(m => m.id);

          // Try multiple methods to fetch tasks for the project
          let tasksData = [];
          let tasksError = null;
          
          const { createClient } = await import('@/lib/supabase/browser');
          const supabase = createClient();
          
          const taskQueryMethods = [
            async () => {
              if (!milestoneIds || milestoneIds.length === 0) {
                return { data: [], error: null };
              }
              
              // Try to fetch tasks by both milestone_id and project_id
              return await supabase
                .from('task')
                .select(`
                  *,
                  assigned_contact:assigned_id(id, title, first_name, last_name),
                  company:company_id(id, title),
                  project:project_id(id, title)
                `)
                .or(`milestone_id.in.(${milestoneIds.join(',')}),project_id.eq.${normalizedProjectId}`)
                .eq('is_deleted', false)
                .order('order_index')
                .order('created_at');
            },
            async () => {
              // Fallback: Try to fetch tasks by milestone_id only
              if (!milestoneIds || milestoneIds.length === 0) {
                return { data: [], error: null };
              }
              
              return await supabase
                .from('task')
                .select(`
                  *,
                  assigned_contact:assigned_id(id, title, first_name, last_name),
                  company:company_id(id, title),
                  project:project_id(id, title)
                `)
                .in('milestone_id', milestoneIds)
                .eq('is_deleted', false)
                .order('order_index')
                .order('created_at');
            },
            async () => {
              // Fallback: Try to fetch tasks by project_id only
              return await supabase
                .from('task')
                .select(`
                  *,
                  assigned_contact:assigned_id(id, title, first_name, last_name),
                  company:company_id(id, title),
                  project:project_id(id, title)
                `)
                .eq('project_id', normalizedProjectId)
                .eq('is_deleted', false)
                .order('order_index')
                .order('created_at');
            }
          ];

          for (const method of taskQueryMethods) {
            try {
              const result = await method();
              
              // Handle different response formats
              if (result && result.data) {
                tasksData = result.data;
                tasksError = null;
                break;
              } else if (Array.isArray(result)) {
                tasksData = result;
                tasksError = null;
                break;
              } else if (result && Array.isArray(result.tasks)) {
                tasksData = result.tasks;
                tasksError = null;
                break;
              }
            } catch (err) {
              console.error('Error fetching tasks:', err);
              tasksError = err;
              continue;
            }
          }

          if (tasksError) throw tasksError;
          
          // Filter out completed tasks if needed
          if (!showCompleted) {
            tasksData = tasksData.filter(t => t.status !== 'complete');
          }
          
          const grouped = {};
          
          // Initialize containers for all milestones
          for (const milestoneId of milestoneIds) {
            const key = `milestone-${milestoneId}`;
            grouped[key] = [];
          }
          
          // Check if we have tasks without milestone_id
          const tasksWithoutMilestone = tasksData.filter(t => !t.milestone_id);
          
          // If we have tasks without milestone_id, create a default "Unassigned" milestone
          if (tasksWithoutMilestone.length > 0) {
            // Create a default "Unassigned" milestone if it doesn't exist
            const unassignedMilestoneId = 'unassigned';
            const unassignedKey = `milestone-${unassignedMilestoneId}`;
            
            // Add the unassigned milestone to the list if it doesn't exist
            if (!milestoneIds.includes(unassignedMilestoneId)) {
              const unassignedMilestone = {
                id: unassignedMilestoneId,
                title: 'Unassigned',
                order_index: milestoneIds.length
              };
              
              setMilestones(prev => [...prev, unassignedMilestone]);
              grouped[unassignedKey] = [];
            }
            
            // Add tasks without milestone_id to the "Unassigned" milestone
            for (const t of tasksWithoutMilestone) {
              grouped[unassignedKey].push(t);
            }
          }
          
          // Group tasks by milestone
          for (const t of tasksData) {
            // Skip tasks without milestone_id (they're already handled above)
            if (!t.milestone_id) continue;
            
            const key = `milestone-${t.milestone_id}`;
            if (!grouped[key]) {
              grouped[key] = [];
            }
            
            grouped[key].push(t);
          }

          setTasksByContainer(grouped);
        } else {
          setTasksByContainer({});
        }

        setStatusColumns([]);
      } else {
        // Support mode - enhanced with multiple fallback methods
        const taskQueryMethods = [
          async () => {
            return await task.fetchTasks({
              projectId,
              taskType: 'support',
              showCompleted: true, // Always fetch all tasks, filter later
              groupByStatus: true
            });
          },
          async () => {
            return await table.task.fetchTasks({
              projectId,
              taskType: 'support',
              showCompleted: true,
              groupByStatus: true
            });
          },
          async () => {
            const { createClient } = await import('@/lib/supabase/browser');
            const supabase = createClient();
            
            const { data, error } = await supabase
              .from('task')
              .select(`
                *,
                assigned_contact:assigned_id(id, title, first_name, last_name),
                company:company_id(id, title),
                project:project_id(id, title)
              `)
              .eq('project_id', projectId)
              .eq('type', 'support');
              
            if (error) throw error;
            
            // Group by status manually
            const grouped = {};
            statusOptions.forEach(option => {
              grouped[option.value] = [];
            });
            
            data.forEach(task => {
              const status = task.status || 'todo';
              if (!grouped[status]) grouped[status] = [];
              grouped[status].push(task);
            });
            
            return { data: grouped, error: null };
          }
        ];

        let supportTasksData = {};
        let supportError = null;

        for (const method of taskQueryMethods) {
          try {
            const result = await method();
            
            if (result && result.data && typeof result.data === 'object') {
              supportTasksData = result.data;
              supportError = null;
              break;
            }
          } catch (err) {
            console.error('Error fetching support tasks:', err);
            supportError = err;
            continue;
          }
        }

        if (supportError) throw supportError;

        const columns = statusOptions.map(option => ({
          id: option.value,
          title: option.label,
          status: option.value
        }));

        // Filter out completed tasks if needed
        if (!showCompleted && supportTasksData.complete) {
          delete supportTasksData.complete;
        }

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
  }, [projectId, normalizedProjectId, mode, showCompleted, statusOptions]);

  const updateMilestonesOrder = useCallback(async (newMilestones) => {
    setMilestones(newMilestones);
    try {
      // Multiple fallback methods for milestone updates
      const updateMethods = [
        async () => {
          return await Promise.all(
            newMilestones.map((milestone, index) =>
              milestoneProject.updateMilestoneOrder(milestone.id, projectId, index)
            )
          );
        },
        async () => {
          return await Promise.all(
            newMilestones.map((milestone, index) =>
              milestoneProject.updateMilestoneOrder(milestone.id, projectId, index)
            )
          );
        }
      ];

      let success = false;
      for (const method of updateMethods) {
        try {
          const result = await method();
          if (result) {
            success = true;
            break;
          }
        } catch (methodError) {
          continue;
        }
      }

      if (!success) {
        throw new Error('Failed to update milestone order');
      }
    } catch (err) {
      console.error('Error updating milestone order:', err);
      setError(err.message || 'Failed to update milestone order');
      loadData();
    }
  }, [loadData, projectId]);

  const moveTask = useCallback(async (taskId, fromContainer, toContainer, newIndex) => {
    try {
      if (mode === 'milestone') {
        const toMilestoneId = toContainer.replace('milestone-', '');
        
        // Multiple fallback methods for moving task
        const moveMethods = [
          async () => {
            return await task.moveTaskToMilestone(taskId, parseInt(toMilestoneId), newIndex);
          },
          async () => {
            return await table.task.moveTaskToMilestone(taskId, parseInt(toMilestoneId), newIndex);
          },
          async () => {
            return await task.updateTask(taskId, { 
              milestone_id: parseInt(toMilestoneId), 
              order_index: newIndex,
              updated_at: new Date().toISOString()
            });
          }
        ];

        let success = false;
        for (const method of moveMethods) {
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
          throw new Error('No working move method found');
        }
      } else {
        const newStatus = toContainer.replace('status-', '');
        
        // Multiple fallback methods for updating status
        const updateMethods = [
          async () => {
            return await task.updateTaskStatus(taskId, newStatus, newIndex);
          },
          async () => {
            return await table.task.updateTaskStatus(taskId, newStatus, newIndex);
          },
          async () => {
            return await task.updateTask(taskId, { 
              status: newStatus, 
              order_index: newIndex,
              updated_at: new Date().toISOString()
            });
          }
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
          throw new Error('No working update method found');
        }
      }
      
      await loadData();
    } catch (err) {
      console.error('Error moving task:', err);
      setError(err.message || 'Failed to move task');
    }
  }, [mode, loadData]);

  const reorderTasks = useCallback(async (containerId, newTaskOrder) => {
    setTasksByContainer(prev => ({
      ...prev,
      [containerId]: newTaskOrder
    }));

    try {
      // Multiple fallback methods for reordering tasks
      const updateMethods = [
        async () => {
          return await Promise.all(
            newTaskOrder.map((taskItem, index) =>
              task.updateTaskOrder(taskItem.id, index)
            )
          );
        },
        async () => {
          return await Promise.all(
            newTaskOrder.map((taskItem, index) =>
              task.updateTask(taskItem.id, { 
                order_index: index,
                updated_at: new Date().toISOString()
              })
            )
          );
        },
        async () => {
          return await table.task.reorderTasks(newTaskOrder.map(t => t.id));
        }
      ];

      let success = false;
      for (const method of updateMethods) {
        try {
          const result = await method();
          if (result) {
            success = true;
            break;
          }
        } catch (methodError) {
          continue;
        }
      }

      if (!success) {
        console.warn('All reorder methods failed, but continuing optimistically');
      }
    } catch (err) {
      console.error('Error reordering tasks:', err);
      setError(err.message || 'Failed to reorder tasks');
      loadData();
    }
  }, [loadData]);

  const getContainer = useCallback((containerId) => {
    return containers.find(c => c.id === containerId);
  }, [containers]);

  const getTasksForContainer = useCallback((containerId) => {
    return tasksByContainer[containerId] || [];
  }, [tasksByContainer]);

  const findTask = useCallback((taskId) => {
    for (const [containerId, tasks] of Object.entries(tasksByContainer)) {
      const task = tasks.find(t => t.id === taskId);
      if (task) return { task, containerId };
    }
    return null;
  }, [tasksByContainer]);

  const findTaskContainer = useCallback((taskId) => {
    for (const [containerId, tasks] of Object.entries(tasksByContainer)) {
      if (tasks.some(t => t.id === taskId)) {
        return containerId;
      }
    }
    return null;
  }, [tasksByContainer]);

  const getTotalTaskCount = useCallback(() => {
    return Object.values(tasksByContainer).reduce((total, tasks) => total + tasks.length, 0);
  }, [tasksByContainer]);

  const getCompletedTaskCount = useCallback(() => {
    return Object.values(tasksByContainer).reduce((total, tasks) => {
      return total + tasks.filter(task => task.status === 'complete' || task.is_complete).length;
    }, 0);
  }, [tasksByContainer]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    loading,
    error,
    milestones,
    statusColumns,
    tasksByContainer,
    containers,
    loadData,
    updateMilestonesOrder,
    moveTask,
    reorderTasks,
    setError,
    getContainer,
    getTasksForContainer,
    findTask,
    findTaskContainer,
    getTotalTaskCount,
    getCompletedTaskCount,
    statusOptions
  };
};