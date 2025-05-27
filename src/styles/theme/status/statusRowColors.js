// lib/constants/statusRowColors.js

export const STATUS_ROW_COLORS = {
  // Task statuses
  'not started': '#fef3c7',    // 🟡 Light yellow
  'todo': '#dbeafe',           // 🔵 Light blue
  'complete': '#d1fae5',       // 🟢 Light green
  'unavailable': '#f3e8ff',    // 🟣 Light purple
  'meeting': '#fed7d7',        // 🔴 Light pink/red
  'archived': '#f3f4f6',       // ⚪ Light gray
  
  // Default fallbacks
  'default': '#ffffff',        // White background
  'unknown': '#fafafa',        // Very light gray
};

// Helper function to get row color based on status
export function getStatusRowColor(status) {
  if (!status) return STATUS_ROW_COLORS.default;
  
  const normalizedStatus = status.toString().toLowerCase().trim();
  return STATUS_ROW_COLORS[normalizedStatus] || STATUS_ROW_COLORS.default;
}

// Helper function to get text color that contrasts well with the background
export function getStatusRowTextColor(backgroundColor) {
  // Most of our light backgrounds work well with dark text
  // You can expand this logic if you add darker backgrounds
  const darkBackgrounds = ['#333333', '#000000', '#1a1a1a'];
  
  return darkBackgrounds.includes(backgroundColor) ? '#ffffff' : '#000000';
}