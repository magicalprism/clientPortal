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

// Milestone colors - auto-assigned in order and repeated
export const milestoneColors = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Orange
  '#8B5CF6', // Purple
  '#EF4444', // Red
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#F97316', // Orange (darker)
  '#EC4899', // Pink
  '#6366F1', // Indigo
];

/**
 * Get status color configuration
 * @param {string} status - Status value
 * @returns {object} Color configuration with color, bg, and label
 */
export const getStatusColor = (status) => {
  if (!status) return statusColors['todo'];
  return statusColors[status.toLowerCase()] || statusColors['todo'];
};

/**
 * Get milestone color by index
 * @param {number} index - Milestone index
 * @returns {string} Hex color code
 */
export const getMilestoneColor = (index) => {
  return milestoneColors[index % milestoneColors.length];
};

/**
 * Get priority color configuration
 * @param {string} priority - Priority value
 * @returns {object} Color configuration
 */
export const getPriorityColor = (priority) => {
  if (!priority) return null;
  return statusColors[priority.toLowerCase()] || null;
};