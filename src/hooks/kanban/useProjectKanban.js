'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { milestoneProject, task } from '@/lib/supabase/queries';

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
    if (!projectId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (mode === 'milestone') {
        const { data: milestonesData, error: milestonesError } = await milestoneProject.fetchMilestonesForProject(projectId);
        if (milestonesError) throw milestonesError;

        const sortedMilestones = (milestonesData || []).sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
        setMilestones(sortedMilestones);

        if (sortedMilestones.length > 0) {
          const milestoneIds = sortedMilestones.map(m => m.id);

          const { data: tasksData, error: tasksError } = await task.fetchTasks({
            projectId,
            ids: null,
            showCompleted,
            milestoneId: null,
            groupByStatus: false
          });

          if (tasksError) throw tasksError;

          const grouped = {};
          for (const t of tasksData) {
            if (!t.milestone_id) continue;
            const key = `milestone-${t.milestone_id}`;
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(t);
          }

          setTasksByContainer(grouped);
        } else {
          setTasksByContainer({});
        }

        setStatusColumns([]);
      } else {
        const { data: supportTasksData, error: supportError } = await task.fetchTasks({
          projectId,
          taskType: 'support',
          showCompleted,
          groupByStatus: true
        });

        if (supportError) throw supportError;

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

  const updateMilestonesOrder = useCallback(async (newMilestones) => {
    setMilestones(newMilestones);
    try {
      await Promise.all(
        newMilestones.map((milestone, index) =>
          milestoneProject.updateMilestoneOrder(milestone.id, projectId, index)
        )
      );
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
        await task.moveTaskToMilestone(taskId, parseInt(toMilestoneId), newIndex);
      } else {
        const newStatus = toContainer.replace('status-', '');
        await task.updateTaskStatus(taskId, newStatus, newIndex);
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
