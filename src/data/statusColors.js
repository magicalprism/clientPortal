// src/data/statusColors.js
export const statusColors = {
  // Task statuses
  'not started': { color: '#64748B', bg: '#F1F5F9', label: 'Not Started' },
  'todo': { color: '#3B82F6', bg: '#EFF6FF', label: 'To Do' },
  'in_progress': { color: '#F59E0B', bg: '#FFFBEB', label: 'In Progress' },
  'complete': { color: '#10B981', bg: '#ECFDF5', label: 'Complete' },
  'archived': { color: '#6B7280', bg: '#F9FAFB', label: 'Archived' },
  'unavailable': { color: '#EF4444', bg: '#FEF2F2', label: 'Unavailable' },
  'meeting': { color: '#8B5CF6', bg: '#F5F3FF', label: 'Meeting' },
  
  // Project statuses
  'pending': { color: '#F59E0B', bg: '#FFFBEB', label: 'Pending' },
  'maintained': { color: '#10B981', bg: '#ECFDF5', label: 'Maintained' },
  'active': { color: '#3B82F6', bg: '#EFF6FF', label: 'Active' },
  
  // Contract statuses
  'draft': { color: '#64748B', bg: '#F1F5F9', label: 'Draft' },
  'approved': { color: '#10B981', bg: '#ECFDF5', label: 'Approved' },
  'sent': { color: '#3B82F6', bg: '#EFF6FF', label: 'Sent' },
  'signed': { color: '#059669', bg: '#ECFDF5', label: 'Signed' },
  
  // Priority colors
  'low': { color: '#10B981', bg: '#ECFDF5', label: 'Low' },
  'medium': { color: '#F59E0B', bg: '#FFFBEB', label: 'Medium' },
  'high': { color: '#EF4444', bg: '#FEF2F2', label: 'High' },
  'urgent': { color: '#DC2626', bg: '#FEF2F2', label: 'Urgent' },
};



// data/statusColors.js

// Task Status Colors
export const taskStatusColors = {
  'not started': { 
    label: 'Not Started', 
    color: '#6B7280', 
    bg: '#F3F4F6',
    bgHover: '#E5E7EB' 
  },
  'todo': { 
    label: 'To Do', 
    color: '#3B82F6', 
    bg: '#EFF6FF',
    bgHover: '#DBEAFE' 
  },
  'in_progress': { 
    label: 'In Progress', 
    color: '#F59E0B', 
    bg: '#FFFBEB',
    bgHover: '#FEF3C7' 
  },
  'complete': { 
    label: 'Complete', 
    color: '#10B981', 
    bg: '#ECFDF5',
    bgHover: '#D1FAE5' 
  },
  'blocked': { 
    label: 'Blocked', 
    color: '#EF4444', 
    bg: '#FEF2F2',
    bgHover: '#FECACA' 
  },
  'cancelled': { 
    label: 'Cancelled', 
    color: '#6B7280', 
    bg: '#F9FAFB',
    bgHover: '#F3F4F6' 
  },
  'archived': { 
    label: 'Archived', 
    color: '#9CA3AF', 
    bg: '#F9FAFB',
    bgHover: '#F3F4F6' 
  },
  'unavailable': { 
    label: 'Unavailable', 
    color: '#DC2626', 
    bg: '#FEF2F2',
    bgHover: '#FECACA' 
  },
  'meeting': { 
    label: 'Meeting', 
    color: '#8B5CF6', 
    bg: '#F5F3FF',
    bgHover: '#EDE9FE' 
  }
};

// Priority Colors
export const priorityColors = {
  'low': { 
    label: 'Low', 
    color: '#10B981', 
    bg: '#ECFDF5' 
  },
  'medium': { 
    label: 'Medium', 
    color: '#F59E0B', 
    bg: '#FFFBEB' 
  },
  'high': { 
    label: 'High', 
    color: '#EF4444', 
    bg: '#FEF2F2' 
  },
  'urgent': { 
    label: 'Urgent', 
    color: '#DC2626', 
    bg: '#FEF2F2' 
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
    color: '#6B7280', 
    bg: '#F3F4F6' 
  },
  'bug': { 
    label: 'Bug', 
    color: '#EF4444', 
    bg: '#FEF2F2' 
  },
  'feature': { 
    label: 'Feature', 
    color: '#8B5CF6', 
    bg: '#F5F3FF' 
  },
  'support': { 
    label: 'Support', 
    color: '#F59E0B', 
    bg: '#FFFBEB' 
  },
  'meeting': { 
    label: 'Meeting', 
    color: '#06B6D4', 
    bg: '#ECFEFF' 
  },
  'research': { 
    label: 'Research', 
    color: '#84CC16', 
    bg: '#F7FEE7' 
  }
};

// Helper Functions
export const getStatusColor = (status, config = null) => {
  // If config provided, try to get from config first
  if (config?.fields) {
    const statusField = config.fields.find(f => f.name === 'status');
    const option = statusField?.options?.find(opt => opt.value === status);
    if (option) {
      return {
        label: option.label,
        color: taskStatusColors[status]?.color || '#6B7280',
        bg: taskStatusColors[status]?.bg || '#F3F4F6'
      };
    }
  }
  
  // Fallback to predefined colors
  return taskStatusColors[status] || {
    label: status?.charAt(0).toUpperCase() + status?.slice(1) || 'Unknown',
    color: '#6B7280',
    bg: '#F3F4F6'
  };
};

export const getPriorityColor = (priority) => {
  return priorityColors[priority] || null;
};

export const getTaskTypeColor = (type) => {
  return taskTypeColors[type] || taskTypeColors['task'];
};

export const getMilestoneColor = (index) => {
  return milestoneColors[index % milestoneColors.length];
};

// Get a lighter version of any color for backgrounds
export const getLighterColor = (color, opacity = 0.1) => {
  return `${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
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
  statusOrder
};