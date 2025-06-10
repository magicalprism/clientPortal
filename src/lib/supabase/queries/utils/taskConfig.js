// lib/supabase/queries/utils/taskConfig.js

/**
 * Extract status options from task configuration
 * Provides fallback defaults if config is missing or malformed
 * 
 * Used by:
 * - ProjectKanbanBoard (support mode column generation)
 * - Task status dropdowns
 * - Task filtering interfaces
 * - Status-based workflow systems
 * 
 * @param {Object} taskConfig - Task collection config from @collections/task
 * @returns {Array} - Array of status option objects {value, label, color?}
 */
export const getTaskStatusOptions = (taskConfig) => {
  const statusField = taskConfig?.fields?.find(field => field.name === 'status');
  
  // Return configured options or sensible defaults
  return statusField?.options || [
    { value: 'not started', label: 'Not Started' },
    { value: 'todo', label: 'To Do' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'complete', label: 'Complete' },
    { value: 'archived', label: 'Archived' }
  ];
};

/**
 * Extract task type options from task configuration
 * 
 * Used by:
 * - Task creation forms
 * - Task filtering by type
 * - Task type-specific workflows
 * 
 * @param {Object} taskConfig - Task collection config from @collections/task
 * @returns {Array} - Array of task type option objects {value, label}
 */
export const getTaskTypeOptions = (taskConfig) => {
  const typeField = taskConfig?.fields?.find(field => field.name === 'task_type');
  
  return typeField?.options || [
    { value: 'task', label: 'Task' },
    { value: 'meeting', label: 'Meeting' },
    { value: 'support', label: 'Support' },
    { value: 'unavailable', label: 'Unavailable' }
  ];
};

/**
 * Extract urgency/priority options from task configuration
 * 
 * Used by:
 * - Task priority assignment
 * - Priority-based filtering
 * - Task prioritization interfaces
 * 
 * @param {Object} taskConfig - Task collection config from @collections/task
 * @returns {Array} - Array of urgency option objects {value, label, color?}
 */
export const getTaskUrgencyOptions = (taskConfig) => {
  const urgencyField = taskConfig?.fields?.find(field => field.name === 'urgency');
  
  return urgencyField?.options || [
    { value: 'low', label: 'Low', color: 'success' },
    { value: 'medium', label: 'Medium', color: 'warning' },
    { value: 'high', label: 'High', color: 'error' }
  ];
};

/**
 * Get default values for task creation based on configuration
 * 
 * Used by:
 * - Task creation forms
 * - CollectionModal for task creation
 * - Bulk task creation
 * 
 * @param {Object} taskConfig - Task collection config from @collections/task
 * @param {Object} overrides - Optional field overrides
 * @returns {Object} - Default field values for new tasks
 */
export const getTaskDefaults = (taskConfig, overrides = {}) => {
  const defaults = {};
  
  // Extract default values from config fields
  taskConfig?.fields?.forEach(field => {
    if (field.defaultValue !== undefined) {
      defaults[field.name] = field.defaultValue;
    }
  });
  
  // Apply common defaults if not specified in config
  const commonDefaults = {
    status: 'todo',
    task_type: 'task',
    is_complete: false,
    order_index: 0,
    ...defaults,
    ...overrides
  };
  
  return commonDefaults;
};

/**
 * Validate task data against configuration schema
 * 
 * Used by:
 * - Task creation/update forms
 * - Data import validation
 * - API endpoint validation
 * 
 * @param {Object} taskData - Task data to validate
 * @param {Object} taskConfig - Task collection config from @collections/task
 * @returns {Object} - {isValid: boolean, errors: string[]}
 */
export const validateTaskData = (taskData, taskConfig) => {
  const errors = [];
  
  if (!taskConfig?.fields) {
    return { isValid: true, errors: [] };
  }
  
  // Check required fields
  taskConfig.fields.forEach(field => {
    if (field.required && (!taskData[field.name] || taskData[field.name] === '')) {
      errors.push(`${field.label || field.name} is required`);
    }
    
    // Validate field types
    if (taskData[field.name] !== undefined && taskData[field.name] !== null) {
      switch (field.type) {
        case 'select':
        case 'status':
          const validOptions = field.options?.map(opt => opt.value) || [];
          if (!validOptions.includes(taskData[field.name])) {
            errors.push(`Invalid ${field.label || field.name}: ${taskData[field.name]}`);
          }
          break;
          
        case 'date':
          if (taskData[field.name] && isNaN(Date.parse(taskData[field.name]))) {
            errors.push(`Invalid date format for ${field.label || field.name}`);
          }
          break;
          
        case 'boolean':
          if (typeof taskData[field.name] !== 'boolean') {
            errors.push(`${field.label || field.name} must be true or false`);
          }
          break;
      }
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Get display properties for a task status
 * 
 * Used by:
 * - Task cards in kanban view
 * - Status badges and chips
 * - Status-based styling
 * 
 * @param {string} status - Task status value
 * @param {Object} taskConfig - Task collection config from @collections/task
 * @returns {Object} - {label, color, icon?}
 */
export const getStatusDisplayProps = (status, taskConfig) => {
  const statusField = taskConfig?.fields?.find(field => field.name === 'status');
  const statusOption = statusField?.options?.find(opt => opt.value === status);
  
  if (statusOption) {
    return {
      label: statusOption.label,
      color: statusOption.color || 'default',
      icon: statusOption.icon
    };
  }
  
  // Fallback display properties
  const fallbacks = {
    'not started': { label: 'Not Started', color: 'default' },
    'todo': { label: 'To Do', color: 'primary' },
    'in_progress': { label: 'In Progress', color: 'info' },
    'complete': { label: 'Complete', color: 'success' },
    'archived': { label: 'Archived', color: 'secondary' }
  };
  
  return fallbacks[status] || { label: status, color: 'default' };
};

/**
 * Get all assignable contacts for task assignment
 * 
 * Used by:
 * - Task assignment dropdowns
 * - Assignee filtering
 * - Task delegation interfaces
 * 
 * Note: This extracts the relation config but doesn't make the query
 * The actual query should be made in the component using this info
 * 
 * @param {Object} taskConfig - Task collection config from @collections/task
 * @returns {Object|null} - Relation config for assigned_id field or null
 */
export const getAssigneeRelationConfig = (taskConfig) => {
  const assignedField = taskConfig?.fields?.find(field => field.name === 'assigned_id');
  
  return assignedField?.relation || null;
};

/**
 * Format task data for display in different contexts
 * 
 * Used by:
 * - Task cards
 * - Task lists
 * - Task exports
 * 
 * @param {Object} task - Raw task data from database
 * @param {Object} taskConfig - Task collection config from @collections/task
 * @returns {Object} - Formatted task data with display properties
 */
export const formatTaskForDisplay = (task, taskConfig) => {
  const formatted = { ...task };
  
  // Add status display properties
  formatted.statusDisplay = getStatusDisplayProps(task.status, taskConfig);
  
  // Format dates
  if (task.due_date) {
    formatted.dueDateFormatted = new Date(task.due_date).toLocaleDateString();
    formatted.isDueToday = new Date(task.due_date).toDateString() === new Date().toDateString();
    formatted.isOverdue = new Date(task.due_date) < new Date() && !task.is_complete;
  }
  
  if (task.start_date) {
    formatted.startDateFormatted = new Date(task.start_date).toLocaleDateString();
  }
  
  // Add urgency display properties
  if (task.urgency) {
    const urgencyOptions = getTaskUrgencyOptions(taskConfig);
    const urgencyOption = urgencyOptions.find(opt => opt.value === task.urgency);
    formatted.urgencyDisplay = urgencyOption || { label: task.urgency, color: 'default' };
  }
  
  return formatted;
};