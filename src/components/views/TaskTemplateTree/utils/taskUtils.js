// components/views/TaskTemplateTree/utils/taskUtils.js - Utility functions for task template tree operations

/**
 * Groups tasks by milestone_id and builds nested tree structure
 * Only processes tasks marked as templates
 * @param {Array} tasks - Flat array of task objects
 * @returns {Object} Object with milestone_id as keys and nested task trees as values
 */
export const groupTasksByMilestone = (tasks) => {
  if (!Array.isArray(tasks)) {
    console.warn('groupTasksByMilestone: tasks is not an array:', tasks);
    return {};
  }
  
  // Filter to only include template tasks
  const templateTasks = tasks.filter(task => task.is_template === true);
  console.log('📝 Template tasks found:', templateTasks.length);
  
  // First group by milestone_id
  const groupedByMilestone = templateTasks.reduce((acc, task) => {
    const milestoneId = task.milestone_id || 'unassigned';
    if (!acc[milestoneId]) {
      acc[milestoneId] = [];
    }
    acc[milestoneId].push(task);
    return acc;
  }, {});
  
  console.log('📝 Grouped by milestone:', Object.keys(groupedByMilestone));
  
  // Build tree structure for each milestone group
  const result = {};
  Object.keys(groupedByMilestone).forEach(milestoneId => {
    result[milestoneId] = buildTaskTree(groupedByMilestone[milestoneId]);
  });
  
  return result;
};

/**
 * Builds a nested tree structure from flat array of tasks
 * @param {Array} tasks - Flat array of tasks for a single milestone
 * @returns {Array} Nested tree structure ordered by order_index
 */
export const buildTaskTree = (tasks) => {
  if (!Array.isArray(tasks)) return [];
  
  // Create a map for quick lookup
  const taskMap = new Map();
  tasks.forEach(task => {
    taskMap.set(task.id, { ...task, children: [] });
  });
  
  const rootTasks = [];
  
  // Build the tree structure
  taskMap.forEach(task => {
    if (task.parent_id && taskMap.has(task.parent_id)) {
      // This is a child task
      taskMap.get(task.parent_id).children.push(task);
    } else {
      // This is a root task
      rootTasks.push(task);
    }
  });
  
  // Sort each level by order_index
  const sortByOrderIndex = (tasks) => {
    tasks.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
    tasks.forEach(task => {
      if (task.children?.length > 0) {
        sortByOrderIndex(task.children);
      }
    });
  };
  
  sortByOrderIndex(rootTasks);
  return rootTasks;
};

/**
 * Flattens a tree structure back to a flat array with updated order_index
 * @param {Array} tree - Nested tree structure
 * @param {number} milestoneId - Milestone ID for the tasks
 * @param {number} parentId - Parent ID (null for root level)
 * @returns {Array} Flat array with updated order_index values
 */
export const flattenTreeWithOrder = (tree, milestoneId, parentId = null) => {
  const result = [];
  
  tree.forEach((task, index) => {
    const flatTask = {
      ...task,
      milestone_id: milestoneId,
      parent_id: parentId,
      order_index: index,
    };
    
    // Remove children from the flat task object
    const { children, ...taskWithoutChildren } = flatTask;
    result.push(taskWithoutChildren);
    
    // Recursively flatten children
    if (children && children.length > 0) {
      const childTasks = flattenTreeWithOrder(children, milestoneId, task.id);
      result.push(...childTasks);
    }
  });
  
  return result;
};

/**
 * Gets all task IDs in a tree (for drag and drop contexts)
 * @param {Array} tree - Tree structure
 * @returns {Array} Array of all task IDs
 */
export const getAllTaskIds = (tree) => {
  const ids = [];
  
  const traverse = (nodes) => {
    nodes.forEach(node => {
      ids.push(node.id.toString());
      if (node.children?.length > 0) {
        traverse(node.children);
      }
    });
  };
  
  traverse(tree);
  return ids;
};

/**
 * Finds a task in a tree structure
 * @param {Array} tree - Tree structure to search
 * @param {string|number} taskId - ID to find
 * @returns {Object|null} Found task or null
 */
export const findTaskInTree = (tree, taskId) => {
  for (const task of tree) {
    if (task.id.toString() === taskId.toString()) {
      return task;
    }
    if (task.children?.length > 0) {
      const found = findTaskInTree(task.children, taskId);
      if (found) return found;
    }
  }
  return null;
};

/**
 * Removes a task from tree structure
 * @param {Array} tree - Tree to modify
 * @param {string|number} taskId - ID of task to remove
 * @returns {boolean} True if task was found and removed
 */
export const removeTaskFromTree = (tree, taskId) => {
  for (let i = 0; i < tree.length; i++) {
    if (tree[i].id.toString() === taskId.toString()) {
      tree.splice(i, 1);
      return true;
    }
    if (tree[i].children?.length > 0) {
      if (removeTaskFromTree(tree[i].children, taskId)) {
        return true;
      }
    }
  }
  return false;
};

/**
 * Inserts a task at a specific position in tree
 * @param {Array} tree - Tree to modify
 * @param {Object} taskToInsert - Task to insert
 * @param {string|number} targetId - ID of target position
 */
export const insertTaskInTree = (tree, taskToInsert, targetId) => {
  for (let i = 0; i < tree.length; i++) {
    if (tree[i].id.toString() === targetId.toString()) {
      // Insert as sibling after target
      tree.splice(i + 1, 0, { ...taskToInsert, children: [] });
      return true;
    }
    if (tree[i].children?.length > 0) {
      if (insertTaskInTree(tree[i].children, taskToInsert, targetId)) {
        return true;
      }
    }
  }
  return false;
};

/**
 * ✅ Simplified task order update - returns data for parent component to handle
 * This removes the complex Supabase integration from utils and lets the parent handle it
 * @param {Object} groupedTasks - Tasks grouped by milestone
 * @param {string} activeId - ID of the dragged task
 * @param {string} overId - ID of the drop target
 * @returns {Object} Update instructions for parent component
 */
export const getTaskUpdateInstructions = (groupedTasks, activeId, overId) => {
  // Find the active task and its current location
  let activeTask = null;
  let activeMilestone = null;
  
  // Find active task across all milestones
  Object.keys(groupedTasks).forEach(milestoneId => {
    const found = findTaskInTree(groupedTasks[milestoneId], activeId);
    if (found) {
      activeTask = found;
      activeMilestone = milestoneId;
    }
  });
  
  if (!activeTask) {
    console.error('Active task not found:', activeId);
    return null;
  }
  
  // Find drop target
  let overTask = null;
  let overMilestone = null;
  
  // Check if dropping on a milestone header
  if (overId.startsWith('milestone-')) {
    overMilestone = overId.replace('milestone-', '');
  } else {
    // Find the task we're dropping on
    Object.keys(groupedTasks).forEach(milestoneId => {
      const found = findTaskInTree(groupedTasks[milestoneId], overId);
      if (found) {
        overTask = found;
        overMilestone = milestoneId;
      }
    });
  }
  
  // Return update instructions for the parent component to execute
  return {
    activeTask,
    activeMilestone,
    overTask,
    overMilestone,
    updateType: overMilestone && overMilestone !== activeMilestone ? 'milestone_change' : 'reorder',
    updateData: {
      taskId: parseInt(activeId),
      newMilestoneId: overMilestone === 'unassigned' ? null : parseInt(overMilestone),
      newParentId: overTask ? overTask.parent_id : null,
      newOrderIndex: overTask ? (overTask.order_index || 0) + 1 : 0
    }
  };
};

/**
 * ✅ Simple mock function for testing (can be removed in production)
 * @param {Array} updatedTasks - Array of tasks that would be updated
 */
export const mockUpdateTasks = async (updatedTasks) => {
  console.log('🔧 Mock updating tasks:', updatedTasks);
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return { success: true, data: updatedTasks };
};

/**
 * ✅ Create default task template data structure
 * @param {Object} taskData - Partial task data
 * @returns {Object} Complete task template data
 */
export const createNewTaskTemplate = (taskData = {}) => {
  return {
    title: taskData.title || 'New Task Template',
    is_template: true,
    milestone_id: taskData.milestone_id || null,
    parent_id: taskData.parent_id || null,
    order_index: taskData.order_index || 0,
    status: 'not_started',
    type: 'task',
    priority: 'medium',
    content: '',
    description: '',
    estimated_duration: null,
    project_id: taskData.project_id || null,
    company_id: taskData.company_id || null,
    assigned_id: null,
    due_date: null,
    start_date: null,
    all_day: false,
    is_launch: false,
    ...taskData
  };
};

/**
 * ✅ Validate task data structure
 * @param {Object} task - Task object to validate
 * @returns {Object} Validation result with errors if any
 */
export const validateTaskData = (task) => {
  const errors = [];
  
  if (!task.title || task.title.trim().length === 0) {
    errors.push('Title is required');
  }
  
  if (task.title && task.title.length > 255) {
    errors.push('Title must be less than 255 characters');
  }
  
  if (task.milestone_id && isNaN(parseInt(task.milestone_id))) {
    errors.push('Milestone ID must be a number');
  }
  
  if (task.parent_id && isNaN(parseInt(task.parent_id))) {
    errors.push('Parent ID must be a number');
  }
  
  const validStatuses = ['todo', 'in_progress', 'complete', 'blocked', 'on_hold'];
  if (task.status && !validStatuses.includes(task.status)) {
    errors.push('Status must be one of: ' + validStatuses.join(', '));
  }
  
  const validPriorities = ['low', 'medium', 'high', 'urgent'];
  if (task.priority && !validPriorities.includes(task.priority)) {
    errors.push('Priority must be one of: ' + validPriorities.join(', '));
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * ✅ Calculate task tree statistics
 * @param {Array} tree - Task tree structure
 * @returns {Object} Statistics about the tree
 */
export const calculateTreeStats = (tree) => {
  let totalTasks = 0;
  let completedTasks = 0;
  let maxDepth = 0;
  
  const traverse = (nodes, depth = 0) => {
    maxDepth = Math.max(maxDepth, depth);
    
    nodes.forEach(node => {
      totalTasks++;
      if (node.status === 'complete') {
        completedTasks++;
      }
      
      if (node.children?.length > 0) {
        traverse(node.children, depth + 1);
      }
    });
  };
  
  traverse(tree);
  
  return {
    totalTasks,
    completedTasks,
    completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
    maxDepth
  };
};