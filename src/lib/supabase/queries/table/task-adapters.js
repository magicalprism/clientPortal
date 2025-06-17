// lib/supabase/queries/table/task-adapters.js
// Adapter functions to maintain backward compatibility with existing code

import * as taskModule from './task';

/**
 * Adapter function for fetchTasks
 * Maps to appropriate task module functions based on parameters
 */
export const fetchTasks = async ({
  projectId = null,
  ids = null,
  showCompleted = false,
  milestoneId = null,
  taskType = null,
  groupByStatus = false
}) => {
  // If milestone ID is provided, fetch tasks for that milestone
  if (milestoneId) {
    return await taskModule.fetchTasksForMilestone(milestoneId, showCompleted);
  }
  
  // If project ID is provided, fetch tasks for that project
  if (projectId) {
    const { data, error } = await taskModule.fetchTasksByProjectId(projectId);
    
    if (error) return { data: null, error };
    
    // Filter by task type if specified
    let filteredData = data;
    if (taskType) {
      filteredData = data.filter(task => task.type === taskType);
    }
    
    // Filter out completed tasks if not showing completed
    if (!showCompleted) {
      filteredData = filteredData.filter(task => task.status !== 'complete');
    }
    
    // Group by status if requested
    if (groupByStatus) {
      const grouped = {
        not_started: [],
        todo: [],
        in_progress: [],
        complete: [],
        archived: []
      };
      
      filteredData.forEach(task => {
        const status = task.status || 'todo';
        if (grouped[status]) {
          // Use spread operator to ensure all nested fields are preserved
          grouped[status].push({...task});
        }
      });
      
      return { data: grouped, error: null };
    }
    
    return { data: filteredData, error: null };
  }
  
  // If specific IDs are provided, fetch those tasks
  if (ids && Array.isArray(ids) && ids.length > 0) {
    const promises = ids.map(id => taskModule.fetchTaskById(id));
    const results = await Promise.all(promises);
    
    const data = results
      .filter(result => !result.error)
      .map(result => result.data)
      .filter(Boolean);
    
    return { data, error: null };
  }
  
  // Default to fetching all tasks
  const { data, error } = await taskModule.fetchAllTasks();
  
  if (error) return { data: null, error };
  
  // Filter by task type if specified
  let filteredData = data;
  if (taskType) {
    filteredData = data.filter(task => task.type === taskType);
  }
  
  // Filter out completed tasks if not showing completed
  if (!showCompleted) {
    filteredData = filteredData.filter(task => task.status !== 'complete');
  }
  
  // Group by status if requested
  if (groupByStatus) {
    const grouped = {
      not_started: [],
      todo: [],
      in_progress: [],
      complete: [],
      archived: []
    };
    
    filteredData.forEach(task => {
      const status = task.status || 'todo';
      if (grouped[status]) {
        // Use spread operator to ensure all nested fields are preserved
        grouped[status].push({...task});
      }
    });
    
    return { data: grouped, error: null };
  }
  
  return { data: filteredData, error: null };
};

/**
 * Adapter function for updateTaskOrder
 * Maps to reorderTasks in the task module
 */
export const updateTaskOrder = async (taskId, newIndex) => {
  // First, get the task to determine its parent/container
  const { data: task, error: fetchError } = await taskModule.fetchTaskById(taskId);
  
  if (fetchError) return { data: null, error: fetchError };
  
  // Get all tasks with the same parent/milestone
  const parentId = task.parent_id;
  const milestoneId = task.milestone_id;
  
  let tasksInSameContainer;
  
  if (milestoneId) {
    const { data, error } = await taskModule.fetchTasksForMilestone(milestoneId);
    if (error) return { data: null, error };
    tasksInSameContainer = data;
  } else if (parentId) {
    const { data, error } = await taskModule.fetchChildTasks(parentId);
    if (error) return { data: null, error };
    tasksInSameContainer = data;
  } else {
    // If no parent or milestone, get tasks with the same project
    const projectId = task.project_id;
    if (projectId) {
      const { data, error } = await taskModule.fetchTasksByProjectId(projectId);
      if (error) return { data: null, error };
      tasksInSameContainer = data.filter(t => !t.parent_id && !t.milestone_id);
    } else {
      // If no project either, get all top-level tasks
      const { data, error } = await taskModule.fetchAllTasks();
      if (error) return { data: null, error };
      tasksInSameContainer = data.filter(t => !t.parent_id && !t.milestone_id && !t.project_id);
    }
  }
  
  // Remove the task from its current position
  const taskIndex = tasksInSameContainer.findIndex(t => t.id === taskId);
  if (taskIndex !== -1) {
    tasksInSameContainer.splice(taskIndex, 1);
  }
  
  // Insert the task at the new position
  tasksInSameContainer.splice(newIndex, 0, task);
  
  // Get the IDs in the new order
  const taskIds = tasksInSameContainer.map(t => t.id);
  
  // Use reorderTasks to update the order
  return await taskModule.reorderTasks(taskIds, parentId);
};

// Export all original task module functions
export * from './task';