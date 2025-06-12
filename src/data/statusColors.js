// src/data/statusColors.js

// Task Status Colors with MUI theme support
export const taskStatusColors = {
  'not started': { 
    label: 'Not Started', 
    color: 'grey.600', 
    bg: 'grey.50',
    bgHover: 'grey.100' 
  },
  'todo': { 
    label: 'To Do', 
    color: 'primary.main', 
    bg: 'primary.50',
    bgHover: 'primary.100' 
  },
  'in_progress': { 
    label: 'In Progress', 
    color: 'warning.main', 
    bg: 'warning.50',
    bgHover: 'warning.100' 
  },
  'complete': { 
    label: 'Complete', 
    color: 'success.main', 
    bg: 'success.50',
    bgHover: 'success.100' 
  },
  'blocked': { 
    label: 'Blocked', 
    color: 'error.main', 
    bg: 'error.50',
    bgHover: 'error.100' 
  },
  'cancelled': { 
    label: 'Cancelled', 
    color: 'grey.600', 
    bg: 'grey.50',
    bgHover: 'grey.100' 
  },
  'archived': { 
    label: 'Archived', 
    color: 'grey.500', 
    bg: 'grey.50',
    bgHover: 'grey.100' 
  },
  'unavailable': { 
    label: 'Unavailable', 
    color: 'error.dark', 
    bg: 'error.50',
    bgHover: 'error.100' 
  },
  'meeting': { 
    label: 'Meeting', 
    color: 'secondary.main', 
    bg: 'secondary.50',
    bgHover: 'secondary.100' 
  }
};

// Fallback hex colors for when theme is not available
const fallbackColors = {
  'not started': { color: '#6B7280', bg: '#F3F4F6', label: 'Not Started' },
  'todo': { color: '#3B82F6', bg: '#EFF6FF', label: 'To Do' },
  'in_progress': { color: '#F59E0B', bg: '#FFFBEB', label: 'In Progress' },
  'complete': { color: '#10B981', bg: '#ECFDF5', label: 'Complete' },
  'blocked': { color: '#EF4444', bg: '#FEF2F2', label: 'Blocked' },
  'cancelled': { color: '#6B7280', bg: '#F9FAFB', label: 'Cancelled' },
  'archived': { color: '#9CA3AF', bg: '#F9FAFB', label: 'Archived' },
  'unavailable': { color: '#DC2626', bg: '#FEF2F2', label: 'Unavailable' },
  'meeting': { color: '#8B5CF6', bg: '#F5F3FF', label: 'Meeting' }
};

// Priority Colors
export const priorityColors = {
  'low': { 
    label: 'Low', 
    color: 'success.main', 
    bg: 'success.50' 
  },
  'medium': { 
    label: 'Medium', 
    color: 'warning.main', 
    bg: 'warning.50' 
  },
  'high': { 
    label: 'High', 
    color: 'error.main', 
    bg: 'error.50' 
  },
  'urgent': { 
    label: 'Urgent', 
    color: 'error.dark', 
    bg: 'error.50' 
  }
};

// Milestone Colors (cycling pattern for visual distinction)
export const milestoneColors = [
  '#3B82F6', // Blue
  '#10B981', // Green  
  '#F59E0B', // Orange
  '#8B5CF6', // Purple
  '#EF4444', // Red
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#F97316', // Orange-red
  '#6366F1', // Indigo
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#A855F7', // Violet
];

// Task Type Colors  
export const taskTypeColors = {
  'task': { 
    label: 'Task', 
    color: 'grey.600', 
    bg: 'grey.50' 
  },
  'bug': { 
    label: 'Bug', 
    color: 'error.main', 
    bg: 'error.50' 
  },
  'feature': { 
    label: 'Feature', 
    color: 'secondary.main', 
    bg: 'secondary.50' 
  },
  'support': { 
    label: 'Support', 
    color: 'warning.main', 
    bg: 'warning.50' 
  },
  'meeting': { 
    label: 'Meeting', 
    color: 'info.main', 
    bg: 'info.50' 
  },
  'research': { 
    label: 'Research', 
    color: 'success.light', 
    bg: 'success.50' 
  }
};

// Helper function to resolve theme colors or fall back to hex
const resolveColor = (themeColor, theme = null) => {
  if (!theme || !themeColor) return themeColor;
  
  try {
    // Split the theme color path (e.g., 'primary.main' -> ['primary', 'main'])
    const path = themeColor.split('.');
    let color = theme.palette;
    
    // Navigate through the theme object
    for (const key of path) {
      color = color[key];
      if (!color) break;
    }
    
    return color || themeColor;
  } catch (error) {
    return themeColor;
  }
};

// Helper Functions
export const getStatusColor = (status, config = null, theme = null) => {
  // If config provided, try to get from config first
  if (config?.fields) {
    const statusField = config.fields.find(f => f.name === 'status');
    const option = statusField?.options?.find(opt => opt.value === status);
    if (option) {
      const statusInfo = taskStatusColors[status];
      if (statusInfo) {
        return {
          label: option.label,
          color: resolveColor(statusInfo.color, theme),
          bg: resolveColor(statusInfo.bg, theme),
          bgHover: resolveColor(statusInfo.bgHover, theme)
        };
      }
    }
  }
  
  // Fallback to predefined colors
  const statusInfo = taskStatusColors[status];
  if (statusInfo) {
    return {
      label: statusInfo.label,
      color: resolveColor(statusInfo.color, theme),
      bg: resolveColor(statusInfo.bg, theme),
      bgHover: resolveColor(statusInfo.bgHover, theme)
    };
  }
  
  // Ultimate fallback to hex colors
  const fallback = fallbackColors[status];
  if (fallback) {
    return fallback;
  }
  
  // Default fallback
  return {
    label: status?.charAt(0).toUpperCase() + status?.slice(1) || 'Unknown',
    color: theme ? resolveColor('grey.600', theme) : '#6B7280',
    bg: theme ? resolveColor('grey.50', theme) : '#F3F4F6'
  };
};

export const getPriorityColor = (priority, theme = null) => {
  const priorityInfo = priorityColors[priority];
  if (!priorityInfo) return null;
  
  return {
    label: priorityInfo.label,
    color: resolveColor(priorityInfo.color, theme),
    bg: resolveColor(priorityInfo.bg, theme)
  };
};

export const getTaskTypeColor = (type, theme = null) => {
  const typeInfo = taskTypeColors[type] || taskTypeColors['task'];
  
  return {
    label: typeInfo.label,
    color: resolveColor(typeInfo.color, theme),
    bg: resolveColor(typeInfo.bg, theme)
  };
};

export const getMilestoneColor = (index) => {
  return milestoneColors[index % milestoneColors.length];
};

// Get a lighter version of any color for backgrounds
export const getLighterColor = (color, opacity = 0.1) => {
  // Handle MUI theme colors - if it's a theme token, return as is
  if (typeof color === 'string' && color.includes('.')) {
    return color; // Let MUI handle theme colors
  }
  
  // Handle hex colors
  if (color.startsWith('#')) {
    return `${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
  }
  
  return color;
};

// Hook for using theme colors in components
export const useStatusColors = (theme) => {
  return {
    getStatusColor: (status, config = null) => getStatusColor(status, config, theme),
    getPriorityColor: (priority) => getPriorityColor(priority, theme),
    getTaskTypeColor: (type) => getTaskTypeColor(type, theme)
  };
};

// Status progression order (for sorting)
export const statusOrder = [
  'not started',
  'todo', 
  'in_progress',
  'blocked',
  'complete',
  'cancelled',
  'archived'
];

export default {
  taskStatusColors,
  priorityColors,
  milestoneColors,
  taskTypeColors,
  getStatusColor,
  getPriorityColor,
  getTaskTypeColor,
  getMilestoneColor,
  getLighterColor,
  useStatusColors,
  statusOrder
};